"use server";

import { createAdminClient } from "../appwrite";
import { appwriteConfig } from "../appwrite/config";
import { ID, Query } from "node-appwrite";
import { Groq } from "groq-sdk";
import { Index } from "@upstash/vector";
import { parseStringify } from "../utils";

// eslint-disable-next-line @typescript-eslint/no-require-imports
// const pdf = require("pdf-parse"); // Processed inside helper

// --- LOCAL EMBEDDING PIPELINE (Singleton) ---
let pipelinePromise: any = null;

const getPipeline = async () => {
    if (!pipelinePromise) {
        // Dynamic import to avoid build-time issues
       const { pipeline } = await import("@xenova/transformers");
       pipelinePromise = pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    }
    return pipelinePromise;
}

// Initialize Clients Lazily
const getClients = () => {
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "dummy_key" });
    const index = new Index({
      url: process.env.UPSTASH_VECTOR_REST_URL || "https://dummy.upstash.io",
      token: process.env.UPSTASH_VECTOR_REST_TOKEN || "dummy_token",
    });
    return { groq, index };
  } catch (error) {
    console.error("Failed to initialize AI clients:", error);
    throw new Error("AI Clients failed to initialize. Check environment variables.");
  }
}

/**
 * generateLocalEmbedding
 * Uses Xenova Transformers to create a 384-dimensional vector locally.
 */
const generateLocalEmbedding = async (text: string) => {
    const pipe = await getPipeline();
    const output = await pipe(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data) as number[];
}


/**
 * processFile
 * Triggers the "Intelligence" pipeline:
 * 1. Downloads file from Appwrite
 * 2. Extracts content
 * 3. Summarizes with Groq
 * 4. Embeds LOCALLY (No OpenAI)
 * 5. Indexes in Upstash
 */
export const processFile = async (fileId: string, bucketFileId: string) => {
  try {
    const { storage, databases } = await createAdminClient();
    const { groq, index } = getClients();

    // 1. Get File Metadata to know type
    const file = await storage.getFile(appwriteConfig.bucketId, bucketFileId);
    const fileName = file.name;
    const fileUrl = `${appwriteConfig.endpointUrl}/storage/buckets/${appwriteConfig.bucketId}/files/${bucketFileId}/view?project=${appwriteConfig.projectId}&mode=admin`; // Admin view for processing

    console.log(`Processing ${fileName} (${file.mimeType})...`);

    // 2. Extract & Summarize
    let context = "";
    
    if (file.mimeType.includes("pdf")) {
      const summary = await processPDF(fileUrl, groq);
      context = `Filename: ${fileName} | Type: PDF | Summary: ${summary}`;
    } else if (file.mimeType.includes("image")) {
      const description = await processImage(fileUrl, groq);
      context = `Filename: ${fileName} | Type: Image | Description: ${description}`;
    } else {
      // Generic fallback for other files
      context = `Filename: ${fileName} | Type: ${file.mimeType} | Size: ${file.sizeOriginal}`;
    }

    console.log("Generated Context:", context);

    // 3. Create Embedding (LOCALLY)
    const vector = await generateLocalEmbedding(context);

    // 4. Store in Upstash
    await index.upsert({
      id: fileId, 
      vector: vector,
      metadata: { 
        fileId: fileId,
        bucketFileId: bucketFileId,
        context: context
      }
    });

    console.log(`Successfully indexed ${fileName}`);
    return { success: true };

  } catch (error) {
    console.error("Error processing file:", error);
    return { success: false, error: JSON.stringify(error) };
  }
};

/**
 * Helper: Process PDF
 */
async function processPDF(fileUrl: string, groq: Groq) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdf = require("pdf-parse");
  
  // Download file
  const response = await fetch(fileUrl);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Extract Text
  const data = await pdf(buffer);
  const text = data.text.slice(0, 15000); 

  // Summarize with Groq
  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: "user",
        content: `Analyze this document text. Extract the Title, Main Headings, and a 2-sentence summary. Return ONLY the summary string in this format: "Title: ... | Headings: ... | Summary: ...":\n\n${text}`,
      },
    ],
    model: "llama3-8b-8192", 
  });

  return completion.choices[0]?.message?.content || "No summary available";
}

/**
 * Helper: Process Image
 */
async function processImage(fileUrl: string, groq: Groq) {
  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "Describe this image in 1 detailed sentence for search purposes. " },
          {
            type: "image_url",
            image_url: {
              url: fileUrl,
            },
          },
        ],
      },
    ],
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
  });

  return completion.choices[0]?.message?.content || "No description available";
}

/**
 * getSearchResults
 * Performs semantic search locally
 */
export const getSearchResults = async (query: string) => {
  try {
    const { databases } = await createAdminClient();
    const { index } = getClients();

    // 1. Embed the Query (LOCALLY)
    const vector = await generateLocalEmbedding(query);

    // 2. Search Upstash
    const upstashResult = await index.query({
      vector: vector,
      topK: 5, 
      includeMetadata: true,
      includeVectors: false, 
    });

    // Filter results with low confidence (Noise)
    const validMatches = upstashResult.filter((match: any) => match.score > 0.4);

    if (!validMatches || validMatches.length === 0) {
      return [];
    }

    // 3. Get File IDs from matches
    const fileIds = validMatches.map((match: any) => match.id as string);

    // 4. Fetch File Documents from Appwrite
    const fileDocuments = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.filesCollectionId,
        [Query.equal("$id", fileIds)]
    );

    const files = fileDocuments.documents;

    // 5. CRITICAL: Restore Relevance Order
    // Appwrite returns files in DB order, not Query order. We must re-sort them.
    const sortedFiles = files.sort((a: any, b: any) => {
        return fileIds.indexOf(a.$id) - fileIds.indexOf(b.$id);
    });

    return parseStringify(sortedFiles);

  } catch (error: any) {
    console.error("Error performing semantic search:", error);
    return [];
  }
};

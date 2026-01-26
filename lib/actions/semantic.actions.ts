"use server";

import { createAdminClient } from "../appwrite";
import { appwriteConfig } from "../appwrite/config";
import { ID, Query } from "node-appwrite";
import { Groq } from "groq-sdk";
import { Index } from "@upstash/vector";
import { parseStringify } from "../utils";

// Initialize Clients
const getClients = () => {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const index = new Index({
    url: process.env.UPSTASH_VECTOR_REST_URL,
    token: process.env.UPSTASH_VECTOR_REST_TOKEN,
  });
  return { groq, index };
}

/**
 * processFile
 * Triggers the "Intelligence" pipeline:
 * 1. Downloads file from Appwrite
 * 2. Extracts content
 * 3. Summarizes with Groq
 * 4. Sends TEXT to Upstash (Upstash handles embedding)
 */
export const processFile = async (fileId: string, bucketFileId: string) => {
  try {
    const { storage } = await createAdminClient();
    const { groq, index } = getClients();

    // 1. Get File Metadata to know type
    const file = await storage.getFile(appwriteConfig.bucketId, bucketFileId);
    const fileName = file.name;
    const fileUrl = `${appwriteConfig.endpointUrl}/storage/buckets/${appwriteConfig.bucketId}/files/${bucketFileId}/view?project=${appwriteConfig.projectId}&mode=admin`;

    console.log(`Processing ${fileName} (${file.mimeType})...`);

    // 2. Extract & Summarize
    let context = "";
    let contentToEmbed = "";

    if (file.mimeType.includes("pdf")) {
      const summary = await processPDF(fileUrl, groq);
      context = `Filename: ${fileName} | Type: PDF | Summary: ${summary}`;
      contentToEmbed = summary;
    } else if (file.mimeType.includes("image")) {
      const description = await processImage(fileUrl, groq);
      context = `Filename: ${fileName} | Type: Image | Description: ${description}`;
      contentToEmbed = description;
    } else {
      // Generic fallback
      context = `Filename: ${fileName} | Type: ${file.mimeType} | Size: ${file.sizeOriginal}`;
      contentToEmbed = context;
    }

    console.log("Generated Context:", context);

    // 3. Store in Upstash (Send TEXT, not vector)
    // IMPORTANT: Index must be created with an Embedding Model (e.g., bge-m3)
    await index.upsert({
      id: fileId, 
      data: contentToEmbed, // Sent as text!
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
 * Performs semantic search (Serverless)
 */
export const getSearchResults = async (query: string) => {
  try {
    const { databases } = await createAdminClient();
    const { index } = getClients();

    // 1. Search Upstash (Send Query Text directly)
    const upstashResult = await index.query({
      data: query, // Send text, Upstash embeds it
      topK: 5, 
      includeMetadata: true,
    });

    // Filter results with low confidence
    // Note: Scores might differ between models, 0.5 is a safe generic baseline
    const validMatches = upstashResult.filter((match: any) => match.score > 0.75);

    if (!validMatches || validMatches.length === 0) {
      return [];
    }

    // 2. Get File IDs from matches
    const fileIds = validMatches.map((match: any) => match.id as string);

    // 3. Fetch File Documents from Appwrite
    const fileDocuments = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.filesCollectionId,
        [Query.equal("$id", fileIds)]
    );

    const files = fileDocuments.documents;

    // 4. Restore Relevance Order
    const sortedFiles = files.sort((a: any, b: any) => {
        return fileIds.indexOf(a.$id) - fileIds.indexOf(b.$id);
    });

    return parseStringify(sortedFiles);

  } catch (error: any) {
    console.error("Error performing semantic search:", error);
    return [];
  }
};

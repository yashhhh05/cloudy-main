"use server";

import { InputFile } from "node-appwrite/file";
import { createAdminClient, createSessionClient } from "./appwrite";
import { appwriteConfig } from "./appwrite/config";
import { ID, Models, Query } from "node-appwrite";
import { constructFileUrl, getFileType, parseStringify } from "./utils";
import { revalidatePath } from "next/cache";
import { getCurrentUserData } from "./actions/user.actions";


//create queries to fetch files for current users
//create queries to fetch files for current users
const createQueries = (currenUser: any, types: string[], searchText: string, sort: string, limit?: number) => {
    const queries = [
    Query.or([
        Query.equal("owner", [currenUser.$id]),
        Query.contains("users", [currenUser.email])
    ]),
];

//adding additional query to filter files by type
if(types.length > 0){
    queries.push(
        Query.equal("type", types)
    );
}

if(searchText){
    queries.push(
        Query.contains("name", searchText)
    );
}

if(limit){
    queries.push(
         Query.limit(limit)
    );
}

if(sort){
    const [field, order] = sort.split("-");
    queries.push(
        order === "asc" ? Query.orderAsc(field) : Query.orderDesc(field)
    );
}
    return queries;
}


//upload files to appwrite db and storage
export const uploadFiles = async ({file,accountID,ownerId, path}: {file: File,accountID: string,ownerId: string, path: string}) => {
 
     const {storage,databases} = await createAdminClient();

     try{
        //read the file
        const buffer = await file.arrayBuffer();
        const inputFile = InputFile.fromBuffer(Buffer.from(buffer), file.name);

        const bucketFile = await storage.createFile(
            appwriteConfig.bucketId, //bucket means where we trying to store the file
            ID.unique(),
            inputFile
        );

        //using storage functionality to store metadata
        //using storage functionality to store metadata
        const fileDoc = {
            type: getFileType(bucketFile.name).type,
            name: bucketFile.name,
            url: constructFileUrl(bucketFile.$id),
            extension: getFileType(bucketFile.name).extension,
            size: bucketFile.sizeOriginal,
            owner: ownerId,
            accountId: accountID,
            users: [],
            bucketFileId: bucketFile.$id,
        }

        //createDocument to store files metadata in database
        const newFile = await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.filesCollectionId,
            ID.unique(),
            fileDoc
        )
        .catch(async(e)=>{
            await storage.deleteFile(appwriteConfig.bucketId, bucketFile.$id);
            throw e;
        });

        //to show updated files over where we are listing files
        revalidatePath(path);

        // --- TRIGGER SEMANTIC SEARCH PIPELINE ---
        // We run this in the background (fire & forget) so the user doesn't wait
        try {
           const { processFile } = await import("./actions/semantic.actions");
           void processFile(newFile.$id, bucketFile.$id);
        } catch (err) {
           console.error("Failed to trigger semantic search:", err);
        }

        return parseStringify(newFile);


     }catch(e){
        throw e;
     }
}


//Fetch files from appwrite db

export const getFiles = async ({types = [], searchText = '', sort='$createdAt-desc', limit} : GetFilesProps) => { // Updated signature
    //first get access to db functionality
    const {databases} = await createAdminClient();

    try{

        //Set criteria for fetching files
        const currenUser = await getCurrentUserData();

        if(!currenUser) throw new Error("User not found");

        //create all queries to fetch files for current users

        const queries = createQueries(currenUser, types, searchText, sort, limit);

        //now after getting access to queries make call to db

        const files = await databases.listDocuments(
            appwriteConfig.databaseId, //form which db and collection we want to fetch files
            appwriteConfig.filesCollectionId,
            queries //pass queries to query files
        );

        //Populate owner data means we are fetching owner data from user collection
        const populatedDocuments = await Promise.all(files.documents.map(async (file: Models.Document | any) => {
            if (typeof file.owner === 'string') {
                const owner = await databases.getDocument(
                    appwriteConfig.databaseId,
                    appwriteConfig.userCollectionId,
                    file.owner
                );
                return { ...file, owner };
            }
            return file;
        }));

        files.documents = populatedDocuments as any;

        return parseStringify(files);


    }catch(e){
        console.log("Error fetching files");  
            throw e; 
    }
}


//For renaming files

//path to regenrate
export const renameFile = async ({fileId, name,extension, path}: RenameFileProps) => {
    const {databases} = await createAdminClient();

    try{
        const currentUser = await getCurrentUserData();
        if(!currentUser) throw new Error("Unauthorized");

        const newName = `${name}.${extension}`;

        const file = await databases.getDocument(
            appwriteConfig.databaseId,
            appwriteConfig.filesCollectionId,
            fileId
        );

        if(file.owner !== currentUser.$id && file.owner.$id !== currentUser.$id) {
            throw new Error("Unauthorized: Only owners can rename files");
        }

        const updatedFile = await databases.updateDocument( //updating metadata stored in db not actual file in storage
            appwriteConfig.databaseId,
            appwriteConfig.filesCollectionId,
            fileId,
            {
                name: newName,
                url: constructFileUrl(file.bucketFileId),
            }
        );

        revalidatePath(path); //point to this path
        return parseStringify(updatedFile);


    }catch(e){
        console.log("Error renaming file");
        throw e;
    }
}


export const updateFileUsers = async ({fileId, emails, path, }: {fileId: string, emails: string[], path: string}) => {
    const {databases} = await createAdminClient(); 

    try{
        const currentUser = await getCurrentUserData();
        if(!currentUser) throw new Error("Unauthorized");

        // Fetch original file
        const file = await databases.getDocument(
            appwriteConfig.databaseId,
            appwriteConfig.filesCollectionId,
            fileId
        );

        // Check if user is authorized (Owner or Co-Owner)
        const isOwner = file.owner === currentUser.$id || (file.owner && file.owner.$id === currentUser.$id);

        if(!isOwner) {
            throw new Error("Unauthorized: Only owners can manage shared users");
        }

        // Fetch owner details to protect them
        // Note: file.owner gives us the ID
        const owner = await databases.getDocument(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            file.owner
        );

        // Ensure owner is in the new list
        if(!emails.includes(owner.email)){
            emails.push(owner.email);
        }

        const updatedFile = await databases.updateDocument(
            appwriteConfig.databaseId, 
            appwriteConfig.filesCollectionId, 
            fileId,
            {
                users: emails,
            }
        );

        revalidatePath(path); 
        return parseStringify(updatedFile);  


    }catch(e){
        console.log("Error updating file users", e);
        throw e;
    }
}


export const deleteFile = async ({fileId, bucketFileId, path}: {fileId: string, bucketFileId: string, path: string}) => {
    const {databases, storage} = await createAdminClient(); 

    try{
        const currentUser = await getCurrentUserData();
        if(!currentUser) throw new Error("Unauthorized");

        const file = await databases.getDocument(
            appwriteConfig.databaseId,
            appwriteConfig.filesCollectionId,
            fileId
        );

        const isOwner = file.owner === currentUser.$id || (file.owner && file.owner.$id === currentUser.$id);
        const isSharedUser = file.users.includes(currentUser.email);

        console.log("Delete Action - Details:", {
            fileId,
            currentUserId: currentUser.$id,
            currentUserEmail: currentUser.email,
            fileOwner: file.owner,
            fileUsers: file.users,
            isOwner,
            isSharedUser
        });

        if(!isOwner && !isSharedUser) {
            throw new Error("Unauthorized to delete this file");
        }

        if(isOwner){
            const deletedFile = await databases.deleteDocument(
                appwriteConfig.databaseId, 
                appwriteConfig.filesCollectionId, 
                fileId,
            );
    
            if(deletedFile){
                await storage.deleteFile(
                    appwriteConfig.bucketId,
                    bucketFileId
                );

                // --- CLEANUP UPSTASH VECTOR ---
                try {
                    const { index } = await import("./actions/semantic.actions").then(mod => {
                         // We need to access getClients, but it's not exported.
                         // Easier to just re-instantiate Index here or export getClients.
                         // Let's just create a new Index instance here to be safe and avoid export messy-ness
                         const { Index } = require("@upstash/vector");
                         return { index: new Index({
                            url: process.env.UPSTASH_VECTOR_REST_URL!,
                            token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
                         })};
                    });
                    
                    await index.delete(fileId);
                    console.log(`Debug: Deleted vector for ${fileId}`);
                } catch (err) {
                    console.error("Failed to delete vector from Upstash:", err);
                }
            }
        } else if(isSharedUser){
            // If not owner but shared user, just remove from shared list
            const updatedUsers = file.users.filter((email: string) => email !== currentUser.email);
            
            await databases.updateDocument(
                appwriteConfig.databaseId,
                appwriteConfig.filesCollectionId,
                fileId,
                {
                    users: updatedUsers
                }
            );
        }

        revalidatePath(path); 
        return parseStringify({status: "success"});  


    }catch(e){
        console.log("Error deleting file", e);
        throw e;
    }
}

export const getTotalSpaceUsed = async () => {
    try {
      const { databases } = await createSessionClient();
      const currentUser = await getCurrentUserData();
      if (!currentUser) throw new Error("User is not authenticated.");
  
      const files = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.filesCollectionId,
        [Query.or([
            Query.equal("owner", [currentUser.$id]),
            Query.contains("users", [currentUser.email])
        ])],
      );
  
      const totalSpace = {
        image: { size: 0, latestDate: "" },
        document: { size: 0, latestDate: "" },
        video: { size: 0, latestDate: "" },
        audio: { size: 0, latestDate: "" },
        other: { size: 0, latestDate: "" },
        used: 0,
        all: 2 * 1024 * 1024 * 1024, // 2GB available bucket storage
      };
  
    files.documents.forEach((file) => {
      const fileType = file.type as string; 
      
      // We only care about specific types that match our object keys
      if (fileType === 'image' || fileType === 'document' || fileType === 'video' || fileType === 'audio' || fileType === 'other') {
          totalSpace[fileType].size += file.size;
          totalSpace.used += file.size;

          if (
            !totalSpace[fileType].latestDate ||
            new Date(file.$updatedAt) > new Date(totalSpace[fileType].latestDate)
          ) {
            totalSpace[fileType].latestDate = file.$updatedAt;
          }
      }
    });

    return parseStringify(totalSpace);
  } catch (error) {
    console.error("Error calculating total space used:", error);
    return {
        image: { size: 0, latestDate: "" },
        document: { size: 0, latestDate: "" },
        video: { size: 0, latestDate: "" },
        audio: { size: 0, latestDate: "" },
        other: { size: 0, latestDate: "" },
        used: 0,
        all: 2 * 1024 * 1024 * 1024,
    };
  }
};


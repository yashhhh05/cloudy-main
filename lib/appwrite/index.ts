//node appwrite sdk
import { Account, Avatars, Client, Databases, Storage } from "node-appwrite";
import { cookies } from "next/headers";
import { appwriteConfig } from "./config";

//we creating new client for each request to keep data safe and not exposed tp others

//first need to create a client to initialize services

export const createSessionClient = async()=>{
    const client = new Client()
        .setEndpoint(appwriteConfig.endpointUrl)
        .setProject(appwriteConfig.projectId);

    const session = (await cookies()).get("appwrite-session");

    if(!session || !session.value){
        throw new Error("Unauthorized");
    }
        client.setSession(session.value);

        return{
            get account(){
                return new Account(client);
            },
            get databases(){
                return new Databases(client);
            }
        }
};

//create admin client to manage higher tasks like create users manage databases
export const createAdminClient = async()=>{
    const client = new Client()
        .setEndpoint(appwriteConfig.endpointUrl)
        .setProject(appwriteConfig.projectId)
        .setKey(appwriteConfig.secretKey);

        return{
            get account(){
                return new Account(client);
            },
            get databases(){
                return new Databases(client);
            },
            get storage(){
                return new Storage(client);
            },
            get avatars(){
                return new Avatars(client);
            }
        }
}
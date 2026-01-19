"use server"

//All the server actions
;

import { Databases, ID, Query } from "node-appwrite";
import { createAdminClient, createSessionClient } from "../appwrite";
import { appwriteConfig } from "../appwrite/config";
import { parseStringify } from "../utils";
import { cookies } from "next/headers";
import { avatarUrl } from "@/constants";
import { redirect } from "next/navigation";

//account creation

//User enters full name and email
//checks if the user already exits using email(we will use this to identify if we still needs to create auser documentor not)
//send OTP to users email
//this will send a secret key for creating a sessionStorage.The secret key will be used to create a session
//create a new user document if the user is a new user
//return the users accountid that will be used to complete the registration process
//Verify OTP and authenticate to login

const getUserByEmail = async(email: string)=>{
    console.log("DEBUG: appwriteConfig state:", {
        endpoint: appwriteConfig.endpointUrl,
        project: appwriteConfig.projectId,
        db: appwriteConfig.databaseId,
        usersCollection: appwriteConfig.userCollectionId,
        usersCollectionVar: process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION,
        userCollectionVar: process.env.NEXT_PUBLIC_APPWRITE_USER_COLLECTION
    });
    const {databases} = await createAdminClient(); //to get admin client permissions over database
    const result = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.userCollectionId, [
        Query.equal("email", [email])
    ]);
    return result.total > 0 ? result.documents[0] : null;
}

export const sendEmailOTP = async(email: string)=>{
    const {account} = await createAdminClient();

    try{
        //get access to session
        const session = await account.createEmailToken(ID.unique(), email);

        return session.userId;

    }catch(error){
        console.error("Error creating email token:", error);
        throw error;
    }
}


//create new server action

export const createAccount=async({fullName, email}: {fullName: string; email: string})=>{
    const existingUser = await getUserByEmail(email);

    const accountId = await sendEmailOTP(email);
    
    if(!accountId){
        throw new Error("Failed to send OTP");
    }


    //create user document if user does not exist
    if(!existingUser){
        const {databases} = await createAdminClient(); //to get admin client permissions over database means what actions can be performed on database
        await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            ID.unique(),
            {
                fullName,
                email,
                avatar : avatarUrl,
                accountId,
            }
        )
    }
    return parseStringify({accountId});
}

export const signInUser = async({email}: {email: string})=>{
    try{
        const existingUser = await getUserByEmail(email);

        if(existingUser){
            await sendEmailOTP(email);
            return parseStringify({accountId: existingUser.accountId});
        }

        return parseStringify({accountId: null, error: "User not found"});
    }catch(error){
        console.error("Error signing in user:", error);
        return parseStringify({error: "Failed to sign in", detailedError: error instanceof Error ? error.message : JSON.stringify(error)});
    }
}



export const verifySecret = async({accountId, password}: {accountId: string; password: string})=>{
    try{
        const {account} = await createAdminClient();

        //generate new session for that client
        const session = await account.createSession(accountId, password);

        //set cookie for that session
        (await cookies()).set("appwrite-session", session.secret, {
            path: "/",
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: 60 * 60 * 24 * 7,
        });

        return parseStringify({sessionId : session.$id});


    }catch(error){
        console.error("Error verifying OTP:", error);
        throw error;
    }
}

//get current user data from cookie ie getting access to session ie fetch current user to display email and name in sidebar
//ie to extract user data from active session
export const getCurrentUserData = async()=>{
    const{databases,account} = await createSessionClient();
    const result = await account.get();
    
    //what db we want to access
    const user = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.userCollectionId,
        [
            Query.equal("accountId", result.$id) //where accountID is equal to result.$id
        ]
    );

    if(user.total <=0){
        return null;
    }
    
    //gives currently active user
    return parseStringify(user.documents[0]);
}

//Sign out user
export const deleteSession = async()=>{

    const {account} = await createSessionClient();

    try{

        // Delete the current session
        await account.deleteSession('current');
        
        //delete from cookies
        (await cookies()).delete("appwrite-session");


    }catch(e){
        console.error("Failed to sign out user", e);
        throw e;
    }finally{
        redirect("/sign-in");
    }
}
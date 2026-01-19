# Deployment Guide for Cloudy

This project uses **Next.js** for the frontend and **Appwrite** for the backend (Database, Storage, Auth).

## 1. Prerequisites

Before deploying, ensure you have the following:

- A [Vercel Account](https://vercel.com/)
- An [Appwrite Cloud Account](https://cloud.appwrite.io/) (or a self-hosted instance)
- The project pushed to a GitHub repository.

## 2. Environment Variables

This is the most critical step. Your production deployment must have the same environment variables as your local `.env.local` file.

**Go to your Vercel Project Settings > Environment Variables** and add the following keys.

| Variable Name                           | Description                                                   |
| :-------------------------------------- | :------------------------------------------------------------ |
| `NEXT_PUBLIC_APPWRITE_ENDPOINT`         | Your Appwrite Endpoint (e.g., `https://cloud.appwrite.io/v1`) |
| `NEXT_PUBLIC_APPWRITE_PROJECT`          | Your Appwrite Project ID                                      |
| `NEXT_PUBLIC_APPWRITE_DATABASE`         | Your Appwrite Database ID                                     |
| `NEXT_PUBLIC_APPWRITE_USER_COLLECTION`  | Collection ID for Users                                       |
| `NEXT_PUBLIC_APPWRITE_FILES_COLLECTION` | Collection ID for Files                                       |
| `NEXT_PUBLIC_APPWRITE_BUCKET`           | Storage Bucket ID                                             |
| `NEXT_APPWRITE_SECRET`                  | Your Appwrite API Key (Secret).                               |

> **IMPORTANT:** The `NEXT_APPWRITE_SECRET` is NOT the same as your Project ID. It is an **API Key** you create in the Appwrite Console.
>
> **Required API Key Scopes:**
> When creating the API Key in Appwrite (Overview > API Keys > Add API Key), enable these scopes:
>
> - **Auth**: `users.read`, `users.write`
> - **Database**: `documents.read`, `documents.write`
> - **Storage**: `files.read`, `files.write`
> - **Functions**: (If used)
> - **Execution**: (If used)
>
> If this key is missing scopes, you will see "Unauthorized" (401) errors.

## 3. Appwrite Domain Configuration

For authentication (OAuth, Magic URL, etc.) to work in production, you must whitelist your Vercel domain in Appwrite.

1. Go to your **Appwrite Console**.
2. Select your Project.
3. IN the left sidebar, look for **Integrations/Platforms**.
4. Click on **Add Platform** -> **Web App**.
5. Enter your Vercel domain (e.g., `cloudy-app.vercel.app`) as the **Hostname**.

## 4. Deploying to Vercel

1. Push your code to GitHub.
2. Go to Vercel and **Add New Project**.
3. Import your GitHub repository.
4. **IMPORTANT:** Open the "Environment Variables" section and paste all the variables from Step 2.
5. Click **Deploy**.

## 5. Troubleshooting

### "Missing required environment variable..."

- Check Vercel Logs. You forgot to add one of the variables in Step 2.

### "Unauthorized" / 401 Error

- **Cause:** Your `NEXT_APPWRITE_SECRET` is invalid or missing permissions.
- **Fix:** Go to Appwrite Console > API Keys. Edit your key and ensure it has `users`, `files`, and `documents` scopes enabled.
- **Fix:** Update the variable in Vercel with the correct key.

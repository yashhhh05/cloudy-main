#When you wrap a component with "use client" it means that the component will be executed on the client side. This is useful when you want to use client-side features like the file system or the DOM.

when you wrap folder in (auth) it means that the folder will be executed on the server side. and its not creating a route but a route group it means it will not be counted when navigating through URL

to initalize sdk with appwrite server api endpoint and project id
npm install node-appwrite --save

# React drop-zone package for creating dropsone for file upload

# Appwrite Actions & Functions Explanation

This section details the backend actions and Appwrite client configurations used in the project, specifically found in `lib/actions` and `lib/appwrite`.

## 1. Appwrite Clients (`lib/appwrite/index.ts`)

We define two types of Appwrite clients to handle different levels of access to the Appwrite backend services.

### `createSessionClient()`

- **Purpose**: Represents the currently logged-in user.
- **How it works**:
  - It initializes a standard Appwrite `Client`.
  - It retrieves the `appwrite_session` cookie from the browser request (using `next/headers`).
  - It sets this session on the client using `client.setSession(session.value)`.
- **Use Case**: Any action that needs to be performed _as_ the user (e.g., reading their own files, updating their profile). This ensures data security by adhering to Row Level Security (RLS) policies defined in Appwrite.
- **Services Exposed**: `account`, `databases`.

### `createAdminClient()`

- **Purpose**: Represents a super-user or server-side admin with full access (God mode).
- **How it works**:
  - It initializes an Appwrite `Client` with the `secretKey` (API Key) defined in environment variables.
  - **Crucial Definition**: The `secretKey` grants this client capability to bypass all user permissions and access scopes.
- **Use Case**: Actions that a user shouldn't be able to do directly, or that require global access (e.g., checking if _any_ user exists with an email across the whole DB, creating setup data, managing global storage).
- **Services Exposed**: `account`, `databases`, `storage`, `avatars`.

---

## 2. User Actions (`lib/actions/user.actions.ts`)

This file contains server-side actions responsible for user authentication and account management.

### `getUserByEmail(email)`

- **Client Used**: `//to get admin client permissions over database` -> `createAdminClient()`
  - _Reasoning_: To search the database for a user with a specific email, we need to scan the users collection. A regular user (or guest) typically does not have permission to list all database documents for security reasons.
- **Functionality**:
  1. Grants admin access to the database.
  2. Lists documents in the `userCollectionId`.
  3. Filters the query using `Query.equal("email", [email])`.
  4. **Returns**: The user document object if found (`result.total > 0`), otherwise `null`.

### `sendEmailOTP(email)`

- **Client Used**: `createAdminClient()`
  - _Reasoning_: We are initiating a secure authentication flow.
- **Functionality**:
  1. Accesses the `account` service via admin permissions.
  2. Calls `account.createEmailToken(ID.unique(), email)` to generate an OTP and send it to the user's email.
  3. **Returns**: The `session.userId` (which identifies the account for the OTP verification step).

### `createAccount({ fullName, email })`

- **Purpose**: Orchestrates the entire sign-up/sign-in flow.
- **Logic Flow & Linkage**:
  1. **Check Existence**: Calls the helper function `getUserByEmail(email)` to see if the user is already registered in our database.
  2. **Send OTP**: Calls `sendEmailOTP(email)` to trigger the Appwrite authentication email.
  3. **Create Database Record (New Users Only)**:
     - It checks `if(!existingUser)`.
     - If the user does not exist in our database, it creates a **Admin Client** again to write to the database.
     - Calls `databases.createDocument` in `userCollectionId` with:
       - `fullName`
       - `email`
       - `avatar` (sets a default avatar URL)
       - `accountId` (links the database record to the Appwrite Auth account)
  4. **Return**: Returns the `accountId` (parsed and stringified) so the frontend can proceed to the OTP verification screen.

Appwrite Actions & Functions Explanation

This section details the backend actions and Appwrite client configurations used in the project, specifically found in `lib/actions` and `lib/appwrite`.

## 1. Appwrite Clients (`lib/appwrite/index.ts`)

We define two types of Appwrite clients to handle different levels of access to the Appwrite backend services.

### `createSessionClient()`

- **Purpose**: Represents the currently logged-in user.
- **How it works**:
  - It initializes a standard Appwrite `Client`.
  - It retrieves the `appwrite-session` cookie from the browser request (using `next/headers`).
  - It sets this session on the client using `client.setSession(session.value)`.
- **Use Case**: Any action that needs to be performed _as_ the user (e.g., reading their own files, updating their profile). This ensures data security by adhering to Row Level Security (RLS) policies defined in Appwrite.
- **Services Exposed**: `account`, `databases`.

### `createAdminClient()`

- **Purpose**: Represents a super-user or server-side admin with full access (God mode).
- **How it works**:
  - It initializes an Appwrite `Client` with the `secretKey` (API Key) defined in environment variables.
  - **Crucial Definition**: The `secretKey` grants this client capability to bypass all user permissions and access scopes.
- **Use Case**: Actions that a user shouldn't be able to do directly, or that require global access (e.g., checking if _any_ user exists with an email across the whole DB, creating setup data, managing global storage).
- **Services Exposed**: `account`, `databases`, `storage`, `avatars`.

---

## 2. User Actions (`lib/actions/user.actions.ts`)

This file contains server-side actions responsible for user authentication and account management.

### `getUserByEmail(email)`

- **Client Used**: `//to get admin client permissions over database` -> `createAdminClient()`
  - _Reasoning_: To search the database for a user with a specific email, we need to scan the users collection. A regular user (or guest) typically does not have permission to list all database documents for security reasons.
- **Functionality**:
  1. Grants admin access to the database.
  2. Lists documents in the `userCollectionId`.
  3. Filters the query using `Query.equal("email", [email])`.
  4. **Returns**: The user document object if found (`result.total > 0`), otherwise `null`.

### `sendEmailOTP(email)`

- **Client Used**: `createAdminClient()`
  - _Reasoning_: We are initiating a secure authentication flow.
- **Functionality**:
  1. Accesses the `account` service via admin permissions.
  2. Calls `account.createEmailToken(ID.unique(), email)` to generate an OTP and send it to the user's email.
  3. **Returns**: The `session.userId` (which identifies the account for the OTP verification step).

### `createAccount({ fullName, email })`

- **Purpose**: Orchestrates the entire sign-up/sign-in flow.
- **Logic Flow & Linkage**:
  1. **Check Existence**: Calls the helper function `getUserByEmail(email)` to see if the user is already registered in our database.
  2. **Send OTP**: Calls `sendEmailOTP(email)` to trigger the Appwrite authentication email.
  3. **Create Database Record (New Users Only)**:
     - It checks `if(!existingUser)`.
     - If the user does not exist in our database, it creates a **Admin Client** again to write to the database.
     - Calls `databases.createDocument` in `userCollectionId` with:
       - `fullName`
       - `email`
       - `avatar` (sets a default avatar URL)
       - `accountId` (links the database record to the Appwrite Auth account)
  4. **Return**: Returns the `accountId` (parsed and stringified) so the frontend can proceed to the OTP verification screen.

---

## 3. Authentication Flow (Deep Dive)

This section explains exactly how the login process works, from entering an email to having a secure session cookie.

### The Problem: How do we securely log a user in?

We need a way to verify the user owns the email they claim to have, and then "remember" them for future requests so they don't have to log in every time.

### The Solution: OTP + Session Cookies

#### Step 1: Requesting Access (The OTP)

**Action**: `sendEmailOTP(email)`

1. **Trigger**: User enters their email on the sign-in page.
2. **Backend**:
   - We create an **Admin Client** because a guest user doesn't have permission to create tokens for themselves yet.
   - We call `account.createEmailToken(ID.unique(), email)`.
   - **Appwrite's Job**: Appwrite generates a 6-digit code and emails it to the user.
   - **Return**: We return the `userId`. The frontend needs this `userId` to prove _which_ account is trying to verify the code later.

#### Step 2: Proving Identity (Verification)

**Action**: `verifySecret({ accountId, password })` (where `password` is the OTP code)

1. **Trigger**: User enters the 6-digit code from their email.
2. **Backend**:
   - We create an **Admin Client**.
   - We call `account.createSession(accountId, password)`.
   - **Validation**: Appwrite checks if the `password` (OTP) matches the one sent to `accountId`.
   - **Success**: If it matches, Appwrite returns a **Session Object**. This object contains a `secret` - a long string that acts like a digital ID card.

#### Step 3: Storing the ID Card (Cookies)

**Action**: Setting the Cookie inside `verifySecret`
Once we have the session secret, we need to save it in the browser so it's sent automatically with every future request.

```typescript
(await cookies()).set("appwrite-session", session.secret, {
  path: "/", // Available on all pages
  httpOnly: true, // SECURITY: JavaScript cannot read this (protects against XSS)
  secure: true, // SECURITY: Only sent over HTTPS
  sameSite: "strict", // SECURITY: Protects against CSRF attacks
  maxAge: 60 * 60 * 24 * 7, // Expires in 1 week
});
```

- **Why `httpOnly`?**: This is crucial. It means `document.cookie` in the browser console returns empty. If a hacker injects a script into your site, they _cannot_ steal this cookie.
- **Why `appwrite-session`?**: This is the key name we chose. It MUST match the key we look for in `lib/appwrite/index.ts`.

#### Step 4: Using the ID Card (Session Client)

**Action**: `createSessionClient()`

1. **Trigger**: Any time the user visits the dashboard or uploads a file.
2. **Backend**:
   - It runs `cookies().get("appwrite-session")`.
   - IF the cookie exists: It creates an Appwrite Client and attaches this secret: `client.setSession(session.value)`.
   - **Result**: Appwrite sees this client and says "Ah, this is User John Doe." All database requests are now scoped to John's permissions.
   - IF NO cookie exists: It throws "Unauthorized", and we redirect the user to sign in.

# Appwrite Actions & Functions Explanation

This section details the backend actions and Appwrite client configurations used in the project, specifically found in `lib/actions` and `lib/appwrite`.

## 1. Appwrite Clients (`lib/appwrite/index.ts`)

We define two types of Appwrite clients to handle different levels of access to the Appwrite backend services.

### `createSessionClient()`

- **Purpose**: Represents the currently logged-in user.
- **How it works**:
  - It initializes a standard Appwrite `Client`.
  - It retrieves the `appwrite-session` cookie from the browser request (using `next/headers`).
  - It sets this session on the client using `client.setSession(session.value)`.
- **Use Case**: Any action that needs to be performed _as_ the user (e.g., reading their own files, updating their profile). This ensures data security by adhering to Row Level Security (RLS) policies defined in Appwrite.
- **Services Exposed**: `account`, `databases`.

### `createAdminClient()`

- **Purpose**: Represents a super-user or server-side admin with full access (God mode).
- **How it works**:
  - It initializes an Appwrite `Client` with the `secretKey` (API Key) defined in environment variables.
  - **Crucial Definition**: The `secretKey` grants this client capability to bypass all user permissions and access scopes.
- **Use Case**: Actions that a user shouldn't be able to do directly, or that require global access (e.g., checking if _any_ user exists with an email across the whole DB, creating setup data, managing global storage).
- **Services Exposed**: `account`, `databases`, `storage`, `avatars`.

---

## 2. User Actions (`lib/actions/user.actions.ts`)

This file contains server-side actions responsible for user authentication and account management.

### `getUserByEmail(email)`

- **Client Used**: `//to get admin client permissions over database` -> `createAdminClient()`
  - _Reasoning_: To search the database for a user with a specific email, we need to scan the users collection. A regular user (or guest) typically does not have permission to list all database documents for security reasons.
- **Functionality**:
  1. Grants admin access to the database.
  2. Lists documents in the `userCollectionId`.
  3. Filters the query using `Query.equal("email", [email])`.
  4. **Returns**: The user document object if found (`result.total > 0`), otherwise `null`.

### `sendEmailOTP(email)`

- **Client Used**: `createAdminClient()`
  - _Reasoning_: We are initiating a secure authentication flow.
- **Functionality**:
  1. Accesses the `account` service via admin permissions.
  2. Calls `account.createEmailToken(ID.unique(), email)` to generate an OTP and send it to the user's email.
  3. **Returns**: The `session.userId` (which identifies the account for the OTP verification step).

### `createAccount({ fullName, email })`

- **Purpose**: Orchestrates the entire sign-up/sign-in flow.
- **Logic Flow & Linkage**:
  1. **Check Existence**: Calls the helper function `getUserByEmail(email)` to see if the user is already registered in our database.
  2. **Send OTP**: Calls `sendEmailOTP(email)` to trigger the Appwrite authentication email.
  3. **Create Database Record (New Users Only)**:
     - It checks `if(!existingUser)`.
     - If the user does not exist in our database, it creates a **Admin Client** again to write to the database.
     - Calls `databases.createDocument` in `userCollectionId` with:
       - `fullName`
       - `email`
       - `avatar` (sets a default avatar URL)
       - `accountId` (links the database record to the Appwrite Auth account)
  4. **Return**: Returns the `accountId` (parsed and stringified) so the frontend can proceed to the OTP verification screen.

---

## 3. Authentication Flow (Deep Dive)

This section explains exactly how the login process works, from entering an email to having a secure session cookie.

### The Problem: How do we securely log a user in?

We need a way to verify the user owns the email they claim to have, and then "remember" them for future requests so they don't have to log in every time.

### The Solution: OTP + Session Cookies

#### Step 1: Requesting Access (The OTP)

**Action**: `sendEmailOTP(email)`

1. **Trigger**: User enters their email on the sign-in page.
2. **Backend**:
   - We create an **Admin Client** because a guest user doesn't have permission to create tokens for themselves yet.
   - We call `account.createEmailToken(ID.unique(), email)`.
   - **Appwrite's Job**: Appwrite generates a 6-digit code and emails it to the user.
   - **Return**: We return the `userId`. The frontend needs this `userId` to prove _which_ account is trying to verify the code later.

#### Step 2: Proving Identity (Verification)

**Action**: `verifySecret({ accountId, password })` (where `password` is the OTP code)

1. **Trigger**: User enters the 6-digit code from their email.
2. **Backend**:
   - We create an **Admin Client**.
   - We call `account.createSession(accountId, password)`.
   - **Validation**: Appwrite checks if the `password` (OTP) matches the one sent to `accountId`.
   - **Success**: If it matches, Appwrite returns a **Session Object**. This object contains a `secret` - a long string that acts like a digital ID card.

#### Step 3: Storing the ID Card (Cookies)

**Action**: Setting the Cookie inside `verifySecret`
Once we have the session secret, we need to save it in the browser so it's sent automatically with every future request.

```typescript
(await cookies()).set("appwrite-session", session.secret, {
  path: "/", // Available on all pages
  httpOnly: true, // SECURITY: JavaScript cannot read this (protects against XSS)
  secure: true, // SECURITY: Only sent over HTTPS
  sameSite: "strict", // SECURITY: Protects against CSRF attacks
  maxAge: 60 * 60 * 24 * 7, // Expires in 1 week
});
```

- **Why `httpOnly`?**: This is crucial. It means `document.cookie` in the browser console returns empty. If a hacker injects a script into your site, they _cannot_ steal this cookie.
- **Why `appwrite-session`?**: This is the key name we chose. It MUST match the key we look for in `lib/appwrite/index.ts`.

#### Step 4: Using the ID Card (Session Client)

**Action**: `createSessionClient()`

1. **Trigger**: Any time the user visits the dashboard or uploads a file.
2. **Backend**:
   - It runs `cookies().get("appwrite-session")`.
   - IF the cookie exists: It creates an Appwrite Client and attaches this secret: `client.setSession(session.value)`.
   - **Result**: Appwrite sees this client and says "Ah, this is User John Doe." All database requests are now scoped to John's permissions.
   - IF NO cookie exists: It throws "Unauthorized", and we redirect the user to sign in.

---

## 4. File Upload Process

This section details how a file travels from the user's computer to Appwrite Storage and how we track it in the Database.

### Components Involved

1.  **`Fileuploader.tsx`** (Client Component): Handles drag-and-drop and UI feedback.
2.  **`lib/file.actions.ts`** (Server Action): Handles the secure upload to Appwrite.
3.  **Appwrite Storage**: Where the actual file binary is stored.
4.  **Appwrite Database**: Where the metadata (filename, type, url, owner) is stored.

### The Flow (`Fileuploader.tsx`)

1.  **User Drops a File**: The `useDropzone` hook detects the file.
2.  **Validation**: Client-side check for `MAX_FILE_SIZE` (50MB). If it's too big, we show a toast error and stop.
3.  **Upload Trigger**: We loop through accepted files and call `uploadFiles(...)` for each one.
4.  **Optimistic UI**: We confirm visuals (thumbnails) immediately, but the real status depends on the server action.

### The Server Action (`lib/file.actions.ts`) -> `uploadFiles`

This function does two major things atomically. It uses `createAdminClient()` because a regular user might not have raw write permissions in all contexts, but more importantly, to ensure we can set metadata fields accurately.

#### Step 1: Physical File Storage

```typescript
const bucketFile = await storage.createFile(
  appwriteConfig.bucketId,
  ID.unique(),
  inputFile
);
```

- **What happens**: The file bits are sent to Appwrite Storage bucket.
- **Return**: Appwrite returns a `bucketFile` object containing the unique `$id` of the file in storage. We NEED this `$id` to generate download/view URLs.

#### Step 2: Database Metadata

We don't just dump files; we need to know _who_ uploaded them and _what_ they are.

```typescript
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
};
```

#### Step 3: Transaction Safety

```typescript
.catch(async(e) => {
    await storage.deleteFile(appwriteConfig.bucketId, bucketFile.$id);
    throw e;
});
```

- **Why?**: If Step 2 (Database creation) fails, we have a "zombie" file in storage that no one knows about. This `catch` block deletes the file we just uploaded in Step 1, ensuring our system stays clean.

#### Step 4: Revalidation

`revalidatePath(path)` tells Next.js: "The data for this page ('/dashboard') has changed. Please refresh the list of files so the user sees their new upload immediately."

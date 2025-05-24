# Firebase Function Testing Guide

This document outlines the process for testing the `processEmailAndStoreInFirebase` Firebase Function locally.

## Prerequisites

1. Node.js (v20.x recommended)
2. Java Runtime Environment (JRE) installed
3. Firebase CLI installed globally:
   ```bash
   npm install -g firebase-tools
   ```
4. Firebase project initialized and configured

## Setup

1. Install dependencies:
   ```bash
   cd gcpWebHook-fbase-lGraph/firebase-function
   npm install
   ```

2. Ensure you're logged into Firebase:
   ```bash
   firebase login
   ```

3. Set the project:
   ```bash
   firebase use prizmpoc
   ```

## Running Tests Locally

1. Start the Firebase emulators:
   ```bash
   firebase emulators:start
   ```
   This will start:
   - Functions emulator on port 5001
   - Firestore emulator on port 8080
   - Emulator UI on port 4000

2. In a new terminal, run the test script:
   ```bash
   node test-local.js
   ```

## Expected Results

Successful test execution will:
1. Send a POST request to the local function
2. Store the task in the local Firestore emulator
3. Return a response with:
   ```json
   {
     "success": true,
     "taskId": "<generated-id>",
     "message": "Task stored successfully"
   }
   ```

## Verifying Results

1. Access the Firebase Emulator UI at http://127.0.0.1:4000
2. Navigate to the Firestore section
3. Look for the `tasks` collection
4. Verify the stored document contains all expected fields:
   - Task
   - State
   - Posted
   - vendors
   - Appemail
   - Category
   - custemail
   - If Due Date
   - Task Budget
   - description
   - Full Address
   - Customer Name
   - createdAt
   - updatedAt

## Troubleshooting

1. If you see "Could not spawn `java -version`":
   - Ensure Java is installed and in your PATH
   - Try running `java -version` to verify

2. If you see "Port taken" errors:
   - Kill any running emulator processes:
     ```bash
     pkill -f firebase
     ```
   - Restart the emulators

3. If you see "Not in a Firebase app directory":
   - Ensure you're in the correct directory:
     ```bash
     cd gcpWebHook-fbase-lGraph/firebase-function
     ```
   - Verify firebase.json exists

4. If the function fails to start:
   - Check the emulator logs for detailed error messages
   - Verify all dependencies are installed
   - Ensure the API key in test-local.js matches the one in index.js

## Next Steps

After successful local testing:
1. Commit your changes
2. Push to the repository
3. Deploy to Firebase:
   ```bash
   firebase deploy --only functions
   ``` 
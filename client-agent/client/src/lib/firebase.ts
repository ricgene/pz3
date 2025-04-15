// client-agent/client/src/lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCyO4TZBIILJeJcVXBaB1rEWPWBbhb2WA8",
  authDomain: "prizmpoc.firebaseapp.com",
  projectId: "prizmpoc",
  storageBucket: "prizmpoc.appspot.com",
  messagingSenderId: "324482404818",
  appId: "1:324482404818:web:94291fc32b16cca382b80b",
  measurementId: "G-QGEQ4MTXR7"
};

console.log('Initializing Firebase with project:', firebaseConfig.projectId);

let app: any;
let auth: any;
let analytics: any;
let firestore: any;
let initialized = false;

try {
  // Initialize Firebase
  app = initializeApp(firebaseConfig);
  console.log('Firebase app initialized successfully');

  // Initialize Firebase Authentication
  auth = getAuth(app);
  console.log('Firebase auth initialized');

  // Initialize Analytics
  analytics = getAnalytics(app);
  console.log('Firebase analytics initialized');
  
  // Initialize Firestore
  firestore = getFirestore(app);
  console.log('Firebase Firestore initialized');

  // Set persistence
  setPersistence(auth, browserLocalPersistence)
    .then(() => {
      console.log('Firebase auth persistence set to local');
      initialized = true;
      console.log('Firebase initialization complete');
    })
    .catch((error) => {
      console.error('Error setting auth persistence:', error);
      throw error;
    });
} catch (error) {
  console.error('Error during Firebase initialization:', error);
  throw error;
}

// Export a function to check if Firebase is initialized
export function isFirebaseInitialized() {
  return initialized;
}

// Export the Firebase instances
export { auth, analytics, firestore };
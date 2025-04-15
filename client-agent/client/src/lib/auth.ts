// client-agent/client/src/lib/auth.ts - Modified version
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged as onFirebaseAuthStateChanged
} from "firebase/auth";
import { auth } from "./firebase";
import { logLogin, logLogout } from "./activity-logger";

// Function to register a new user
export const registerUser = async (email: string, password: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Log the registration (which also logs them in)
    await logLogin('registration');
    
    return userCredential.user;
  } catch (error: any) {
    console.error("Error registering user:", error.message);
    throw error;
  }
};

// Function to sign in existing user
export const loginUser = async (email: string, password: string) => {
  try {
    console.log("Attempting login with email:", email);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("Login successful");
    
    // Log the login activity
    await logLogin('email');
    
    return userCredential.user;
  } catch (error: any) {
    console.error("Error logging in:", error.message);
    throw error;
  }
};

// Function to sign out
export const logoutUser = async () => {
  try {
    // Log the logout activity before signing out
    await logLogout();
    
    // Then sign out
    await signOut(auth);
    console.log("User signed out successfully");
  } catch (error: any) {
    console.error("Error signing out:", error.message);
    throw error;
  }
};

// Function to reset password
export const resetPassword = async (email: string) => {
  try {
    const domain = window.location.host;
    const protocol = window.location.protocol;
    const fullUrl = `${protocol}//${domain}/`;  // Redirect to root instead of /auth

    console.log("Password reset attempt:", {
      email,
      domain,
      fullUrl,
    });

    const actionCodeSettings = {
      url: fullUrl,
      handleCodeInApp: true
    };

    console.log("Action code settings:", actionCodeSettings);

    await sendPasswordResetEmail(auth, email, actionCodeSettings);
    console.log("Password reset email sent successfully");
    return true;
  } catch (error: any) {
    console.error("Error sending password reset email:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);

    // Add more specific error messages
    const errorMessage = error.code === 'auth/user-not-found'
      ? "No account found with this email address."
      : error.code === 'auth/invalid-email'
      ? "Please enter a valid email address."
      : error.code === 'auth/too-many-requests'
      ? "Too many password reset attempts. Please try again later."
      : error.code === 'auth/invalid-continue-uri'
      ? "The continue URL provided is invalid. Please contact support."
      : error.code === 'auth/unauthorized-continue-uri'
      ? "The continue URL domain is not authorized. Please contact support."
      : error.code === 'auth/operation-not-allowed'
      ? "Password reset is not enabled for this project. Please contact support."
      : error.message || "Failed to send password reset email. Please try again.";

    // Create a custom error with the code property
    const enrichedError = new Error(errorMessage) as Error & { code?: string };
    enrichedError.code = error.code;
    throw enrichedError;
  }
};

// Auth state change listener
export const onAuthStateChanged = (callback: (user: any) => void) => {
  return onFirebaseAuthStateChanged(auth, callback);
};
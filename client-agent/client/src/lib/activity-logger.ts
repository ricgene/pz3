// client-agent/client/src/lib/activity-logger.ts
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth } from './firebase';

/**
 * Log user activity to Firestore
 * @param activityType Type of activity (login, logout, etc.)
 * @param details Additional details about the activity
 */
export const logUserActivity = async (
  activityType: string, 
  details: Record<string, any> = {}
) => {
  try {
    // Check if user is logged in
    const user = auth.currentUser;
    if (!user) {
      console.warn('Attempted to log activity while not logged in');
      return;
    }

    const db = getFirestore();
    
    // Create the activity log entry
    const activityData = {
      userId: user.uid,
      email: user.email,
      activityType,
      details,
      timestamp: serverTimestamp()
    };

    // Add to Firestore
    const docRef = await addDoc(collection(db, "user_activity"), activityData);
    console.log(`Activity logged with ID: ${docRef.id}`);
    
    return docRef;
  } catch (error) {
    console.error('Error logging user activity:', error);
    // Don't throw the error - we don't want logging failures to break the app
  }
};

/**
 * Log a login event
 * @param method Login method used (email, google, etc.)
 */
export const logLogin = async (method: string = 'email') => {
  return logUserActivity('login', { method });
};

/**
 * Log a logout event
 */
export const logLogout = async () => {
  return logUserActivity('logout');
};

/**
 * Log a navigation event
 * @param path Path the user navigated to
 */
export const logNavigation = async (path: string) => {
  return logUserActivity('navigation', { path });
};
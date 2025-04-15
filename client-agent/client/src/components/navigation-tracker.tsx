// client-agent/client/src/components/navigation-tracker.tsx
import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { logNavigation } from "@/lib/activity-logger";
import { auth } from "@/lib/firebase";

/**
 * Component that tracks navigation events.
 * This should be included in the app's layout.
 */
export function NavigationTracker() {
  const [location] = useLocation();
  const lastLocation = useRef<string | null>(null);

  useEffect(() => {
    // Don't log the initial page load
    if (lastLocation.current !== null) {
      // Only log if user is authenticated
      if (auth.currentUser) {
        logNavigation(location);
      }
    }
    
    // Update last location
    lastLocation.current = location;
  }, [location]);

  // This component doesn't render anything
  return null;
}
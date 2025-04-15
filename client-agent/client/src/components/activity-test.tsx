// client-agent/client/src/components/activity-test.tsx
import { useState, useEffect } from "react";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { firestore, auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ActivityTest() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecentActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const user = auth.currentUser;
      if (!user) {
        setError("You need to be logged in to view activities");
        setLoading(false);
        return;
      }
      
      // Query recent activities for current user
      const activitiesRef = collection(firestore, "user_activity");
      const q = query(
        activitiesRef,
        // Filter by current user
        // where("userId", "==", user.uid),
        orderBy("timestamp", "desc"),
        limit(10)
      );
      
      const querySnapshot = await getDocs(q);
      const activityData: any[] = [];
      
      querySnapshot.forEach((doc) => {
        activityData.push({
          id: doc.id,
          ...doc.data(),
          // Convert timestamp to readable format
          timestamp: doc.data().timestamp?.toDate().toString() || "Unknown time"
        });
      });
      
      setActivities(activityData);
    } catch (err) {
      console.error("Error fetching activities:", err);
      setError("Failed to load activities. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent User Activities</CardTitle>
        <CardDescription>View your recent activities in the application</CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={fetchRecentActivities} 
          disabled={loading}
          className="mb-4"
        >
          {loading ? "Loading..." : "Refresh Activities"}
        </Button>
        
        {error && <p className="text-red-500 mb-2">{error}</p>}
        
        {activities.length === 0 ? (
          <p className="text-muted-foreground">No activities found. Try logging in or performing some actions.</p>
        ) : (
          <div className="space-y-2">
            {activities.map((activity) => (
              <div key={activity.id} className="border p-2 rounded">
                <p><strong>Type:</strong> {activity.activityType}</p>
                <p><strong>User:</strong> {activity.email}</p>
                <p><strong>Time:</strong> {activity.timestamp}</p>
                {activity.details && (
                  <p><strong>Details:</strong> {JSON.stringify(activity.details)}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
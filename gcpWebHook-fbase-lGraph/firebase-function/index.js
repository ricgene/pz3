const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({origin: true});

// Initialize Firebase Admin
admin.initializeApp();

// Initialize Firestore
const db = admin.firestore();

exports.processEmailAndStoreInFirebase2 = functions.https.onRequest((req, res) => {
  // Enable CORS
  return cors(req, res, async () => {
    // Verify API key
    const apiKey = req.headers['x-api-key'];
    if (apiKey !== 'dG7P2xK8nJ9fL3qRvW6zAyB4mS5tE1cX0hQ7jF2pN3gV') {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    try {
      // Get the payload from the request
      const payload = req.body;
      
      // Validate required fields
      if (!payload.Task || !payload.custemail) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      const now = new Date();

      // Create a task document
      const taskData = {
        task: payload.Task,
        state: payload.State,
        posted: new Date(payload.Posted),
        vendors: payload.vendors,
        appEmail: payload.Appemail,
        category: payload.Category,
        customerEmail: payload.custemail,
        dueDate: new Date(payload["If Due Date"]),
        budget: payload["Task Budget"],
        description: payload.description,
        address: payload["Full Address"],
        customerName: payload["Customer Name"],
        status: 'new',
        createdAt: now,
        updatedAt: now
      };

      // Store in Firestore
      const taskRef = await db.collection('tasks').add(taskData);

      // Log success
      console.log(`Task stored with ID: ${taskRef.id}`);

      // Send response
      res.status(200).json({
        success: true,
        taskId: taskRef.id,
        message: 'Task stored successfully'
      });

    } catch (error) {
      console.error('Error processing task:', error);
      res.status(500).json({
        error: 'Internal server error',
        details: error.message
      });
    }
  });
}); 
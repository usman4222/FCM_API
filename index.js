const express = require("express");
const admin = require("firebase-admin");
const bodyParser = require("body-parser");
const cors = require("cors");

// Initialize Express app
const app = express();
app.use(cors());
app.use(bodyParser.json());
require('dotenv').config();

// Load Firebase Service Account
const serviceAccount = require(process.env.GOOGLE_APPLICATION_CREDENTIALS);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});


const db = admin.firestore();


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Chat server running on port ${PORT}`);
});



// ✅ Send Message and Trigger Notification
app.post("/send-message", async (req, res) => {
    const { senderId, receiverId, message, senderName } = req.body;
  
    if (!senderId || !receiverId || !message ) {
      return res.status(400).json({ error: "Missing required fields" });
    }
  
    try {
      // Save message to Firestore
      const chatRef = db.collection("chats").doc(senderId + "_" + receiverId);
      await chatRef.collection("messages").add({
        senderId,
        receiverId,
        message,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
  
      // Send Push Notification
      const notification = {
        notification: {
          title: `New message from ${senderName}`,
          body: message,
        },
        token: 'blobal',
      };
  
      await admin.messaging().send(notification);
  
      res.json({ success: true, message: "Message sent and notification triggered." });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  


  // ✅ Fetch Messages between Two Users
app.get("/get-messages", async (req, res) => {
    const { senderId, receiverId } = req.query;
  
    if (!senderId || !receiverId) {
      return res.status(400).json({ error: "Missing required fields" });
    }
  
    try {
      const chatRef = db.collection("chats").doc(senderId + "_" + receiverId);
      const messagesSnapshot = await chatRef.collection("messages").orderBy("timestamp", "asc").get();
  
      const messages = messagesSnapshot.docs.map((doc) => doc.data());
  
      res.json({ success: true, messages });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
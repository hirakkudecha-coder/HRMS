// Import Mongoose to connect to MongoDB database
const mongoose = require('mongoose');

// Function to connect to the MongoDB database
const connectDB = async () => {
  try {
    // Try to connect using the URI from environment variables
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/hrms');
    
    // Log a success message with the host name
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    // If connection fails, log the error and exit the server process
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

// Export the connection function so we can use it in server.js
module.exports = connectDB;

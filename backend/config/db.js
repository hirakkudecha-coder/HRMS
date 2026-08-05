// Import Mongoose to connect to MongoDB database
const mongoose = require('mongoose');
const dns = require('dns');

// Force Node.js to use IPv4 DNS resolution for MongoDB Atlas SRV lookup on Render
dns.setDefaultResultOrder('ipv4first');

// Function to connect to the MongoDB database
const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/hrms';
    console.log(`Attempting connection to: ${uri.replace(/:([^@]+)@/, ':****@')}`);
    
    // Try to connect using the URI from environment variables
    const conn = await mongoose.connect(uri);
    
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

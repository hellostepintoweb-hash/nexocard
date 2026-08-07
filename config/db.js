const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Checks for MONGO_URI first, then MONGODB_URI
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

    if (!uri) {
      console.error('CRITICAL ERROR: No MongoDB URI found in process.env!');
      console.error('Make sure dotenv is loaded and your .env file has MONGO_URI set.');
      process.exit(1);
    }

    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Atlas Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
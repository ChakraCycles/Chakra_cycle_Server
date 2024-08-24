const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

async function connectDB() {
  try {
    // Logging environment variables for debugging
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${process.env.DB_NAME}`, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log('MongoDB connected!!');
  } catch (error) {
    console.log('MONGODB connection failed', error);
    process.exit(1);
  }
};

module.exports = { connectDB };

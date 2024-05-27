import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    // Logging environment variables for debugging
    console.log('MONGODB_URI:', process.env.MONGODB_URI);
    console.log('DB_NAME:', process.env.DB_NAME);

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

export { connectDB };

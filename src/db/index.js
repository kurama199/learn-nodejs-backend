import mongoose from 'mongoose';
import { DB_NAME } from '../constants.js';

const connectToDB = async () => {
  try {
    console.log(process.env.MONGODB_URI);
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );
    console.log(
      `\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.error('MONGODB Error while connecting to DB', error);
    process.exit(1);
  }
};

export default connectToDB;

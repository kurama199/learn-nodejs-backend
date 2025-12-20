import mongoose from 'mongoose';
import { DB_NAME } from '../constants.js';

const connectToDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );
    console.log(
      `\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}\n`
    );
  } catch (error) {
    console.error('MONGODB Error while connecting to DB', error);
    process.exit(1);
  }
};

export default connectToDB;

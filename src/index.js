import dotenv from 'dotenv';
import connectToDB from './db/index.js';

dotenv.config({
  path: './.env',
});

connectToDB();

import dotenv from 'dotenv';
import connectToDB from './db/index.js';
import { app, PORT } from './app.js';

dotenv.config({
  path: './.env',
});

connectToDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to the database:', err);
  });

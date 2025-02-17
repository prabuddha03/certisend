const mongoose = require('mongoose');
const dotenv = require('dotenv');

require('dotenv').config(); 

dotenv.config({ path: './.env' });

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);


const connectDB = async () => {
  try {
    await mongoose.connect(DB, {});
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
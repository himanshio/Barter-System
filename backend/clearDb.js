import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/skillswap')
    .then(async () => {
        console.log('Connected. Clearing users...');
        await mongoose.connection.db.collection('users').deleteMany({});
        console.log('Users cleared.');
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });

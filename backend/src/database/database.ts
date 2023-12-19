import mongoose from 'mongoose';
import { Logger } from "../config";
import { MongoMemoryServer } from 'mongodb-memory-server';
import { User } from './models';

async function connectDB(mongoURI: string) {
    const logger = new Logger();
    try {
        await mongoose.connect(mongoURI);
        logger.info('MongoDB connected');
    } catch (error) {
        logger.error(`${error.message}: ${error.stack}`);
        process.exit(1);
    }
};

export default async function instantiateDB() {
    const mongoServer = new MongoMemoryServer();
    await mongoServer.start();
    const mongoUri = mongoServer.getUri();
    await connectDB(mongoUri);

    initializeDb();
};

async function initializeDb() {
    const user1 = new User({
        userId: 1,
        login: 'mathis-girault',
        isAdmin: true,
    });
    await user1.save();

    console.log('Sample data populated');
};

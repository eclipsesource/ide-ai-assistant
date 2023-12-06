import mongoose from 'mongoose';
import { Logger } from "../config";
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Discussion, User, Message } from '../models';

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

    samplePopulateDB();
};


export async function samplePopulateDB() {
    const user1 = new User({
        userId: 1,
        email: 'test@test.db',
        isAdmin: true,
    });
    await user1.save();

    const discussion1 = new Discussion({
        discussionId: 1,
        userId: user1,
        projectName: "theia",
    });
    await discussion1.save();

    const message1 = new Message({
        messageId: 1,
        discussionId: discussion1,
        role: 'user',
        content: 'Hello',
    });
    message1.save();
    
    console.log('Sample data populated');
};

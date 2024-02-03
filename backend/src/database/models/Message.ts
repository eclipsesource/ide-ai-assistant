import { Document, Schema, Types, model } from 'mongoose';
import { Discussion } from './Discussion';

// Define the TypeScript type for Message document
interface MessageType extends Document {
    discussionId: Types.ObjectId;
    role: 'assistant' | 'user';
    content: string;
    date: Date;
    rating?: number;
}

const MessageSchema = new Schema({
    discussionId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Discussion',
    },
    role: {
        type: String,
        required: true,
        enum: ['assistant', 'user'],
    },
    content: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now(),
    },
    rating: {
        type: Number,
    },
});

MessageSchema.pre('save', async function (next) {
    const discussion = await Discussion.findById(this.discussionId);
    if (!discussion) {
        throw new Error('Discussion not found');
    }
    next();
});

const Message = model<MessageType>('Message', MessageSchema);

export { Message, MessageType };

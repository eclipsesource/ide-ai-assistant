import mongoose from 'mongoose';
import Discussion from './Discussion';

const MessageSchema = new mongoose.Schema({
    messageId: {
        type: Number,
        required: true,
        unique: true,
    },
    discussionId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Discussion',
    },
    role: {
        type: String,
        required: true,
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
    feedback: {
        type: String,
    },
});

MessageSchema.pre('save', async function(next) {
    const discussion = await Discussion.findById(this.discussionId);
    if (!discussion) {
        throw new Error('Discussion not found');
    }
    if (this.role !== "assistant" && this.role !== "user") {
        throw new Error('The user role should be either "user" or "assistant"');
    }
    next();
});

const Message = mongoose.model('Message', MessageSchema);

export default Message;

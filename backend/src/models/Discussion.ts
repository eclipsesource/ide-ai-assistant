import mongoose from 'mongoose';
import User from './User';

const DiscussionSchema = new mongoose.Schema({
    discussionId: {
        type: Number,
        required: true,
        unique: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    projectName: {
        type: String,
        required: true,
    },
});

DiscussionSchema.pre('save', async function(next) {
    const user = await User.findById(this.userId);
    if (!user) {
        throw new Error('User not found');
    }
    next();
});

const Discussion = mongoose.model('Discussion', DiscussionSchema);

export default Discussion;

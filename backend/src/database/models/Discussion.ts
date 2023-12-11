import { Document, Schema, Types, model } from 'mongoose';
import { User } from './User';

// Define the TypeScript type for Discussion document
interface DiscussionType extends Document {
    discussionId: number;
    userId: Types.ObjectId;
    projectName: string;
}

const DiscussionSchema = new Schema({
    discussionId: {
        type: Number,
        required: true,
        unique: true,
    },
    userId: {
        type: Schema.Types.ObjectId,
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

const Discussion = model<DiscussionType>('Discussion', DiscussionSchema);

export { Discussion, DiscussionType};

import { Document, Schema, Types, model } from 'mongoose';
import { User, Project } from './index';

// Define the TypeScript type for Discussion document
interface DiscussionType extends Document {
    userId: Types.ObjectId;
    projectId: Types.ObjectId;
}

const DiscussionSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    projectId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Project',
    },
});

DiscussionSchema.pre('save', async function(next) {
    const user = await User.findById(this.userId);
    if (!user) {
        throw new Error('User not found');
    }
    const project = await Project.findById(this.projectId);
    if (!project) {
        throw new Error('Project not found');
    }
    next();
});

const Discussion = model<DiscussionType>('Discussion', DiscussionSchema);

export { Discussion, DiscussionType};

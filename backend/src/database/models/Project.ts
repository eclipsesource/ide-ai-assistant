import { Document, Schema, model, Types } from 'mongoose';

interface ProjectType extends Document {
    projectName: string;
    projectLeads: Types.ObjectId[];
}

const ProjectSchema = new Schema({
    projectName: {
        type: String,
        required: true,
        unique: true,
    },
    projectLeads: [{
        type: Schema.Types.ObjectId,
        ref: 'User',
    }],
});

const Project = model<ProjectType>('Project', ProjectSchema);

export { Project, ProjectType };

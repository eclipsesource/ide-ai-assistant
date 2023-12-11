import { Document, model, Schema } from 'mongoose';

interface UserType extends Document {
    userId: number;
    email: string;
    userRole: string;
}

const UserSchema = new Schema({
    userId: {
        type: Number,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    userRole: {
        type: String,
        default: "user",
        enum: ["user", "admin", "project-lead"],
    },
});

const User = model<UserType>('User', UserSchema);

export { User, UserType };

import { Document, model, Schema } from 'mongoose';

interface UserType extends Document {
    userId: number;
    login: string;
    userRole: string;
}

const UserSchema = new Schema({
    userId: {
        type: Number,
        required: true,
        unique: true,
    },
    login: {
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

import { Document, model, Schema } from 'mongoose';

interface UserType extends Document {
    login: string;
    userRole: string;
}

const UserSchema = new Schema({
    login: {
        type: String,
        required: true,
        unique: true,
    },
    userRole: {
        type: String,
        default: "user",
        enum: ["user", "admin"],
    },
});

const User = model<UserType>('User', UserSchema);

export { User, UserType };

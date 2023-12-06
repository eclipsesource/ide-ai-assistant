import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
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
    },
});

UserSchema.pre('save', async function(next) {
    // 'this' refers to the message document
    if (this.userRole !== "user" && this.userRole !== "admin" && this.userRole !== "project-lead") {
        throw new Error('The user role should be either "user", "admin" or "project-lead"');
    }
    next();
});

const User = mongoose.model('User', UserSchema);

export default User;

import { User, UserType } from '../models/User';

export class UserService {

    public async getAllUsers(): Promise<UserType[]> {
        const users = await User.find();
        return users;
    }

    public async createUser(user: Partial<UserType>): Promise<UserType> {
        const newUser = new User(user);
        const savedUser = await newUser.save() as UserType;
        return savedUser;
    }

    public async createUserByEmail(email: string): Promise<UserType> {
        if (await this.getUserByEmail(email) != null) {
            throw new Error('User already exists');
        }
        const userId = await this.getNextUserId();
        const newUser = new User({ userId, email });
        const savedUser = await newUser.save() as UserType;
        return savedUser;
    }

    public async getUserById(userId: string): Promise<UserType | null> {
        const user = await User.findById(userId);
        return user;
    }

    public async getUserByEmail(email: string): Promise<UserType | null> {
        const user = await User.findOne({ email });
        return user;
    }

    public async updateUser(userId: string, updates: Partial<UserType>): Promise<UserType | null> {
        const user = await User.findByIdAndUpdate(userId, updates, { new: true });
        return user;
    }

    public async deleteUser(userId: string): Promise<boolean> {
        const result = await User.findByIdAndDelete(userId);
        return !!result;
    }

    private async getNextUserId(): Promise<number> {
        const users = await this.getAllUsers();
        if (users.length == 0) {
            return 1;
        }
        const lastUser = users[users.length - 1];
        return lastUser.userId + 1;
    }

}

import { User, UserType } from '../models';

export class UserService {

    public async getAllUsers(): Promise<UserType[]> {
        const users = await User.find();
        return users;
    }

    public async createUserByLogin(login: string): Promise<UserType> {
        if (await this.getUserByLogin(login) != null) {
            throw new Error('User already exists');
        }
        const newUser = new User({ login });
        const savedUser = await newUser.save() as UserType;
        return savedUser;
    }

    public async createUser(login: string, role: string): Promise<UserType> {
        if (await this.getUserByLogin(login) != null) {
            throw new Error('User already exists');
        }
        const newUser = new User({ login, userRole: role });
        const savedUser = await newUser.save() as UserType;
        return savedUser;
    }

    public async getUserById(userId: string): Promise<UserType | null> {
        const user = await User.findById(userId);
        return user;
    }

    public async getUserByLogin(login: string): Promise<UserType | null> {
        const user = await User.findOne({ login });
        return user;
    }

    public async deleteUser(userId: string): Promise<boolean> {
        const result = await User.findByIdAndDelete(userId);
        return !!result;
    }

}

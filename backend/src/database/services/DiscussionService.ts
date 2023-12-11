import { UserType } from '../models';
import { Discussion, DiscussionType } from '../models/Discussion';

export class DiscussionService {

    public async createDiscussion(user: UserType, projectName: string): Promise<DiscussionType> {
        const discussionId = await this.getNextDiscussionId();
        const discussionSchema = { discussionId: discussionId, userId: user, projectName: projectName }
        const newDiscussion = new Discussion(discussionSchema);
        const savedDiscussion = await newDiscussion.save() as DiscussionType;
        return savedDiscussion;
    }

    public async getDiscussion(user: UserType, project_name: string): Promise<DiscussionType | null> {
        const discussion = await Discussion.findOne({ userId: user, projectName: project_name });
        return discussion;
    }

    public async getDiscussionById(discussionId: string): Promise<DiscussionType | null> {
        const discussion = await Discussion.findById(discussionId);
        return discussion;
    }

    public async updateDiscussion(discussionId: string, updates: Partial<DiscussionType>): Promise<DiscussionType | null> {
        const discussion = await Discussion.findByIdAndUpdate(discussionId, updates, { new: true });
        return discussion;
    }

    public async deleteDiscussion(discussionId: string): Promise<boolean> {
        const result = await Discussion.findByIdAndDelete(discussionId);
        return !!result;
    }

    public async getDiscussionsByUserId(userId: string): Promise<DiscussionType[]> {
        const discussions = await Discussion.find({ userId });
        return discussions;
    }

    public async getAllDiscussions(): Promise<DiscussionType[]> {
        const discussions = await Discussion.find();
        return discussions;
    }

    private async getNextDiscussionId(): Promise<number> {
        const discussions = await this.getAllDiscussions();
        if (discussions.length == 0) {
            return 1;
        }
        const lastDiscussion = discussions[discussions.length - 1];
        return lastDiscussion.discussionId + 1;
    }

}

import { Discussion, DiscussionType, ProjectType, UserType } from '../models';

export class DiscussionService {

    public async createDiscussion(user: UserType, project: ProjectType): Promise<DiscussionType> {
        const newDiscussion = new Discussion({ userId: user, projectId: project });
        const savedDiscussion = await newDiscussion.save() as DiscussionType;
        return savedDiscussion;
    }

    public async getAllDiscussions(): Promise<DiscussionType[]> {
        const discussions = await Discussion.find();
        return discussions;
    }

    public async getDiscussion(user: UserType, project: ProjectType): Promise<DiscussionType | null> {
        const discussion = await Discussion.findOne({ userId: user, projectId: project });
        return discussion;
    }

    public async getDiscussionById(discussionId: string): Promise<DiscussionType | null> {
        const discussion = await Discussion.findById(discussionId);
        return discussion;
    }

    public async getDiscussionByProject(project: ProjectType): Promise<DiscussionType[]> {
        const discussions = await Discussion.find({ projectId: project });
        return discussions;
    }

    public async deleteDiscussion(discussionId: string): Promise<boolean> {
        const result = await Discussion.findByIdAndDelete(discussionId);
        return !!result;
    }

}

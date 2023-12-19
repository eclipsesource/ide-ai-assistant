import { Message, MessageType, Discussion, DiscussionType, ProjectType } from '../models';

export class MessageService {
    public async createMessage(
        discussion: DiscussionType,
        role: string,
        content: string,
        rating: number | null,
        feedback: string | null
    ): Promise<MessageType> {

        const newMessage = new Message({
            discussionId: discussion,
            role: role,
            content: content,
            rating: rating,
            feedback: feedback,
        });
        const savedMessage = await newMessage.save() as MessageType;
        return savedMessage;
    }

    public async getMessageById(messageId: string): Promise<MessageType | null> {
        const message = await Message.findById(messageId);
        return message;
    }

    public async updateMessage(messageId: string, updates: Partial<MessageType>): Promise<MessageType | null> {
        const message = await Message.findByIdAndUpdate(messageId, updates, { new: true });
        return message;
    }

    public async deleteMessage(messageId: string): Promise<boolean> {
        const result = await Message.findByIdAndDelete(messageId);
        return !!result;
    }

    public async getMessagesByDiscussionId(discussionId: string): Promise<MessageType[]> {
        const messages = await Message.find({ discussionId });
        return messages;
    }

    public async getMessagesByProjectName(project: ProjectType): Promise<MessageType[]> {
        const discussions = await Discussion.find({ projectId: project._id });
    
        // Find messages related to the discussions
        const messages = await Message.find({ discussionId: { $in: discussions } });
    
        return messages;
    }

    public async getAllMessages(): Promise<MessageType[]> {
        const messages = await Message.find();
        return messages;
    }

}

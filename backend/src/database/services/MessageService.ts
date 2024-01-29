import { Message, MessageType, Discussion, DiscussionType, ProjectType } from '../models';

export class MessageService {
    public async createMessage(
        discussion: DiscussionType,
        role: string,
        content: string,
        rating: number | null,
    ): Promise<MessageType> {

        const newMessage = new Message({
            discussionId: discussion,
            role: role,
            content: content,
            rating: rating,
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

    public async getAllMessages(): Promise<MessageType[]> {
        const messages = await Message.find();
        return messages;
    }

    public async getAllMessagesByProject(project: ProjectType): Promise<MessageType[]> {
        const messages = [];
        const discussions = await Discussion.find({ projectId: project });
        for (const discussion of discussions) {
            const discussionMessages = await Message.find({ discussionId: discussion });
            messages.push(...discussionMessages);
        }
        return messages;
    }

}

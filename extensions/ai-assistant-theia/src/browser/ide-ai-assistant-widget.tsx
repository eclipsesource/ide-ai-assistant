import { MessageService } from '@theia/core';
import { Message } from '@theia/core/lib/browser';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import * as React from 'react';
import { AIAssistantBackendService, chatMessage } from '../common/protocol';

@injectable()
export class IdeAiAssistantWidget extends ReactWidget {
    messages: chatMessage[] = [{ content: 'Hello, how can I help you?', role: 'assistant' }]
    currentMessage: string = '';
    changeApiKey: string = '';
    protected APIKey: string = '';

    static readonly ID = 'ide-ai-assistant:widget';
    static readonly LABEL = 'AI Assistant';

    @inject(AIAssistantBackendService)
    protected readonly aiAssistantService!: AIAssistantBackendService;

    @inject(MessageService)
    protected readonly messageService!: MessageService;

    @postConstruct()
    protected init(): void {
        this.doInit()
    }

    protected async doInit(): Promise<void> {
        this.id = IdeAiAssistantWidget.ID;
        this.title.label = IdeAiAssistantWidget.LABEL;
        this.title.caption = IdeAiAssistantWidget.LABEL;
        this.title.closable = true;
        this.title.iconClass = 'fa fa-window-maximize'; // example widget icon.;
        this.update();
    }

    render(): React.ReactElement {
        const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
            this.currentMessage = event.target.value;
            this.update();
        }

        const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
            if (event.key === 'Enter') {
                this.sendMessage();
            }
        }

        return <div id='widget-container'>
            <div className="chat-container">
                <div className='chat-messages-container'>
                    {this.messages.map((message, index) => {
                        return <>
                            <div key={index} className={`chat-message-container ${message.role == "user" ? "user-message-container" : "bot-message-container"}`}>
                                <div className={`chat-message-box ${message.role == "user" ? "user-message-box" : "bot-message-box"}`}>
                                    {message.content}
                                </div>
                            </div>
                        </>
                    })}
                </div>
                <div className='chat-inputs-container'>
                    <input id='chat-input' type='text' value={this.currentMessage} onChange={handleChange} onKeyDown={handleKeyDown} />
                    <button id='displayMessageButton' onClick={() => this.sendMessage()}>Send</button>
                </div>
            </div>
        </div>
    }

    protected async APIRequest(): Promise<chatMessage> {
        const newMessage = await this.aiAssistantService.getAnswer(this.currentMessage).then((response) => {
            return response;
        })
            .catch((error) => {
                // Improve error handling later...
                console.error('Error getting answer:', error);
                return { content: 'Error getting answer', role: 'error' };
            });
        return newMessage;
    }

    protected async sendMessage(): Promise<void> {
        if (this.currentMessage != '') {
            this.messages.push({ content: (document.getElementById('chat-input') as HTMLInputElement).value, role: 'user' });
            const newMessage = await this.APIRequest();
            if (newMessage.role != 'error') {
                this.currentMessage = '';
                this.messages.push(newMessage);
                this.messageService.info('Congratulations: IdeAiAssistant Widget Successfully Created!');
                this.update();
            } else {
                this.messageService.error('Error: API Failed');
            }
        }
    }

    protected onActivateRequest(msg: Message): void {
        super.onActivateRequest(msg);
        const htmlElement = document.getElementById('displayMessageButton');
        if (htmlElement) {
            htmlElement.focus();
        }
    }
}

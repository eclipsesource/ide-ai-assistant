import * as React from 'react';
import { injectable, postConstruct, inject } from '@theia/core/shared/inversify';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { MessageService } from '@theia/core';
import { Message } from '@theia/core/lib/browser';

type chatMessage = {
    message: string,
    from: string
}

@injectable()
export class IdeAiAssistantWidget extends ReactWidget {
    messages: chatMessage[] = [{ message: 'Hello, how can I help you?', from: 'bot' }]
    currentMessage: string = '';


    static readonly ID = 'ide-ai-assistant:widget';
    static readonly LABEL = 'AI Assistant';

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
            console.log("hei " + event.target.value);
            this.currentMessage = event.target.value;
            this.update();
        }

        const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
            if (event.key === 'Enter') {
                this.displayMessage();
            }
        }

        return <div id='widget-container'>
            <div className="chat-container">
                <div className='chat-messages-container'>
                    {this.messages.map((message, index) => {
                        return <>
                            <div key={index} className={`chat-message-container ${message.from == "user" ? "user-message-container" : "bot-message-container"}`}>
                                <div className={`chat-message-box ${message.from == "user" ? "user-message-box" : "bot-message-box"}`}>
                                    {message.message}
                                </div>
                            </div>
                        </>
                    })}
                </div>
                <div className='chat-inputs-container'>
                    <input id='chat-input' type='text' value={this.currentMessage} onChange={handleChange} onKeyDown={handleKeyDown} />
                    <button id='displayMessageButton' onClick={() => this.displayMessage()}>Send</button>
                </div>
            </div>
        </div>
    }

    protected displayMessage(): void {
        if (this.currentMessage != '') {
            console.log((document.getElementById('chat-input') as HTMLInputElement).value)
            this.messages.push({ message: (document.getElementById('chat-input') as HTMLInputElement).value, from: 'user' });
            this.currentMessage = '';
            this.messages.push({ message: `Response: ${this.messages[this.messages.length - 1].message}`, from: 'bot' });
            this.messageService.info('Congratulations: IdeAiAssistant Widget Successfully Created!');
            this.update();
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

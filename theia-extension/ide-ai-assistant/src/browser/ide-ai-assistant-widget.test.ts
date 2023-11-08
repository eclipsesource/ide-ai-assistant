import 'reflect-metadata';
// import { MessageService } from '@theia/core';
// import { ContainerModule, Container } from '@theia/core/shared/inversify';
// import { IdeAiAssistantWidget } from './ide-ai-assistant-widget';
// import { render } from '@testing-library/react'

describe('IdeAiAssistantWidget', () => {

    // let widget: IdeAiAssistantWidget;

    // beforeEach(async () => {
    //     const module = new ContainerModule( bind => {
    //         bind(MessageService).toConstantValue({
    //             info(message: string): void {
    //                 console.log(message);
    //             }
    //         } as MessageService);
    //         bind(IdeAiAssistantWidget).toSelf();
    //     });
    //     const container = new Container();
    //     container.load(module);
    //     widget = container.resolve<IdeAiAssistantWidget>(IdeAiAssistantWidget);
    // });

    // it('should render react node correctly', async () => {
    //     const element = render(widget.render());
    //     expect(element.queryByText('AI ASSISTANT')).toBeTruthy();
    // });

    it('Initial empty mock test', () => {
        expect(true).toBeTruthy();
    });
});


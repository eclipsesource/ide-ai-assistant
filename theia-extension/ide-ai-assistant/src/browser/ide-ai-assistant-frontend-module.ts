import { FrontendApplicationContribution, WebSocketConnectionProvider, WidgetFactory, bindViewContribution } from '@theia/core/lib/browser';
import { ContainerModule, injectable } from '@theia/core/shared/inversify';
import '../../src/browser/style/index.css';
import { AIASSISTANTSERVICE_BACKEND_PATH, AIAssistantBackendService, BackendClient } from '../common/protocol';
import { IdeAiAssistantContribution } from './ide-ai-assistant-contribution';
import { IdeAiAssistantWidget } from './ide-ai-assistant-widget';

export default new ContainerModule(bind => {
    // AI Assistant Backend services
    bind(BackendClient).to(BackendClientImpl).inSingletonScope();
    bind(AIAssistantBackendService).toDynamicValue(ctx => {
        const connection = ctx.container.get(WebSocketConnectionProvider);
        const backendClient: BackendClient = ctx.container.get(BackendClient);
        return connection.createProxy<AIAssistantBackendService>(AIASSISTANTSERVICE_BACKEND_PATH, backendClient);
    }).inSingletonScope();


    bindViewContribution(bind, IdeAiAssistantContribution);
    bind(FrontendApplicationContribution).toService(IdeAiAssistantContribution);
    bind(IdeAiAssistantWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(ctx => ({
        id: IdeAiAssistantWidget.ID,
        createWidget: () => ctx.container.get<IdeAiAssistantWidget>(IdeAiAssistantWidget)
    })).inSingletonScope();
});

@injectable()
class BackendClientImpl implements BackendClient {
    getName(): Promise<string> {
        return new Promise(resolve => resolve('Client'));
    }

}

import { ConnectionHandler, RpcConnectionHandler } from '@theia/core';
import { ContainerModule } from '@theia/core/shared/inversify';
import { BackendClient, AIAssistantBackendService, AIASSISTANTSERVICE_BACKEND_PATH } from '../common/protocol';
import { OpenAIAssistantImpl } from './openAI-backend-service';

export default new ContainerModule(bind => {
    bind(AIAssistantBackendService).to(OpenAIAssistantImpl).inSingletonScope()
    bind(ConnectionHandler).toDynamicValue(ctx =>
        new RpcConnectionHandler<BackendClient>(AIASSISTANTSERVICE_BACKEND_PATH, client => {
            const server = ctx.container.get<OpenAIAssistantImpl>(AIAssistantBackendService);
            server.setClient(client);
            client.onDidCloseConnection(() => server.dispose());
            return server;
        })
    ).inSingletonScope(); 
});

import { ContainerModule, Container } from '@theia/core/shared/inversify';
import { OpenAIAssistantImpl } from './services/openAI-service';
import { AIAssistantBackendService } from './protocol';


const containerModule = new ContainerModule(bind => {
    bind(AIAssistantBackendService).to(OpenAIAssistantImpl).inSingletonScope();
});

let container = new Container();
container.load(containerModule);

export default container;

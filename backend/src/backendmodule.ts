import { Container, ContainerModule } from 'inversify';
// import { Container, ContainerModule} from 'inversify-express-utils/node_modules/inversify/';
import { Logger } from './config';
import { AIAssistantController } from './controllers/AIAssistant.Controller';
import { DatabaseController } from './controllers/DatabaseController';
import { AIAssistantBackendService } from './protocol';
import { OpenAIAssistantImpl } from './services/openAI-service';
import DatabaseService from './services/database-service';


const containerModule = new ContainerModule(bind => {
    bind(AIAssistantBackendService).to(OpenAIAssistantImpl).inSingletonScope();
    container.bind<AIAssistantController>(AIAssistantController).toSelf();
    container.bind<DatabaseController>(DatabaseController).toSelf();
    container.bind(DatabaseService).toSelf();
    container.bind(Logger).toSelf();
});

const container = new Container();
container.load(containerModule);

export default container;

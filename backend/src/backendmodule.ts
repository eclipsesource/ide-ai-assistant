import { Container, ContainerModule } from 'inversify';
// import { Container, ContainerModule} from 'inversify-express-utils/node_modules/inversify/';
import { Logger } from './config';
import { AIAssistantController } from './controllers/AIAssistant.Controller';
import { DatabaseController } from './controllers/DatabaseController';
import { GithubOauthController } from './controllers/GithubOauthController';
import { AIAssistantBackendService, OAuthService } from './protocol';
import { OpenAIAssistantImpl } from './services/openAI-service';
import GithubOAuthService from './services/github-oauth-service';
import DatabaseService from './services/database-service';
import GithubService from './services/github-service';
import { GithubController } from './controllers/GithubController';


const containerModule = new ContainerModule(bind => {
    bind(AIAssistantBackendService).to(OpenAIAssistantImpl).inSingletonScope();
    bind(OAuthService).to(GithubOAuthService).inSingletonScope();
    container.bind<AIAssistantController>(AIAssistantController).toSelf();
    container.bind<DatabaseController>(DatabaseController).toSelf();
    container.bind<GithubOauthController>(GithubOauthController).toSelf();
    container.bind<GithubController>(GithubController).toSelf();
    container.bind(DatabaseService).toSelf();
    container.bind(GithubService).toSelf();
    container.bind(Logger).toSelf();
});

const container = new Container();
container.load(containerModule);

export default container;

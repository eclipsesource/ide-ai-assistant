import { ContainerModule } from '@theia/core/shared/inversify';
import { IdeAiAssistantWidget } from './ide-ai-assistant-widget';
import { IdeAiAssistantContribution } from './ide-ai-assistant-contribution';
import { bindViewContribution, FrontendApplicationContribution, WidgetFactory } from '@theia/core/lib/browser';

import '../../src/browser/style/index.css';

export default new ContainerModule(bind => {
    bindViewContribution(bind, IdeAiAssistantContribution);
    bind(FrontendApplicationContribution).toService(IdeAiAssistantContribution);
    bind(IdeAiAssistantWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(ctx => ({
        id: IdeAiAssistantWidget.ID,
        createWidget: () => ctx.container.get<IdeAiAssistantWidget>(IdeAiAssistantWidget)
    })).inSingletonScope();
});

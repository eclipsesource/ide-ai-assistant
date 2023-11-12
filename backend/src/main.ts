import express, { Request, Response } from "express";
import { PORT } from "./config";
import container from "./backendmodule";
import { AIASSISTANTSERVICE_BACKEND_PATH, AIAssistantBackendService, MessageRequest, MessageResponse } from "./protocol";
import logger from "./loggers/logger";
import morganMiddleware from "./loggers/morgan";

const app = express();
app.use(express.json());
app.use(morganMiddleware);

const AIAssistantService = container.get<AIAssistantBackendService>(AIAssistantBackendService);

app.post(AIASSISTANTSERVICE_BACKEND_PATH, (req: Request<MessageRequest>, res: Response<MessageResponse>) => {
  AIAssistantService.getAnswer(req.body).then((result) => {
    res.send(result);
  }).catch((error) => {
    res.send({ error: error });
  });
});

app.listen(PORT, () => {
  logger.info(`Server Listening on PORT: ${PORT}`);
});

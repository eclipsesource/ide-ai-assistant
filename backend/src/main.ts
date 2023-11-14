// The order of these imports is important
import 'reflect-metadata';

import { InversifyExpressServer } from 'inversify-express-utils';
//
import container from "./backendmodule";
import { Logger, PORT, serverConfig, serverErrorConfig } from "./config";
import './controllers/AIAssistant.Controller';
import * as dotenv from "dotenv";

dotenv.config();

export async function Bootstrap() {
  const server = new InversifyExpressServer(container);
  server.setConfig(serverConfig);
  process.env.NODE_ENV === "production" ? server.setErrorConfig(serverErrorConfig): null;

  const app = server.build();
  app.listen(PORT, () =>
    new Logger().info(`Server up on http://127.0.0.1:${PORT}/`)
  );
}

Bootstrap();

/**
 * Entry point of the application.
 * Configures and starts the server.
 * @packageDocumentation
 */
import * as dotenv from "dotenv";
import 'reflect-metadata';
dotenv.config();

import { InversifyExpressServer } from 'inversify-express-utils';

import container from "./backendmodule";
import { Logger, PORT, serverConfig, serverErrorConfig } from "./config";
import './controllers/AIAssistant.Controller';


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
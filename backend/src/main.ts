
/**
 * Entry point of the application.
 * Configures and starts the server.
 * @packageDocumentation
 */
import * as dotenv from "dotenv";
import 'reflect-metadata';
import { InversifyExpressServer } from 'inversify-express-utils';
import { Logger, PORT, serverConfig, serverErrorConfig } from "./config";
import container from "./backendmodule";
import instantiateDB from './database/database';
import './controllers/AIAssistant.Controller';
import cors from "cors";

dotenv.config({ path: 'secrets.env' });
dotenv.config();

export async function Bootstrap() {
  await instantiateDB();

  const server = new InversifyExpressServer(container);
  server.setConfig(serverConfig);
  server.setErrorConfig(serverErrorConfig);

  const app = server.build();
  app.use(cors());
  
  app.listen(PORT, () =>
    new Logger().info(`Server up on PORT: ${PORT}/`)
  );
}

Bootstrap();
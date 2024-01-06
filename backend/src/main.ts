
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
import './controllers/AIAssistant.Controller';
import { MongoDB } from "./database/database";

dotenv.config({ path: 'secrets.env' });
dotenv.config();

export async function Bootstrap() {
  const database = new MongoDB();
  await database.start();

  const server = new InversifyExpressServer(container);
  server.setConfig(serverConfig);
  server.setErrorConfig(serverErrorConfig);

  const app = server.build();

  app.listen(PORT, () =>
    new Logger().info(`Server up on PORT: ${PORT}/`)
  );
}

Bootstrap();

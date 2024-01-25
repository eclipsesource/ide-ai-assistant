import { Application } from "express";
import "reflect-metadata";
import { InversifyExpressServer } from "inversify-express-utils";
import request from "supertest";
import container from "../backendmodule";
import { Logger, serverConfig } from "../config";
import {
  AIASSISTANTSERVICE_BACKEND_PATH,
  AIAssistantBackendService,
  MessageRequest,
  MessageResponse,
  OAuthService,
} from "../protocol";
import { Server } from "http";
import { Database, MongoDB } from "../database/database";

class FakeLogger extends Logger {
  error = jest.fn(() => {});
  info = jest.fn(() => {});
  warn = jest.fn(() => {});
  debug = jest.fn(() => {});
  http = jest.fn(() => {});
}

describe("Create the App with controllers and check that we get a response", () => {
  let app: Application;
  let testServer: Server;
  let database: Database;

  const expectedAnswer: MessageResponse = {
    content: { role: "assistant", content: "Hello" },
  };
  const fakeAIAssistant = {
    getAnswer: jest.fn(() => Promise.resolve(expectedAnswer)),
    summarizeMessages: jest.fn(() => Promise.resolve([])),
  };

  const fakeOAuthService: OAuthService = {
    getUserLogin: jest.fn((_) => Promise.resolve("test")),
    getAccessToken: jest.fn((_) => Promise.resolve("test")),
    validateToken: jest.fn((_) => Promise.resolve(true)),
  };

  beforeAll(async () => {
    container.snapshot();
    const server = new InversifyExpressServer(container);
    container.rebind<Logger>(Logger).toConstantValue(new FakeLogger());
    container
      .rebind<AIAssistantBackendService>(AIAssistantBackendService)
      .toConstantValue(fakeAIAssistant);
    container
      .rebind<OAuthService>(OAuthService)
      .toConstantValue(fakeOAuthService);
    server.setConfig(serverConfig);

    app = server.build();
    testServer = app.listen(3001);

    database = new MongoDB();
    await database.start();
  });

  afterAll(async () => {
    testServer?.close();
    await database?.close();
  });

  const validRequestsList: MessageRequest[] = [
    {
      messages: [{ role: "user", content: "Hello" }],
      access_token: "dummy",
      project_name: "dummy",
    },
    {
      messages: [{ role: "user", content: "Hello" }],
      access_token: "dummy",
      project_name: "dummy",
      projectContext: "dummy",
    },
    {
      messages: [{ role: "user", content: "Hello" }],
      access_token: "dummy",
      project_name: "dummy",
      userContext: "dummy",
    },
    {
      messages: [{ role: "user", content: "Hello" }],
      access_token: "dummy",
      project_name: "dummy",
      projectContext: "dummy",
      userContext: "dummy",
    },
  ];

  const badRequestsList = [
    {
      request: {
        message: [{ role: "user", content: "Hello" }],
        access_token: "dummy_token",
        project_name: "dummy_project",
      },
      description: "Missing 'messages' field",
    },
    {
      request: {
        messages: [],
        access_token: "dummy_token",
        project_name: "dummy_project",
      },
      description: "Empty 'messages' field",
    },
    {
      request: {
        messages: [{ role: "user", content: "Hello" }],
        access_token: "dummy_token",
      },
      description: "Empty 'project_name' field",
    },
    {
      request: {
        messages: [{ role: "user", content: "Hello" }],
        project_name: "dummy_project",
      },
      description: "Empty 'access_token' field",
    },
  ];

  for (let validRequest of validRequestsList) {
    it(`Should return a valid output of the AIAssistant with valid request: ${JSON.stringify(
      validRequest
    )}`, async () => {
      const response = await request(app)
        .post(AIASSISTANTSERVICE_BACKEND_PATH)
        .send(validRequest);

      expect(response.status).toBe(200);
      expect(response.body.content).toEqual(expectedAnswer.content);
      expect(response.body.messageId).toBeDefined();
    });
  }

  for (let { request: requestItem, description } of badRequestsList) {
    it(`Should return an HTTP 400 on bad request: ${description}`, async () => {
      const response = await request(app)
        .post(AIASSISTANTSERVICE_BACKEND_PATH)
        .send(requestItem);

      expect(response.status).toBe(400);
      expect(response).toHaveProperty("error");
      expect(response.error).not.toBe("");
      expect(response.body).toEqual({});
    });
  }
});

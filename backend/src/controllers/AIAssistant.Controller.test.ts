import { Application } from "express";
import 'reflect-metadata';
import { InversifyExpressServer } from "inversify-express-utils";
import request from 'supertest';
import container from "../backendmodule";
import { BaseException, Logger, serverConfig, serverErrorConfig } from "../config";
import { AIASSISTANTSERVICE_BACKEND_PATH, AIAssistantBackendService, MessageRequest, MessageResponse } from "../protocol";
import { Server } from "http";

class FakeLogger extends Logger {
    error = jest.fn(() => { });
    info = jest.fn(() => { });
    warn = jest.fn(() => { });
    debug = jest.fn(() => { });
    http = jest.fn(() => { });
};


describe("Create the App with controllers and check that we get a response", () => {
    let app: Application;
    let testServer: Server;
    const expectedAnswer: MessageResponse = { content: { role: "assistant", content: "Hello" } };
    const fakeAIAssistant = {
        getAnswer: jest.fn(() => Promise.resolve(expectedAnswer))
    };

    beforeAll(async () => {
        container.snapshot();
        const server = new InversifyExpressServer(container);
        container.rebind<Logger>(Logger).toConstantValue(new FakeLogger());
        container.rebind<AIAssistantBackendService>(AIAssistantBackendService).toConstantValue(fakeAIAssistant);
        server.setConfig(serverConfig);

        app = server.build();
        testServer = app.listen(3001);
    });

    afterAll(() => {
        container.restore();
        if (testServer) {
            testServer.close();
        }
    });


    it("Should return the output of the AIAssistant with request {messages: [...]}", async () => {


        const RandomValidRequest: MessageRequest = {
            messages: [{ role: "user", content: "Hello" }]
        };

        //Act
        const response = await request(app).post(AIASSISTANTSERVICE_BACKEND_PATH).send(RandomValidRequest);

        //Assert
        expect(response.body).toEqual(expectedAnswer);
        expect(response.status).toBe(200);
    });

    it("Should return the output of the AIAssistant with request {messages: [...], projectContext: 'someString', userContext: 'someString'}", async () => {
        const RandomValidRequest: MessageRequest = {
            messages: [{ role: "user", content: "Hello" }],
            projectContext: "SomeProject",
            userContext: "SomeUser"
        };

        //Act
        const response = await request(app).post(AIASSISTANTSERVICE_BACKEND_PATH).send(RandomValidRequest);

        //Assert
        expect(response.status).toBe(200);
        expect(response.body).toEqual(expectedAnswer);
    });

    describe("Should return an HTTP 400 on bad requests", () => {
        const badRequests = [
            { request: { message: [{ role: "user", content: "Hello" }] }, description: "Missing 'messages' field" },
            { request: { messages: [] }, description: "Empty 'messages' field" }
        ];

        for (const { request: requestItem, description } of badRequests) {
            it(description, async () => {
                const response = await request(app).post(AIASSISTANTSERVICE_BACKEND_PATH).send(requestItem);

                expect(response.status).toBe(400);
                expect(response).toHaveProperty('error');
                expect(response.error).not.toBe('');
                expect(response.body).toEqual({});
            });
        }
    });
});

describe("Create the App with controllers and check that we get a response", () => {
    let app: Application;
    let testServer: Server;
    const expectedAnswer = { error: { type: "someType", statusCode: 500, errorMessage: "This is a test for errors" } };
    const fakeAIAssistant = {
        getAnswer: () => {
            throw new BaseException(
                expectedAnswer.error.type,
                expectedAnswer.error.statusCode,
                expectedAnswer.error.errorMessage
            );
        }
    };

    beforeAll(async () => {
        container.snapshot();
        const server = new InversifyExpressServer(container);
        container.rebind<Logger>(Logger).toConstantValue(new FakeLogger());
        container.rebind<AIAssistantBackendService>(AIAssistantBackendService)
            .toConstantValue(fakeAIAssistant);

        server.setConfig(serverConfig);
        server.setErrorConfig(serverErrorConfig);

        app = server.build();
        testServer = app.listen(3001);
    });

    afterAll(() => {
        container.restore();
        if (testServer) {
            testServer.close();
        }
    });

    it("Should give a response with the appropriate error code from AIAssistantService if it fails", async () => {
        const RandomValidRequest: MessageRequest = {
            messages: [{ role: "user", content: "Hello" }]
        };

        //Act
        const response = await request(app).post(AIASSISTANTSERVICE_BACKEND_PATH).send(RandomValidRequest);

        //Assert
        expect(container.get<Logger>(Logger).error).toHaveBeenCalled();
        expect(response.body).toEqual(expectedAnswer);
        expect(response.status).toBe(expectedAnswer.error.statusCode);
    });
});
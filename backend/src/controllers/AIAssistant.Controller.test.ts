import { Application } from "express";
import 'reflect-metadata';
import { InversifyExpressServer } from "inversify-express-utils";
import request from 'supertest';
import container from "../backendmodule";
import { serverConfig } from "../config";
import { AIASSISTANTSERVICE_BACKEND_PATH, AIAssistantBackendService, MessageRequest } from "../protocol";
import { Server } from "http";


describe("Create the App with controllers and check that we get a response", () => {
    let app: Application;
    let testServer: Server;
    const expectedAnswer = { error: "", content: { role: "assistant", content: "Hello" } };
    const fakeAIAssistant = {
        getAnswer: jest.fn().mockReturnValue(expectedAnswer)
    };

    beforeAll(async () => {
        container.snapshot();
        const server = new InversifyExpressServer(container);
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
        expect(response.status).toBe(200);
        expect(response.body).toEqual(expectedAnswer);
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
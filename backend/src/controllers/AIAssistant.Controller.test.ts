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

    beforeAll(async () => {
        container.snapshot();
        const server = new InversifyExpressServer(container);
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


    it("Should return the output of the AIAssistant", async () => {
        // Arrange
        const expectedAnswer = { error: "", content: { role: "assistant", content: "Hello" } };
        const fakeAIAssistant = {
            getAnswer: jest.fn().mockReturnValue(expectedAnswer)
        };

        container.rebind<AIAssistantBackendService>(AIAssistantBackendService).toConstantValue(fakeAIAssistant);

        const RandomValidRequest: MessageRequest = {
            messages: [{ role: "user", content: "Hello" }]
        };

        //Act
        const response = await request(app).post(AIASSISTANTSERVICE_BACKEND_PATH).send(RandomValidRequest);

        //Assert
        expect(response.status).toBe(200);
        expect(response.body).toEqual(expectedAnswer);
    });

    it("Should return the output of the AIAssistant also when there is an error", async () => {
        // Arrange
        const expectedAnswer = { error: "Some Error", content: { role: "assistant", content: "An error has occured. So we are not able to answer your question." } };
        const fakeAIAssistant = {
            getAnswer: jest.fn().mockReturnValue(expectedAnswer)
        };

        container.rebind<AIAssistantBackendService>(AIAssistantBackendService).toConstantValue(fakeAIAssistant);

        const RandomValidRequest: MessageRequest = {
            messages: [{ role: "user", content: "Hello" }]
        };

        //Act
        const response = await request(app).post(AIASSISTANTSERVICE_BACKEND_PATH).send(RandomValidRequest);

        //Assert
        expect(response.status).toBe(200);
        expect(response.body).toEqual(expectedAnswer);
    });
});
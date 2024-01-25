import mongoose from 'mongoose';
import { Logger } from "../config";
import { MongoMemoryServer } from 'mongodb-memory-server';
import fs from 'fs';
import path from 'path';
import { UserService, ProjectService, DiscussionService, MessageService } from './services';

export const Database = Symbol('Database');

export interface Database {
  start(): Promise<void>;
  close(): Promise<void>;
  connect(uri: string): Promise<void>;
}

interface UsersInFile {
  login: string;
  role: string;
  projectLeads: string[];
}

export class MongoDB implements Database {
  protected logger = new Logger();
  protected usersFilePath = 'users.json';
  protected users: UsersInFile[];

  constructor() {
    try {
      const filePath = path.join(__dirname, this.usersFilePath);
      const data = fs.readFileSync(filePath, 'utf8');
      this.users = JSON.parse(data);
    } catch (error) {
      this.logger.error(`Error reading users file: ${error.message}`);
    }
  }

  async start() {
    const mongoServer = new MongoMemoryServer();
    await mongoServer.start();
    const mongoUri = mongoServer.getUri();

    // Connect
    await this.connect(mongoUri);

    // Populate with users data
    await this.initializeDb();
    await this.samplePopulate();
  }

  async close() {
    try {
      await mongoose.connection.close();
      this.logger.info('MongoDB connection closed');
    } catch (error) {
      this.logger.error(`Error closing MongoDB connection: ${error.message}`);
    }
  }

  async connect(mongoURI: string) {
    try {
      await mongoose.connect(mongoURI);
      this.logger.info('MongoDB connected');
    } catch (error) {
      this.logger.error(`${error.message}: ${error.stack}`);
      process.exit(1);
    }
  };

  async initializeDb() {
    const userService = new UserService();
    const projectService = new ProjectService();

    // Instantiate users
    if (!this.users) {
      return;
    }

    try {
      await Promise.all(this.users.map(async ({ login, role, projectLeads }) => {

        const user = await userService.createUser(login, role);

        if (projectLeads) {
          // Instantiate projects leads
          await Promise.all(projectLeads.map(async (project_name) => {
            let project = await projectService.getProjectByName(project_name);
            if (!project) {
              project = await projectService.createProject(project_name);
            }

            projectService.addProjectLead(project, user);
          }));
        }
      }));

      this.logger.info('Data instantiation completed.');
    } catch (error) {
      this.logger.error(`Error during data instantiation: ${error}`);
    }
  };

  async samplePopulate() {
    const userService = new UserService();
    const projectService = new ProjectService();
    const discussionService = new DiscussionService();
    const messageService = new MessageService();

    const testUser = await userService.getUserByLogin("test");
    const defaultProject = await projectService.getProjectByName("@theia/monorepo");
    if (!testUser || !defaultProject) {
      throw new Error("User or project test not found");
    }

    const testDiscussion = await discussionService.createDiscussion(testUser, defaultProject);
    messageService.createMessage(testDiscussion, "user", "test message", null, null);
    messageService.createMessage(testDiscussion, "assistant", "test response", null, null);
    messageService.createMessage(testDiscussion, "user", "test request 2", null, null);
    messageService.createMessage(testDiscussion, "assistant", "test response 2", null, null);
  }
}

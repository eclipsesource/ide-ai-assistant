import mongoose from 'mongoose';
import { Logger } from "../config";
import { MongoMemoryServer } from 'mongodb-memory-server';
import fs from 'fs';
import path from 'path';
import { UserService, ProjectService } from './services';

export const Database = Symbol('Database');

export interface Database {
  start(): Promise<void>;
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

        const user = await userService.createUser(login, role)

        if (projectLeads) {
          // Instantiate projects leads
          await Promise.all(projectLeads.map(async (projectName) => {
            let project = await projectService.getProjectByName(projectName);
            if (!project) {
              project = await projectService.createProject(projectName);
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
}

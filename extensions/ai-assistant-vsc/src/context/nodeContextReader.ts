import * as path from 'path';
import * as fs from 'fs';
import { AbstractContextReader } from './abstractContextReader';

/**
 * Concrete implementation of AbstractContextReader for Node.js projects.
 */
export class NodeContextReader extends AbstractContextReader {
  /**
   * Object to store project context information.
   */
  public package: {
    name?: string;
    description?: string;
    engines?: { [key: string]: string }
  } = {};

  /**
   * Constructor for NodeContextReader.
   * @param rootDir - Path to the root of opened project in IDE workspace
   */
  constructor(rootDir: string | undefined) {
    super(rootDir);
    const projectFile = path.join(`${rootDir}/package.json`);

    // Read and parse the content of the project file
    try {
      const contextFileContent: string = fs.readFileSync(projectFile, 'utf8');
      this.package = JSON.parse(contextFileContent);
    } catch (error: any) {
      console.error(`Error reading project file: ${error.message}`);
      this.package = {};
    }
  }

  /**
   * Get project-specific context information.
   * @returns An array of strings representing project context.
   */
  generateProjectContext(): string[] {
    const projectContext: string[] = [];
    
    projectContext.push("The project is based on Node.js");

    if (this.package.name) {
      projectContext.push(`The user is working on the project named ${this.package.name}`);
    }

    if (this.package.description) {
      projectContext.push(`The project description is ${this.package.description}`);
    }

    if (this.package.engines) {
      for (const [engine, version] of Object.entries(this.package.engines)) {
        projectContext.push(`This project is using ${engine} with version ${version}`);
      }
    }

    return projectContext;
  }

  getProjectName(): string {
    // If no workspace is opened, it's determined as no-rpoject
    // TODO should be changed to something else, this was done due to lack of time to implement backend support for project=null
    return this.package.name || 'no-project';
  }

}

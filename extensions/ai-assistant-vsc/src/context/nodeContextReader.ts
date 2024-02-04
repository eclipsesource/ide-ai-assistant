import * as os from 'os';
import * as fs from 'fs';
import * as vscode from 'vscode';
import * as path from 'path';
import { AbstractContextReader } from './abstractContextReader';

/**
 * Concrete implementation of AbstractContextReader for Node.js projects.
 */
export class NodeContextReader extends AbstractContextReader {
  /**
   * Object to store project context information.
   */
  private package: {
    name?: string;
    description?: string;
    engines?: { [key: string]: string }
  } = {};

  /**
   * Constructor for NodeContextReader.
   * @param projectFile - Path to the project file (e.g., package.json).
   */
  constructor(projectFile: string | Buffer | URL) {
    super();

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
  getProjectContext(): string[] {
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

  /**
   * Get user-specific context information.
   * @returns An array of strings representing user context.
   */
  getUserContext(): string[] {
    const userContext: string[] = [];

    userContext.push(`The user is using ${os.platform()} with version ${os.release()}`);

    // Assuming 'node -v' is executed synchronously
    const nodeVersion: string = require('child_process').execSync('node -v').toString();
    userContext.push(`The user is using node version ${nodeVersion}`);

    // Retrieving VSCode version
    const vscodeVersion: string = vscode.version;
    userContext.push(`The user is running VSCode version ${vscodeVersion}`);

    return userContext;
  }

  getDirectoryStructure(directoryPath: string, depth: number, maxDepth: number): string {
    if (depth > maxDepth) {
      return ''; // Stop recursion if depth exceeds max depth
    }
    let result = '';
    const files = fs.readdirSync(directoryPath);

    for (const file of files) {
      const filePath = path.join(directoryPath, file);
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        // It's a directory, so recurse into it
        if (!this.skipFile(file)) {
          result += `${'  '.repeat(depth)} ${file}/\n`;
          result += this.getDirectoryStructure(filePath, depth + 1, maxDepth);
        }
      } else {
        // It's a file
        if (depth <= maxDepth) {
          result += `${'  '.repeat(depth)} ${file}\n`;
        }
      }
    }
    return result;
  }

  private skipFile(fileName: string): boolean {
    const dirs = ['node_modules', 'lib', 'out', 'src-gen'];
    return fileName.startsWith('.') || dirs.includes(fileName);
  }

}

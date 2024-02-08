import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import * as os from 'os';

/**
 * Abstract class for reading and generating context information.
 */
export abstract class AbstractContextReader {
  /**
   * Path to the user and project context files.
   */
  private readonly USER_CONTEXT_FILE: string = path.join(`${__dirname}/../../src/context`, 'user_context.txt');
  private readonly PROJECT_CONTEXT_FILE: string = path.join(`${__dirname}/../../src/context`, 'project_context.txt');
  private projectContext: string = "";
  private userContext: string = "";

  constructor(readonly root: string | undefined) { }

  /**
   * Generates user and project contexts and writes them to files.
   * @returns A promise that resolves to true if the generation was successful, otherwise false.
   */
  generateContexts(): Promise<boolean> {
    try {
      // Handle user context
      const userContext = this.generateUserContext().join('\n');
      this.userContext = userContext;

      if (this.root !== undefined) {
        // Handle project context if workspace is opened
        let projectContext = this.generateProjectContext().join('\n');
        const directoryStructure = "\nThe directory structure is as follows.\n" + this.getDirectoryStructure(this.root, 0, 3);
        projectContext += directoryStructure;
        
        this.projectContext = projectContext;
      }
      // Write contexts to files
      fs.writeFileSync(this.USER_CONTEXT_FILE, this.userContext);
      fs.writeFileSync(this.PROJECT_CONTEXT_FILE, this.projectContext);

      return Promise.resolve(this.filesExist());
    } catch (error: any) {
      console.error(`Error generating contexts: ${error.message}`);
      return Promise.resolve(false);
    }
  }

  /**
   * Reads and returns user and project contexts from files.
   * @returns An object containing user and project contexts, or null if files do not exist.
   */
  returnContexts(): { userContext: string[]; projectContext: string[] } | null {
    if (!this.filesExist()) {
      console.error(`One of the two context files does not exist.`);
      return null;
    }

    try {
      // Read user and project contexts from files
      const userContextFile: string = fs.readFileSync(this.USER_CONTEXT_FILE, 'utf8');
      const projectContextFile: string = fs.readFileSync(this.PROJECT_CONTEXT_FILE, 'utf8');

      const context = {
        userContext: userContextFile.split('\n').filter(line => line.trim() !== ''),
        projectContext: projectContextFile.split('\n').filter(line => line.trim() !== '')
      };

      return context;
    } catch (error: any) {
      console.error(`Error reading context files: ${error.message}`);
      return null;
    }
  }

  /**
   * Checks if both user and project context files exist.
   * @returns True if both files exist, otherwise false.
   */
  filesExist(): boolean {
    const userFileExists = fs.existsSync(this.USER_CONTEXT_FILE);
    const projectFileExists = fs.existsSync(this.PROJECT_CONTEXT_FILE);
    return userFileExists && projectFileExists;
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

  skipFile(fileName: string): boolean {
    const dirs = ['node_modules', 'lib', 'out', 'src-gen'];
    return fileName.startsWith('.') || dirs.includes(fileName);
  }

  /**
   * Get user-specific context information.
   * @returns An array of strings representing user context.
   */
  generateUserContext(): string[] {
    const userContext: string[] = [];

    userContext.push(`The user is using the platform ${os.platform()} with version ${os.release()}`);

    // Assuming 'node -v' is executed synchronously
    const nodeVersion: string = require('child_process').execSync('node -v').toString().trim();
    userContext.push(`The user is using node version ${nodeVersion}`);

    // Retrieving VSCode version
    const appName: string = vscode.env.appName;
    const appVersion: string = vscode.version;
    userContext.push(`The user is running on the IDE ${appName} with version ${appVersion}`);

    return userContext;
  }

  getUserContext(): string {
    return this.userContext;
  }

  getProjectContext(): string {
    return this.projectContext;
  }

  /**
   * Abstract method to be implemented by subclasses for getting project context.
   * @returns An array of strings representing project context.
   */
  abstract generateProjectContext(): string[];
}

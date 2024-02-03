import * as fs from 'fs';
import * as path from 'path';

/**
 * Abstract class for reading and generating context information.
 */
export abstract class AbstractContextReader {
  /**
   * Path to the user and project context files.
   */
  protected readonly USER_CONTEXT_FILE: string = path.join(__dirname, 'user_context.txt');
  protected readonly PROJECT_CONTEXT_FILE: string = path.join(`${__dirname}/../../src/context`, 'project_context.txt');

  /**
   * Generates user and project contexts and writes them to files.
   * @returns A promise that resolves to true if the generation was successful, otherwise false.
   */
  generateContexts(root: string): Promise<boolean> {
    try {
      const projectContext = this.getProjectContext().join('\n');
      const userContext = this.getUserContext();
      const directoryStructure = "\nThe directory structure is as follows.\n" + this.getDirectoryStructure(root, 0, 3);

      // Write user and project contexts to files
      fs.writeFileSync(this.USER_CONTEXT_FILE, userContext.join('\n'));
      fs.writeFileSync(this.PROJECT_CONTEXT_FILE, projectContext + directoryStructure);

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

  /**
   * Abstract method to be implemented by subclasses for getting project context.
   * @returns An array of strings representing project context.
   */
  abstract getProjectContext(): string[];

  /**
   * Abstract method to be implemented by subclasses for getting user context.
   * @returns An array of strings representing user context.
   */
  abstract getUserContext(): string[];

  abstract getDirectoryStructure(directoryPath: string, depth: number, maxDepth: number): string;
}

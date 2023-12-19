import { Project, ProjectType, UserType } from '../models';
// import { Types } from 'mongoose';

export class ProjectService {

    public async createProject(projectName: string): Promise<ProjectType> {
        const newProject = new Project({ projectName: projectName });
        const savedProject = await newProject.save() as ProjectType;
        return savedProject;
    }

    public async getAllProjects(): Promise<ProjectType[]> {
        const projects = await Project.find();
        return projects;
    }

    public async getProjectByName(projectName: string): Promise<ProjectType | null> {
        const project = await Project.findOne({ projectName });
        return project;
    }

    public async getProjectById(projectId: string): Promise<ProjectType | null> {
        const project = await Project.findById(projectId);
        return project;
    }

    public async addProjectLead(project: ProjectType, user: UserType): Promise<ProjectType | null> {
        if (!project) {
            throw new Error('Project not found');
        }
        if (!user) {
            throw new Error('User not found');
        }
        project.projectLeads.push(user._id);
        const savedProject = await project.save() as ProjectType;
        return savedProject;
    }

    public async removeProjectLead(project: ProjectType, user: UserType): Promise<ProjectType | null> {
        if (!project) {
            throw new Error('Project not found');
        }
        if (!user) {
            throw new Error('User not found');
        }
        project.projectLeads = project.projectLeads.filter((userId) => userId.toString() !== user._id.toString());
        const savedProject = await project.save() as ProjectType;
        return savedProject;
    }

    public async deleteProject(projectId: string): Promise<boolean> {
        const result = await Project.findByIdAndDelete(projectId);
        return !!result;
    }

}

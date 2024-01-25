import { Project, ProjectType, UserType } from '../models';
// import { Types } from 'mongoose';

export class ProjectService {

    public async createProject(project_name: string): Promise<ProjectType> {
        const newProject = new Project({ project_name: project_name });
        const savedProject = await newProject.save() as ProjectType;
        return savedProject;
    }

    public async getAllProjects(): Promise<ProjectType[]> {
        const projects = await Project.find();
        return projects;
    }

    public async getProjectByName(project_name: string): Promise<ProjectType | null> {
        const project = await Project.findOne({ project_name });
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

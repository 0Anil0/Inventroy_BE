import { Project } from '../models';

export class ProjectService {
  public static async getAll() {
    return await Project.findAll({
      include: [
        { model: Project, as: 'parent', attributes: ['id', 'name', 'code'] },
        { model: Project, as: 'sub_projects', attributes: ['id', 'name', 'code'] },
      ],
      order: [['id', 'ASC']],
    });
  }

  public static async getById(id: number) {
    return await Project.findByPk(id, {
      include: [
        { model: Project, as: 'parent', attributes: ['id', 'name', 'code'] },
        { model: Project, as: 'sub_projects', attributes: ['id', 'name', 'code'] },
      ],
    });
  }

  public static async create(data: {
    name: string;
    code: string;
    location?: string;
    description?: string;
    parent_id?: number | null;
  }) {
    const existingCode = await Project.findOne({ where: { code: data.code } });
    if (existingCode) {
      throw new Error('Project code already exists');
    }

    const parentId = (data.parent_id && data.parent_id !== 0) ? Number(data.parent_id) : null;
    if (parentId) {
      const parentProject = await Project.findByPk(parentId);
      if (!parentProject) throw new Error('Parent project not found');
    }

    const newProject = await Project.create({
      name: data.name,
      code: data.code,
      location: data.location || null,
      description: data.description || null,
      parent_id: parentId,
    });

    return await this.getById(newProject.id);
  }

  public static async update(
    id: number,
    data: {
      name?: string;
      code?: string;
      location?: string;
      description?: string;
      parent_id?: number | null;
    }
  ) {
    const project = await Project.findByPk(id);
    if (!project) throw new Error('Project not found');

    if (data.parent_id !== undefined) {
      const parentId = (data.parent_id && data.parent_id !== 0) ? Number(data.parent_id) : null;
      if (parentId === id) {
        throw new Error('A project cannot be its own parent');
      }
      if (parentId) {
        const parentProject = await Project.findByPk(parentId);
        if (!parentProject) throw new Error('Parent project not found');
      }
      data.parent_id = parentId;
    }

    await project.update(data);
    return await this.getById(project.id);
  }

  public static async delete(id: number) {
    const project = await Project.findByPk(id);
    if (!project) throw new Error('Project not found');

    // Recursively delete all child sub-projects / sites under this parent project
    await Project.destroy({ where: { parent_id: id } });

    await project.destroy();
    return { success: true, message: 'Project and all associated child sites deleted successfully' };
  }

  public static async seedDefaultProjects() {
    const defaults = [
      { name: 'Main City Central Hub', code: 'PRJ-MAIN-01', location: 'Downtown City Center', description: 'Primary site warehouse' },
      { name: 'Metro Line Extension Site B', code: 'PRJ-MTR-02', location: 'North Terminal Zone', description: 'Infrastructure development project' },
    ];

    for (const d of defaults) {
      await Project.findOrCreate({
        where: { code: d.code },
        defaults: d,
      });
    }
    console.log('Default Projects verified in database.');
  }
}

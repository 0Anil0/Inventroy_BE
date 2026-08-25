import { Project } from '../models';

export class ProjectService {
  public static async getAll() {
    return await Project.findAll({ order: [['id', 'ASC']] });
  }

  public static async create(data: { name: string; code: string; location?: string; description?: string }) {
    const existingCode = await Project.findOne({ where: { code: data.code } });
    if (existingCode) {
      throw new Error('Project code already exists');
    }
    return await Project.create({
      name: data.name,
      code: data.code,
      location: data.location || null,
      description: data.description || null,
    });
  }

  public static async update(id: number, data: { name?: string; code?: string; location?: string; description?: string }) {
    const project = await Project.findByPk(id);
    if (!project) throw new Error('Project not found');
    await project.update(data);
    return project;
  }

  public static async delete(id: number) {
    const project = await Project.findByPk(id);
    if (!project) throw new Error('Project not found');
    await project.destroy();
    return { success: true, message: 'Project deleted successfully' };
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

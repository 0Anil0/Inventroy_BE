import { Project } from '../models';

export class ProjectService {
  public static async getAll(params?: {
    search?: string;
    category?: 'ALL' | 'MAIN' | 'SUB';
    page?: number;
    limit?: number;
    plant_id?: number;
  }) {
    const { search, category, page, limit, plant_id } = params || {};
    const { Op } = require('sequelize');

    const where: any = {};
    if (plant_id) {
      where.plant_id = plant_id;
    }

    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      const isPg = Project.sequelize?.getDialect() === 'postgres';
      const likeOp = isPg ? Op.iLike : Op.like;
      where[Op.or] = [
        { name: { [likeOp]: q } },
        { code: { [likeOp]: q } },
        { location: { [likeOp]: q } },
      ];
    }

    if (category === 'MAIN') {
      where.parent_id = null;
    } else if (category === 'SUB') {
      where.parent_id = { [Op.ne]: null };
    }

    const { count, rows } = await Project.findAndCountAll({
      where,
      include: [
        { model: Project, as: 'parent', attributes: ['id', 'name', 'code'] },
        { model: Project, as: 'sub_projects', attributes: ['id', 'name', 'code'] },
      ],
      order: [['id', 'ASC']],
      offset: page && limit ? (page - 1) * limit : undefined,
      limit: page && limit ? limit : undefined,
      distinct: true,
    });

    const totalCount = await Project.count({ where: plant_id ? { plant_id } : {} });
    const mainCount = await Project.count({ where: { parent_id: null, ...(plant_id ? { plant_id } : {}) } });
    const subCount = await Project.count({ where: { parent_id: { [Op.ne]: null }, ...(plant_id ? { plant_id } : {}) } });

    return {
      projects: rows,
      total: count,
      totalCount,
      mainCount,
      subCount,
    };
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
    plant_id?: number;
  }) {
    const { Op } = require('sequelize');
    const formattedCode = data.code.trim().toUpperCase();

    const existingCode = await Project.findOne({ where: { code: formattedCode } });
    if (existingCode) {
      throw new Error(`Project code "${formattedCode}" already exists.`);
    }

    const parentId = (data.parent_id && data.parent_id !== 0) ? Number(data.parent_id) : null;
    if (parentId) {
      const parentProject = await Project.findByPk(parentId);
      if (!parentProject) throw new Error('Selected parent project not found.');
    }

    const newProject = await Project.create({
      name: data.name.trim(),
      code: formattedCode,
      location: data.location ? data.location.trim() : null,
      description: data.description ? data.description.trim() : null,
      parent_id: parentId,
      plant_id: data.plant_id || 1,
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
    const { Op } = require('sequelize');
    const project = await Project.findByPk(id);
    if (!project) throw new Error('Project not found');

    if (data.code) {
      const formattedCode = data.code.trim().toUpperCase();
      const existingCode = await Project.findOne({
        where: { code: formattedCode, id: { [Op.ne]: id } },
      });
      if (existingCode) {
        throw new Error(`Project code "${formattedCode}" already exists.`);
      }
      data.code = formattedCode;
    }

    if (data.parent_id !== undefined) {
      const parentId = (data.parent_id && data.parent_id !== 0) ? Number(data.parent_id) : null;
      if (parentId === id) {
        throw new Error('A project cannot be its own parent.');
      }
      if (parentId) {
        const parentProject = await Project.findByPk(parentId);
        if (!parentProject) throw new Error('Selected parent project not found.');
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

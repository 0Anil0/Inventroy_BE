import bcrypt from 'bcryptjs';
import { User, Role } from '../models';
import { AuthService } from './auth.service';

export class UserService {
  /**
   * Fetches all users with associated Role details
   */
  public static async getAllUsers() {
    return await User.findAll({
      attributes: ['id', 'username', 'email', 'role_id', 'createdAt', 'updatedAt'],
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'name', 'description'],
        },
      ],
      order: [['id', 'ASC']],
    });
  }

  /**
   * Fetches all available roles
   */
  public static async getAllRoles() {
    return await Role.findAll({
      order: [['id', 'ASC']],
    });
  }

  /**
   * Creates a new user with role_id
   */
  public static async createUser(data: {
    username: string;
    email?: string;
    passwordPayload: string;
    role_id: number;
  }) {
    const existingUser = await User.findOne({ where: { username: data.username } });
    if (existingUser) {
      throw new Error('Username is already taken');
    }

    if (data.email) {
      const existingEmail = await User.findOne({ where: { email: data.email } });
      if (existingEmail) {
        throw new Error('Email is already registered');
      }
    }

    const hashedPassword = await bcrypt.hash(data.passwordPayload, 10);

    const newUser = await User.create({
      username: data.username,
      email: data.email || null,
      password_hash: hashedPassword,
      role_id: data.role_id,
    });

    return await User.findByPk(newUser.id, {
      attributes: ['id', 'username', 'email', 'role_id', 'createdAt'],
      include: [{ model: Role, as: 'role', attributes: ['id', 'name', 'description'] }],
    });
  }

  /**
   * Updates existing user details
   */
  public static async updateUser(
    id: number,
    data: {
      username?: string;
      email?: string;
      role_id?: number;
      passwordPayload?: string;
    }
  ) {
    const user = await User.findByPk(id);
    if (!user) {
      throw new Error('User not found');
    }

    const updateFields: any = {};
    if (data.username && data.username !== user.username) {
      const existing = await User.findOne({ where: { username: data.username } });
      if (existing) throw new Error('Username already taken');
      updateFields.username = data.username;
    }

    if (data.email !== undefined) {
      updateFields.email = data.email || null;
    }

    if (data.role_id) {
      updateFields.role_id = data.role_id;
    }

    if (data.passwordPayload) {
      updateFields.password_hash = await bcrypt.hash(data.passwordPayload, 10);
    }

    await user.update(updateFields);

    return await User.findByPk(id, {
      attributes: ['id', 'username', 'email', 'role_id', 'createdAt'],
      include: [{ model: Role, as: 'role', attributes: ['id', 'name', 'description'] }],
    });
  }

  /**
   * Deletes a user by ID
   */
  public static async deleteUser(id: number) {
    const user = await User.findByPk(id);
    if (!user) {
      throw new Error('User not found');
    }
    await user.destroy();
    return { success: true, message: 'User deleted successfully' };
  }

  /**
   * Seeds roles and default admin user linked to admin role
   */
  public static async seedRolesAndAdmin() {
    try {
      // 1. Seed standard roles
      const defaultRoles = [
        { name: 'admin', description: 'System Administrator with full access' },
        { name: 'manager', description: 'Inventory Manager with edit permissions' },
        { name: 'user', description: 'Standard User with read-only access' },
      ];

      for (const roleDef of defaultRoles) {
        await Role.findOrCreate({
          where: { name: roleDef.name },
          defaults: roleDef,
        });
      }
      console.log('Default roles (admin, manager, user) verified in database.');

      // 2. Fetch admin role ID
      const adminRole = await Role.findOne({ where: { name: 'admin' } });
      if (!adminRole) return;

      // 3. Seed/Update default Admin User
      const sha256AdminPass = AuthService.getSha256('admin123');
      const hashedPassword = await bcrypt.hash(sha256AdminPass, 10);

      const [adminUser, created] = await User.findOrCreate({
        where: { username: 'admin' },
        defaults: {
          username: 'admin',
          email: 'admin@inventory.local',
          password_hash: hashedPassword,
          role_id: adminRole.id,
        },
      });

      if (!created) {
        await adminUser.update({
          password_hash: hashedPassword,
          role_id: adminRole.id,
        });
      }
      console.log('Admin user verified & linked to Admin Role ID:', adminRole.id);
    } catch (error) {
      console.error('Error seeding roles and admin user:', error);
    }
  }
}

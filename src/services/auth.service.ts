import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { User, Role } from '../models';
import { generateToken } from '../utils/auth.utils';

export class AuthService {
  public static getSha256(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex');
  }

  public static async login(username: string, passwordPayload: string) {
    const user = await User.findOne({
      where: { username },
      include: [{ model: Role, as: 'role', attributes: ['id', 'name', 'description'] }],
    });

    if (!user) {
      throw new Error('Invalid username or password');
    }

    const isMatch = await bcrypt.compare(passwordPayload, user.password_hash);
    if (!isMatch) {
      throw new Error('Invalid username or password');
    }

    const roleName = user.role ? user.role.name : 'user';

    const token = generateToken({
      userId: user.id,
      username: user.username,
      role: roleName,
    });

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: roleName,
        role_id: user.role_id,
        createdAt: user.createdAt,
      },
    };
  }

  public static async signup(username: string, email: string | undefined, passwordPayload: string) {
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      throw new Error('Username is already taken');
    }

    // Default to 'user' role
    const defaultRole = await Role.findOne({ where: { name: 'user' } });
    if (!defaultRole) {
      throw new Error('Default role missing');
    }

    const hashedPassword = await bcrypt.hash(passwordPayload, 10);

    const newUser = await User.create({
      username,
      email: email || null,
      password_hash: hashedPassword,
      role_id: defaultRole.id,
    });

    const token = generateToken({
      userId: newUser.id,
      username: newUser.username,
      role: defaultRole.name,
    });

    return {
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: defaultRole.name,
        role_id: defaultRole.id,
        createdAt: newUser.createdAt,
      },
    };
  }

  public static async getUserById(userId: number) {
    const user = await User.findByPk(userId, {
      attributes: ['id', 'username', 'email', 'role_id', 'createdAt'],
      include: [{ model: Role, as: 'role', attributes: ['id', 'name', 'description'] }],
    });

    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role ? user.role.name : 'user',
      role_id: user.role_id,
      createdAt: user.createdAt,
    };
  }
}

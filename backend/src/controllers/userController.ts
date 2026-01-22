import { Request, Response } from 'express';
import { executeQuery, executeQuerySingle, executeUpdate } from '../config/database';
import { cacheDel } from '../config/redis';
import { AuthenticatedRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export class UserController {
  async getUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    const organizationId = req.user!.organizationId;
    const { page = 1, limit = 20, role, search } = req.query;

    try {
      let query = `
        SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.phone, 
               u.is_active, u.created_at, u.last_login,
               o.name as organization_name
        FROM users u
        JOIN user_organizations uo ON u.id = uo.user_id
        JOIN organizations o ON uo.organization_id = o.id
        WHERE uo.organization_id = ?
      `;

      const params: any[] = [organizationId];

      // Apply filters
      if (role) {
        query += ' AND u.role = ?';
        params.push(role);
      }

      if (search) {
        query += ' AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      // Get total count
      const countQuery = query.replace('SELECT u.id, u.email,', 'SELECT COUNT(*) as total,');
      const countResult = await executeQuerySingle<{ total: number }>(countQuery, params);
      const total = countResult?.total || 0;

      // Apply pagination
      query += ' ORDER BY u.created_at DESC LIMIT ? OFFSET ?';
      params.push(Number(limit), (Number(page) - 1) * Number(limit));

      const users = await executeQuery(query, params);

      res.json({
        success: true,
        data: users,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      logger.error('Error fetching users:', error);
      throw error;
    }
  }

  async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const organizationId = req.user!.organizationId;

    try {
      const user = await executeQuerySingle(
        `SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.phone, 
                u.is_active, u.created_at, u.last_login,
                o.id as organization_id, o.name as organization_name
         FROM users u
         JOIN user_organizations uo ON u.id = uo.user_id
         JOIN organizations o ON uo.organization_id = o.id
         WHERE u.id = ? AND uo.organization_id = ? AND uo.is_primary = TRUE`,
        [userId, organizationId]
      );

      if (!user) {
        throw new AppError('User not found', 404);
      }

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      logger.error('Error fetching user profile:', error);
      throw error;
    }
  }

  async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const { first_name, last_name, phone } = req.body;

    try {
      await executeUpdate(
        'UPDATE users SET first_name = ?, last_name = ?, phone = ?, updated_at = NOW() WHERE id = ?',
        [first_name, last_name, phone, userId]
      );

      // Clear any relevant cache
      await cacheDel(`user:${userId}`);

      // Get updated profile
      const updatedUser = await this.getUserByIdInternal(userId, req.user!.organizationId);

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: updatedUser
      });
    } catch (error) {
      logger.error('Error updating profile:', error);
      throw error;
    }
  }

  async getUserById(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;

    try {
      const user = await this.getUserByIdInternal(parseInt(id), organizationId);

      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Only show sensitive info to admins or the user themselves
      if (req.user!.userId !== parseInt(id) && !['admin', 'facility_manager'].includes(req.user!.role)) {
        // Remove sensitive fields
        delete user.email;
        delete user.phone;
        delete user.last_login;
      }

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      logger.error('Error fetching user:', error);
      throw error;
    }
  }

  async updateUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const { first_name, last_name, role, phone, is_active } = req.body;
    const organizationId = req.user!.organizationId;

    try {
      // Check if user belongs to the same organization
      const userExists = await executeQuerySingle(
        'SELECT id FROM users u JOIN user_organizations uo ON u.id = uo.user_id WHERE u.id = ? AND uo.organization_id = ?',
        [parseInt(id), organizationId]
      );

      if (!userExists) {
        throw new AppError('User not found', 404);
      }

      await executeUpdate(
        'UPDATE users SET first_name = ?, last_name = ?, role = ?, phone = ?, is_active = ?, updated_at = NOW() WHERE id = ?',
        [first_name, last_name, role, phone, is_active, parseInt(id)]
      );

      // Clear cache
      await cacheDel(`user:${id}`);

      const updatedUser = await this.getUserByIdInternal(parseInt(id), organizationId);

      res.json({
        success: true,
        message: 'User updated successfully',
        data: updatedUser
      });
    } catch (error) {
      logger.error('Error updating user:', error);
      throw error;
    }
  }

  async deleteUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;

    try {
      // Prevent users from deleting themselves
      if (req.user!.userId === parseInt(id)) {
        throw new AppError('Cannot delete your own account', 400);
      }

      // Check if user belongs to the same organization
      const userExists = await executeQuerySingle(
        'SELECT id FROM users u JOIN user_organizations uo ON u.id = uo.user_id WHERE u.id = ? AND uo.organization_id = ?',
        [parseInt(id), organizationId]
      );

      if (!userExists) {
        throw new AppError('User not found', 404);
      }

      // Soft delete - set is_active to false
      await executeUpdate(
        'UPDATE users SET is_active = FALSE, updated_at = NOW() WHERE id = ?',
        [parseInt(id)]
      );

      // Clear cache
      await cacheDel(`user:${id}`);

      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting user:', error);
      throw error;
    }
  }

  // Helper method to get user by ID with organization info
  private async getUserByIdInternal(userId: number, organizationId: number): Promise<any> {
    return await executeQuerySingle(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.phone, 
              u.is_active, u.created_at, u.last_login,
              o.name as organization_name
       FROM users u
       JOIN user_organizations uo ON u.id = uo.user_id
       JOIN organizations o ON uo.organization_id = o.id
       WHERE u.id = ? AND uo.organization_id = ?`,
      [userId, organizationId]
    );
  }
}
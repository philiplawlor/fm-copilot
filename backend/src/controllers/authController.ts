import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { executeQuery, executeQuerySingle, executeInsert } from '../config/database';
import { cacheSet, cacheGet } from '../config/redis';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    const { email, password, first_name, last_name, role, phone, organization_name } = req.body;

    try {
      // Check if user already exists
      const existingUser = await executeQuerySingle(
        'SELECT id FROM users WHERE email = ?',
        [email]
      );

      if (existingUser) {
        throw new AppError('User with this email already exists', 409);
      }

      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Create organization (or use existing)
      let organization;
      const existingOrg = await executeQuerySingle(
        'SELECT id FROM organizations WHERE name = ?',
        [organization_name]
      );

      if (existingOrg) {
        organization = existingOrg;
      } else {
        const orgId = await executeInsert(
          'INSERT INTO organizations (name, created_at) VALUES (?, NOW())',
          [organization_name]
        );
        organization = { id: orgId };
      }

      // Create user
      const userId = await executeInsert(
        `INSERT INTO users (email, password_hash, first_name, last_name, role, phone, created_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [email, passwordHash, first_name, last_name, role, phone]
      );

      // Link user to organization
      await executeInsert(
        'INSERT INTO user_organizations (user_id, organization_id, is_primary, created_at) VALUES (?, ?, TRUE, NOW())',
        [userId, organization.id]
      );

      // Generate tokens
      const tokens = this.generateTokens(userId, organization.id, role, email);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: userId,
            email,
            first_name,
            last_name,
            role,
            organization: { id: organization.id, name: organization_name }
          },
          tokens
        }
      });
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;

    try {
      // Get user with organization
      const user = await executeQuerySingle(
        `SELECT u.id, u.email, u.password_hash, u.first_name, u.last_name, u.role, 
                u.is_active, u.last_login,
                o.id as organization_id, o.name as organization_name
         FROM users u
         JOIN user_organizations uo ON u.id = uo.user_id
         JOIN organizations o ON uo.organization_id = o.id
         WHERE u.email = ? AND uo.is_primary = TRUE`,
        [email]
      );

      if (!user) {
        throw new AppError('Invalid email or password', 401);
      }

      if (!user.is_active) {
        throw new AppError('Account is inactive', 401);
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        throw new AppError('Invalid email or password', 401);
      }

      // Update last login
      await executeQuery(
        'UPDATE users SET last_login = NOW() WHERE id = ?',
        [user.id]
      );

      // Generate tokens
      const tokens = this.generateTokens(user.id, user.organization_id, user.role, user.email);

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role,
            organization: {
              id: user.organization_id,
              name: user.organization_name
            }
          },
          tokens
        }
      });
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    const { refresh_token } = req.body;

    try {
      // Add refresh token to blacklist
      if (refresh_token) {
        await cacheSet(`blacklist:${refresh_token}`, true, 604800); // 7 days
      }

      res.json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      logger.error('Logout error:', error);
      throw error;
    }
  }

  async refreshToken(req: Request, res: Response): Promise<void> {
    const { refresh_token } = req.body;

    try {
      // Check if refresh token is blacklisted
      const isBlacklisted = await cacheGet(`blacklist:${refresh_token}`);
      if (isBlacklisted) {
        throw new AppError('Refresh token has been revoked', 401);
      }

      // Verify refresh token
      const decoded = jwt.verify(refresh_token, process.env.JWT_SECRET!) as any;

      // Get current user data
      const user = await executeQuerySingle(
        `SELECT u.id, u.email, u.role, uo.organization_id
         FROM users u
         JOIN user_organizations uo ON u.id = uo.user_id
         WHERE u.id = ? AND uo.is_primary = TRUE AND u.is_active = TRUE`,
        [decoded.userId]
      );

      if (!user) {
        throw new AppError('User not found or inactive', 401);
      }

      // Generate new tokens
      const tokens = this.generateTokens(user.id, user.organization_id, user.role, user.email);

      res.json({
        success: true,
        data: { tokens }
      });
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError('Invalid refresh token', 401);
      }
      logger.error('Refresh token error:', error);
      throw error;
    }
  }

  async forgotPassword(req: Request, res: Response): Promise<void> {
    const { email } = req.body;

    try {
      const user = await executeQuerySingle(
        'SELECT id, first_name FROM users WHERE email = ? AND is_active = TRUE',
        [email]
      );

      if (!user) {
        // Don't reveal if user exists or not
        res.json({
          success: true,
          message: 'If an account exists with this email, password reset instructions have been sent'
        });
        return;
      }

      // Generate reset token (in production, this would be stored and sent via email)
      const resetToken = jwt.sign(
        { userId: user.id, type: 'password_reset' },
        process.env.JWT_SECRET!,
        { expiresIn: '1h' }
      );

      // In a real implementation, send email with reset token
      logger.info(`Password reset for user ${user.id}: ${resetToken}`);

      res.json({
        success: true,
        message: 'If an account exists with this email, password reset instructions have been sent'
      });
    } catch (error) {
      logger.error('Forgot password error:', error);
      throw error;
    }
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    const { token, new_password } = req.body;

    try {
      // Verify reset token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

      if (decoded.type !== 'password_reset') {
        throw new AppError('Invalid reset token', 400);
      }

      // Check if user exists and is active
      const user = await executeQuerySingle(
        'SELECT id FROM users WHERE id = ? AND is_active = TRUE',
        [decoded.userId]
      );

      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Hash new password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(new_password, saltRounds);

      // Update password
      await executeQuery(
        'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?',
        [passwordHash, user.id]
      );

      res.json({
        success: true,
        message: 'Password reset successful'
      });
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError('Invalid or expired reset token', 400);
      }
      logger.error('Reset password error:', error);
      throw error;
    }
  }

  private generateTokens(userId: number, organizationId: number, role: string, email: string) {
    const accessToken = jwt.sign(
      {
        userId,
        organizationId,
        role,
        email,
        type: 'access'
      },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    const refreshToken = jwt.sign(
      {
        userId,
        organizationId,
        role,
        email,
        type: 'refresh'
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: 24 * 60 * 60 // 24 hours in seconds
    };
  }
}
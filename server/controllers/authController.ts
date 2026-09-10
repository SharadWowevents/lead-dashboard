import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db.ts';
import { AuthRequest, JWT_SECRET } from '../middleware/auth.ts';

/**
 * Controller for Admin Authentication: Login
 * POST /login or POST /api/auth/login
 */
export async function login(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({
        success: false,
        message: 'Username and password are required',
      });
      return;
    }

    // Look up admin user in the database
    const user = await db.adminUser.findUnique({
      where: { username: String(username).trim() },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid username or password',
      });
      return;
    }

    // Compare hashed password
    const isMatch = await bcrypt.compare(String(password), user.passwordHash);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Invalid username or password',
      });
      return;
    }

    // Generate JWT token (valid for 24 hours)
    const payload = {
      id: user.id,
      username: user.username,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      success: true,
      message: 'Authentication successful',
      token,
      user: {
        id: user.id,
        username: user.username,
      },
    });
  } catch (error: any) {
    console.error('Error during login:', error);
    res.status(500).json({
      success: false,
      message: 'An internal server error occurred during login',
      error: error.message,
    });
  }
}

/**
 * Controller for changing the admin password
 * POST /change-password or POST /api/auth/change-password
 * Requires valid JWT
 */
export async function changePassword(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized: User identity not found',
      });
      return;
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({
        success: false,
        message: 'Current password and new password are required',
      });
      return;
    }

    if (String(newPassword).length < 6) {
      res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long',
      });
      return;
    }

    // Fetch user from DB
    const user = await db.adminUser.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User account not found',
      });
      return;
    }

    // Verify current password
    const isCurrentValid = await bcrypt.compare(String(currentPassword), user.passwordHash);
    if (!isCurrentValid) {
      res.status(400).json({
        success: false,
        message: 'Incorrect current password',
      });
      return;
    }

    // Hash the new password
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(String(newPassword), saltRounds);

    // Update in database
    await db.adminUser.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    });

    res.json({
      success: true,
      message: 'Password has been updated successfully',
    });
  } catch (error: any) {
    console.error('Error during password change:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update password',
      error: error.message,
    });
  }
}

/**
 * Controller to get current authenticated user profile
 * GET /api/auth/me
 */
export async function getProfile(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const user = await db.adminUser.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
}

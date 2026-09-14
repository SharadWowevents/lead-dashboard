import { Request, Response } from 'express';
import { db } from '../db.ts';
import { AuthRequest } from '../middleware/auth.ts';

/**
 * GET /api/prompts
 * Supports ?category=... and ?search=...
 */
export async function getPrompts(req: Request, res: Response): Promise<void> {
  try {
    const category = req.query.category as string | undefined;
    const search = req.query.search as string | undefined;

    const prompts = await db.prompt.findMany({ category, search });
    res.json({
      success: true,
      count: prompts.length,
      data: prompts
    });
  } catch (error: any) {
    console.error('Error fetching prompts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch prompts',
      error: error.message
    });
  }
}

/**
 * GET /api/prompts/:id
 */
export async function getPromptById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const prompt = await db.prompt.findById(id);

    if (!prompt) {
      res.status(404).json({ success: false, message: 'Prompt not found' });
      return;
    }

    res.json({ success: true, data: prompt });
  } catch (error: any) {
    console.error('Error fetching prompt:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
}

/**
 * POST /api/prompts
 * Protected by JWT
 */
export async function createPrompt(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { number, category, title, prompt } = req.body;

    if (!category || !title || !prompt) {
      res.status(400).json({
        success: false,
        message: 'Category, title, and prompt content are required.'
      });
      return;
    }

    const validCategories = ['Marketing', 'Sales', 'Delivery', 'Finance', 'People', 'AI'];
    if (!validCategories.includes(category)) {
      res.status(400).json({
        success: false,
        message: `Invalid category. Allowed: ${validCategories.join(', ')}`
      });
      return;
    }

    const newPrompt = await db.prompt.create({
      number: number ? Number(number) : undefined,
      category,
      title: title.trim(),
      prompt: prompt.trim()
    });

    res.status(201).json({
      success: true,
      message: 'Prompt created successfully',
      data: newPrompt
    });
  } catch (error: any) {
    console.error('Error creating prompt:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create prompt',
      error: error.message
    });
  }
}

/**
 * PUT /api/prompts/:id
 * Protected by JWT
 */
export async function updatePrompt(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { number, category, title, prompt } = req.body;

    const updated = await db.prompt.update(id, {
      ...(number !== undefined ? { number: Number(number) } : {}),
      ...(category ? { category } : {}),
      ...(title ? { title: title.trim() } : {}),
      ...(prompt ? { prompt: prompt.trim() } : {})
    });

    if (!updated) {
      res.status(404).json({ success: false, message: 'Prompt not found to update.' });
      return;
    }

    res.json({
      success: true,
      message: 'Prompt updated successfully',
      data: updated
    });
  } catch (error: any) {
    console.error('Error updating prompt:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update prompt',
      error: error.message
    });
  }
}

/**
 * DELETE /api/prompts/:id
 * Protected by JWT
 */
export async function deletePrompt(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const deleted = await db.prompt.delete(id);

    if (!deleted) {
      res.status(404).json({ success: false, message: 'Prompt not found.' });
      return;
    }

    res.json({
      success: true,
      message: 'Prompt deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting prompt:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete prompt',
      error: error.message
    });
  }
}
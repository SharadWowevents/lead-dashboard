import { Request, Response } from 'express';
import { db } from '../db.ts';
import { AuthRequest } from '../middleware/auth.ts';

/**
 * Controller for Data Ingestion from multiple frontend projects
 * POST /api/ingest or POST /api/data/ingest
 * Public / Open endpoint for integration
 */


export async function ingestLead(req: Request, res: Response): Promise<void> {
  try {
    const { siteName, name, email, mobile } = req.body;

    // Validate required fields
    const errors: string[] = [];
    if (!siteName || typeof siteName !== 'string' || !siteName.trim()) {
      errors.push('Field "siteName" is required and must identify the source project.');
    }
    if (!name || typeof name !== 'string' || !name.trim()) {
      errors.push('Field "name" is required.');
    }
    if (!email || typeof email !== 'string' || !email.trim()) {
      errors.push('Field "email" is required.');
    } else {
      // Basic email regex format check
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        errors.push('Field "email" must be a valid email address.');
      }
    }
    if (!mobile || typeof mobile !== 'string' || !mobile.trim()) {
      errors.push('Field "mobile" is required.');
    }

    if (errors.length > 0) {
      res.status(400).json({
        success: false,
        message: 'Validation failed for incoming lead data',
        errors,
      });
      return;
    }

    // Persist to database using Prisma / database abstraction
    const newLead = await db.leadData.create({
      data: {
        siteName: siteName.trim(),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        mobile: mobile.trim(),
      },
    });

    res.status(201).json({
      success: true,
      message: 'Lead data ingested and stored successfully',
      data: newLead,
    });
  } catch (error: any) {
    console.error('Error during lead ingestion:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to ingest lead data',
      error: error.message,
    });
  }
}



/**
 * Controller to fetch leads for dashboard
 * GET /api/data
 * JWT Protected, optional ?siteName=... query parameter
 */
export async function getLeads(req: AuthRequest, res: Response): Promise<void> {
  try {
    const siteNameQuery = req.query.siteName as string | undefined;

    // Filter condition if siteName query is specified and not empty or "all"
    let whereCondition: { siteName?: string } | undefined;
    if (siteNameQuery && siteNameQuery.trim() !== '' && siteNameQuery.toLowerCase() !== 'all') {
      whereCondition = { siteName: siteNameQuery.trim() };
    }

    // Fetch leads ordered by most recent first
    const leads = await db.leadData.findMany({
      where: whereCondition,
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      count: leads.length,
      filter: siteNameQuery && siteNameQuery.toLowerCase() !== 'all' ? siteNameQuery.trim() : null,
      data: leads,
    });
  } catch (error: any) {
    console.error('Error fetching leads:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve lead data',
      error: error.message,
    });
  }
}

/**
 * Controller to list all distinct siteNames
 * GET /api/sites
 */
export async function getUniqueSites(req: AuthRequest, res: Response): Promise<void> {
  try {
    const sites = await db.leadData.getUniqueSites();
    res.json({
      success: true,
      sites,
    });
  } catch (error: any) {
    console.error('Error getting sites list:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sites list',
      error: error.message,
    });
  }
}

/**
 * Controller to delete a lead
 * DELETE /api/data/:id
 * JWT Protected
 */
export async function deleteLead(req: AuthRequest, res: Response): Promise<void> {
  try {
    // MongoDB IDs are strings, DO NOT use parseInt here
    const id = req.params.id;
    
    if (!id) {
      res.status(400).json({ success: false, message: 'Invalid lead ID parameter' });
      return;
    }

    const deleted = await db.leadData.delete({ where: { id } });
    if (!deleted) {
      res.status(404).json({ success: false, message: 'Lead record not found' });
      return;
    }

    res.json({
      success: true,
      message: `Lead was deleted successfully`,
    });
  } catch (error: any) {
    console.error('Error deleting lead:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete lead',
      error: error.message,
    });
  }
}

export async function getAnalyses(req: AuthRequest, res: Response): Promise<void> {
  try {
    const analyses = await db.analysisData.findMany();
    res.json({ success: true, data: analyses });
  } catch (error: any) {
    console.error('Error fetching analyses:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch analyses' });
  }
}
import { Response } from 'express';
import { db } from '../db.ts';
import { AuthRequest } from '../middleware/auth.ts';

// Ported 1:1 from ProjectsList backend (Express + Mongoose), adapted to
// lead-dashboard conventions: JWT-protected + { success, data } envelope.
// Original routes preserved: /api/projects/* and /api/types/*

export async function getDirectoryProjects(req: AuthRequest, res: Response): Promise<void> {
  try {
    const projects = await db.directoryProjects.findMany();
    // Original returned a bare array; page code accepts both array and {data}
    res.json(projects);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function createDirectoryProject(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.body?.name?.trim()) { res.status(400).json({ success: false, message: 'Project name is required' }); return; }
    const created = await db.directoryProjects.create(req.body);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
}

export async function updateDirectoryProject(req: AuthRequest, res: Response): Promise<void> {
  try {
    const updated = await db.directoryProjects.update(req.params.id, req.body);
    if (!updated) { res.status(404).json({ success: false, message: 'Project not found' }); return; }
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
}

export async function deleteDirectoryProject(req: AuthRequest, res: Response): Promise<void> {
  try {
    const deleted = await db.directoryProjects.delete(req.params.id);
    if (!deleted) { res.status(404).json({ success: false, message: 'Project not found' }); return; }
    res.json({ success: true, message: 'Project deleted' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// Original only inserted projects and silently ignored `replaceExisting` + types.
// This version honours both (the ImportExportModal UI exposes them).
export async function importDirectoryProjects(req: AuthRequest, res: Response): Promise<void> {
  try {
    const body: any = req.body;
    const items: any[] = Array.isArray(body) ? body : body?.projects;
    if (!Array.isArray(items)) { res.status(400).json({ success: false, message: 'Expected a JSON array or { projects: [] }' }); return; }
    const replaceExisting = Boolean(body?.replaceExisting);
    const incomingTypes: any[] | undefined = Array.isArray(body?.types) ? body.types : undefined;

    if (incomingTypes?.length) {
      for (const t of incomingTypes) {
        if (t?.name) await db.directoryTypes.create({ name: String(t.name).trim(), color: t.color || 'indigo', isDefault: Boolean(t.isDefault) });
      }
    }
    const inserted = await db.directoryProjects.importMany(items, replaceExisting);
    res.status(201).json(inserted);
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
}

export async function getDirectoryTypes(req: AuthRequest, res: Response): Promise<void> {
  try {
    res.json(await db.directoryTypes.findMany());
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function createDirectoryType(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.body?.name?.trim()) { res.status(400).json({ success: false, message: 'Type name is required' }); return; }
    const created = await db.directoryTypes.create({ name: req.body.name.trim(), color: req.body.color || 'indigo', isDefault: Boolean(req.body.isDefault) });
    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
}

export async function deleteDirectoryType(req: AuthRequest, res: Response): Promise<void> {
  try {
    const deleted = await db.directoryTypes.delete(req.params.id);
    if (!deleted) { res.status(404).json({ success: false, message: 'Type not found' }); return; }
    res.json({ success: true, message: 'Type deleted' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

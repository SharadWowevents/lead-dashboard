import { Router } from 'express';
import {
  getDirectoryProjects,
  createDirectoryProject,
  updateDirectoryProject,
  deleteDirectoryProject,
  importDirectoryProjects,
  getDirectoryTypes,
  createDirectoryType,
  deleteDirectoryType,
} from '../controllers/projectDirectoryController.ts';
import { authenticateToken } from '../middleware/auth.ts';

// Same paths as the original ProjectsList backend, but JWT-protected
// (original was fully public with open CORS — not safe inside the admin dashboard).
export const projectDirectoryProjectRoutes = Router();
projectDirectoryProjectRoutes.use(authenticateToken);
projectDirectoryProjectRoutes.get('/', getDirectoryProjects);
projectDirectoryProjectRoutes.post('/import', importDirectoryProjects); // must precede /:id-style routes
projectDirectoryProjectRoutes.post('/', createDirectoryProject);
projectDirectoryProjectRoutes.put('/:id', updateDirectoryProject);
projectDirectoryProjectRoutes.delete('/:id', deleteDirectoryProject);

export const projectDirectoryTypeRoutes = Router();
projectDirectoryTypeRoutes.use(authenticateToken);
projectDirectoryTypeRoutes.get('/', getDirectoryTypes);
projectDirectoryTypeRoutes.post('/', createDirectoryType);
projectDirectoryTypeRoutes.delete('/:id', deleteDirectoryType);

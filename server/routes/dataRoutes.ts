import { Router } from 'express';
import {
  ingestLead,
  getLeads,
  getUniqueSites,
  deleteLead,
  getAnalyses,
  getLogs,
  getPromptLogs,
  getWowosScoreLogs,
  getSachinTalwarLogs,
  getAvatarAppData,
  getExportedEmails,
  recordExportedEmails,
  resetExportedEmails,
} from '../controllers/dataController.ts';
import { authenticateToken } from '../middleware/auth.ts';

const router = Router();

// Public data ingestion endpoint (for other projects to submit lead forms)
router.post('/ingest', ingestLead);

// Dashboard data endpoints (Protected by JWT)
router.get('/data', authenticateToken, getLeads);
router.get('/sites', authenticateToken, getUniqueSites);
router.get('/analyses', authenticateToken, getAnalyses);
router.delete('/data/:id', authenticateToken, deleteLead);
router.get('/logs', authenticateToken, getLogs);
router.get('/prompt-logs', authenticateToken, getPromptLogs);
router.get('/wowos-score-logs', authenticateToken, getWowosScoreLogs);
router.get('/sachin-talwar-logs', authenticateToken, getSachinTalwarLogs);
router.get('/avatar-app', authenticateToken, getAvatarAppData);

// Exported Emails history endpoints (Protected by JWT)
router.get('/exported-emails', authenticateToken, getExportedEmails);
router.post('/exported-emails', authenticateToken, recordExportedEmails);
router.post('/exported-emails/reset', authenticateToken, resetExportedEmails);

export default router;
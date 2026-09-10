import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import fs from 'fs';
import { createApp } from './server/app.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = createApp();
const PORT = 3006;

// Production static file serving for Vite built assets
const distPath = path.resolve(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));

  // Catch-all route to serve index.html for React SPA client navigation
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path === '/login' || req.path === '/change-password') {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(` Centralized Admin Backend Server`);
  console.log(` Listening on: http://0.0.0.0:${PORT}`);
  console.log(` Environment:  ${process.env.NODE_ENV || 'development'}`);
  console.log(` Ingest API:   http://0.0.0.0:${PORT}/api/ingest`);
  console.log(` Data API:     http://0.0.0.0:${PORT}/api/data`);
  console.log(` Auth API:     http://0.0.0.0:${PORT}/api/auth/login`);
  console.log(`====================================================`);
});

export default server;

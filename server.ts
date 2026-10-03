import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const distPath = path.join(__dirname, 'dist');

// Serve static assets from dist
app.use(express.static(distPath, {
  maxAge: '1d',
  setHeaders: (res: Response, filePath: string) => {
    if (filePath.endsWith('.html') || filePath.endsWith('sw.js')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

// SPA Fallback: send index.html for all other routes
app.get('*', (_req: Request, res: Response) => {
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).send('<!DOCTYPE html><html><body><h2>IQC by ThinhXu đang được khởi chạy... Vui lòng F5 sau vài giây.</h2></body></html>');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`IQC Server running at http://0.0.0.0:${PORT}`);
});

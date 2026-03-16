import { readFileSync } from 'fs';
import { join } from 'path';

// Serve collections from the root db.json file.
// Usage examples:
// - GET /api/users
// - GET /api/users?username=agape
// - GET /api/raw-materials
// - GET /api/products?id=1

export default function handler(req, res) {
  try {
    const dbPath = join(process.cwd(), '..', 'db.json');
    const db = JSON.parse(readFileSync(dbPath, 'utf-8'));

    const { resource } = req.query;
    if (!resource || typeof resource !== 'string') {
      return res.status(400).json({ error: 'Resource not specified' });
    }

    const collection = db[resource];
    if (!collection) {
      return res.status(404).json({ error: `Resource '${resource}' not found` });
    }

    // Apply simple query filtering (exact match) on all query params
    const filters = { ...req.query };
    delete filters.resource;

    const result = Object.keys(filters).length === 0
      ? collection
      : collection.filter(item => {
          return Object.entries(filters).every(([key, value]) => {
            // Compare as strings for simplicity
            if (item[key] === undefined) return false;
            return String(item[key]) === String(value);
          });
        });

    res.status(200).json(result);
  } catch (err) {
    console.error('API handler error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

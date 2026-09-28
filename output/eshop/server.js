const path = require('path');
const express = require('express');

const app = express();
const port = process.env.PORT || 3001;
const dataPath = path.join(__dirname, '..', '..', 'challenges', 'eshop', 'automobileParts.json');
const parts = require(dataPath);

app.use(express.json());
app.use(express.static(__dirname));

function matches(part, query) {
  const searchable = [part.name, part.description, part.manufacturer, part.part_number, ...part.model_compatibility]
    .join(' ')
    .toLowerCase();
  return searchable.includes(query.toLowerCase());
}

app.get('/api/parts', (req, res) => {
  const offset = Math.max(Number.parseInt(req.query.offset, 10) || 0, 0);
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 6, 1), 50);
  const query = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  const minPrice = Number.parseFloat(req.query.minPrice);
  const maxPrice = Number.parseFloat(req.query.maxPrice);
  const filtered = parts.filter((part) => {
    if (query && !matches(part, query)) return false;
    if (Number.isFinite(minPrice) && part.price < minPrice) return false;
    if (Number.isFinite(maxPrice) && part.price > maxPrice) return false;
    return true;
  });

  res.json({
    items: filtered.slice(offset, offset + limit),
    total: filtered.length,
    offset,
    limit
  });
});

app.get('/api/parts/:id', (req, res) => {
  const part = parts.find((item) => item.id === Number.parseInt(req.params.id, 10));
  if (!part) return res.status(404).json({ error: 'Automobile part not found' });
  res.json(part);
});

app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.listen(port, () => {
  console.log(`Parts shop listening at http://localhost:${port}`);
});

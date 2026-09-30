const path = require('path');
const express = require('express');

const app = express();
const port = process.env.PORT || 3001;
const categories = ['Food', 'Transport', 'Entertainment', 'Shopping', 'Bills', 'Health', 'Other'];
let nextId = 4;
let expenses = [
  { id: 1, amount: 18.5, category: 'Food', date: '2026-09-04', description: 'Lunch with the team' },
  { id: 2, amount: 42, category: 'Transport', date: '2026-09-08', description: 'Train pass' },
  { id: 3, amount: 64.99, category: 'Bills', date: '2026-09-12', description: 'Internet bill' }
];

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function validateExpense(input) {
  const amount = Number(input.amount);
  const category = String(input.category || '').trim();
  const date = String(input.date || '').trim();
  const description = String(input.description || '').trim();
  if (!Number.isFinite(amount) || amount <= 0) return 'Amount must be a positive number.';
  if (!categories.includes(category)) return 'Choose a valid category.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) return 'Date must be valid.';
  if (description.length > 120) return 'Description must be 120 characters or fewer.';
  return null;
}

app.get('/api/categories', (_req, res) => res.json(categories));
app.get('/api/expenses', (req, res) => {
  const search = String(req.query.search || '').toLowerCase();
  const from = String(req.query.from || '');
  const to = String(req.query.to || '');
  const result = expenses.filter((expense) => {
    const matchesSearch = !search || `${expense.description} ${expense.category}`.toLowerCase().includes(search);
    const matchesFrom = !from || expense.date >= from;
    const matchesTo = !to || expense.date <= to;
    return matchesSearch && matchesFrom && matchesTo;
  }).sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  res.json(result);
});

app.get('/api/summary', (req, res) => {
  const month = /^\d{4}-\d{2}$/.test(req.query.month || '') ? req.query.month : new Date().toISOString().slice(0, 7);
  const monthly = expenses.filter((expense) => expense.date.startsWith(month));
  const total = monthly.reduce((sum, expense) => sum + expense.amount, 0);
  const byCategory = categories.map((category) => ({
    category,
    total: monthly.filter((expense) => expense.category === category).reduce((sum, expense) => sum + expense.amount, 0)
  })).filter((item) => item.total > 0).sort((a, b) => b.total - a.total);
  const byDate = Object.values(monthly.reduce((result, expense) => {
    result[expense.date] = (result[expense.date] || 0) + expense.amount;
    return result;
  }, {})).map((amount, index) => ({ amount, index }));
  res.json({ month, total, count: monthly.length, average: monthly.length ? total / monthly.length : 0, byCategory, byDate });
});

app.post('/api/expenses', (req, res) => {
  const error = validateExpense(req.body || {});
  if (error) return res.status(400).json({ error });
  const expense = {
    id: nextId++, amount: Math.round(Number(req.body.amount) * 100) / 100,
    category: req.body.category, date: req.body.date, description: String(req.body.description || '').trim() || 'No description'
  };
  expenses.push(expense);
  return res.status(201).json(expense);
});

app.delete('/api/expenses/:id', (req, res) => {
  const id = Number(req.params.id);
  const before = expenses.length;
  expenses = expenses.filter((expense) => expense.id !== id);
  if (expenses.length === before) return res.status(404).json({ error: 'Expense not found.' });
  return res.status(204).end();
});

app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.listen(port, () => console.log(`Expense tracker running at http://localhost:${port}`));

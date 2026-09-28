# Axle & Co. shop cart

A complete solution for the e-shop challenge. The Express server serves the automotive parts catalog and the browser client provides search, product details, and a persistent shopping cart.

## Run

```powershell
npm.cmd install
npm.cmd start
```

Open <http://localhost:3001>.

The server reads the challenge catalog from `challenges/eshop/automobileParts.json`.

## API

- `GET /api/parts?offset=0&limit=6` returns a paginated catalog.
- `GET /api/parts/:id` returns one part.
- `GET /api/parts?search=bosch` searches name, description, manufacturer, part number, and compatible models.
- `GET /api/parts?minPrice=10&maxPrice=50` filters by price.

# API Documentation

This directory contains auto-generated API documentation from JSDoc comments in the source code.

---

## Viewing Documentation

### Local Development

**Option 1: Serve with watch mode**
```bash
npm run docs:serve
```
Opens interactive documentation server at `http://localhost:4001` with live reload.

**Option 2: Generate static HTML**
```bash
npm run docs:generate
```
Generates HTML files in `docs/api/` that you can open directly in your browser.

**Option 3: Watch mode (continuous generation)**
```bash
npm run docs:watch
```
Automatically regenerates documentation when source files change.

### Online (GitHub Pages)

Visit the hosted API documentation at:
**https://fin-site.github.io/Finsite/api/**

---

## Documentation Structure

The API docs are organized by module:

- **Controller** - `financeController.js` - MVC Controller layer
- **Model** - `financeModel.js` - Data management and business logic
- **View** - `financeView.js` - DOM manipulation and rendering
- **Storage** - `storageService.js` - IndexedDB abstraction
- **Components** - Web Components (Dashboard, Transactions, Categories, etc.)
- **Chart** - Chart.js integration modules
- **Utils** - Helper functions and utilities

---

## Updating Documentation

Documentation is auto-generated from JSDoc comments in the source code.

### Adding Documentation to Code

Use JSDoc syntax above functions, classes, and methods:

```javascript
/**
 * Adds a new transaction to the database and updates aggregates
 * @param {Object} transactionData - Transaction details
 * @param {string} transactionData.merchant - Merchant name
 * @param {number} transactionData.amount - Transaction amount
 * @param {string} transactionData.date - Transaction date (YYYY-MM-DD)
 * @param {string} transactionData.category - Category ID
 * @param {string} transactionData.group - Group ID
 * @returns {Promise<Object>} Saved transaction with ID
 * @throws {Error} If validation fails
 */
async addTransaction(transactionData) {
  // Implementation
}
```

See [docs/JSDOC_STYLE_GUIDE.md](../JSDOC_STYLE_GUIDE.md) for comprehensive examples and best practices.

### Regenerating Docs

After updating JSDoc comments:

```bash
npm run docs:generate
```

Documentation will be regenerated and ready to view.

---

## CI/CD Integration

Documentation is automatically regenerated and published on every push to `main`:

1. GitHub Actions runs `npm run docs:generate`
2. Generated HTML is pushed to `gh-pages` branch
3. GitHub Pages serves the updated docs

See `.github/workflows/docs.yml` for the workflow configuration.

---

## Configuration

Documentation.js is configured via command-line options in `package.json`:

- **Input**: `src/**` (all source files)
- **Format**: `html` (also supports JSON, Markdown)
- **Output**: `docs/api/` directory
- **Watch**: `-w` flag for live reload

For advanced configuration, create `documentation.yml` in project root.

---

## Troubleshooting

### Documentation not generating

- Check that source files have valid JSDoc comments
- Run `npm run docs:generate` and check for errors
- Verify output directory: `docs/api/`

### Missing functions in docs

- Ensure functions have JSDoc comments
- Check that functions are exported
- Private methods (prefixed with `_`) may be excluded

### Formatting issues

- Validate JSDoc syntax (should start with `/**`, not `/*`)
- Check parameter types match actual code
- See [JSDoc documentation](https://jsdoc.app/) for syntax reference

---

## Contributing

When contributing code:

1. ✅ Add JSDoc comments to all public methods
2. ✅ Follow the [JSDoc Style Guide](../JSDOC_STYLE_GUIDE.md)
3. ✅ Run `npm run docs:generate` to verify docs build
4. ✅ Include API doc updates in your pull request

---

## Learn More

- [Documentation.js Official Site](https://documentation.js.org/)
- [JSDoc Official Documentation](https://jsdoc.app/)
- [Finsite JSDoc Style Guide](../JSDOC_STYLE_GUIDE.md)

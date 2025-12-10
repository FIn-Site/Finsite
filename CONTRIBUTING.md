# Contributing to Finsite

Thank you for your interest in contributing to Finsite! This document provides guidelines for contributing to the project.

## Code Style

### JavaScript

- Use ES6+ features (arrow functions, destructuring, template literals, etc.)
- Use `const` by default, `let` when reassignment needed, avoid `var`
- Use meaningful variable and function names
- Keep functions small and focused on a single responsibility
- Prefer async/await over promises chains

### JSDoc Documentation

**All public functions, methods, and classes must include JSDoc comments.** See [docs/JSDOC_STYLE_GUIDE.md](docs/JSDOC_STYLE_GUIDE.md) for detailed guidelines.

**Required for all code:**
- Function purpose and behavior
- All parameters with types and descriptions
- Return values with types
- Thrown errors
- Usage examples for complex functions

**Example:**
```javascript
/**
 * Add a transaction and update incremental aggregates.
 * 
 * @param {Transaction} transaction - Transaction to add
 * @returns {Promise<Transaction>} The added transaction with generated ID
 * @throws {Error} If validation fails or storage error occurs
 */
async function addTransaction(transaction) {
    // implementation
}
```

### File Organization

- Model layer: `src/model/`
- View layer: `src/view/`
- Controller layer: `src/controller/`
- Web Components: `src/components/`
- Storage: `src/storage/`
- Charts: `src/chart/`

## Architecture Decision Records (ADRs)

When making significant architectural decisions, document them in an ADR:

1. Copy `docs/adr/template.md` to a new file: `docs/adr/##-descriptive-name.md`
2. Fill in Context, Decision, Consequences, and Alternatives
3. Update `docs/adr/README.md` with the new ADR
4. Reference the ADR in related code comments

**When to create an ADR:**
- Choosing technologies (libraries, frameworks, tools)
- Architectural patterns (MVC, component structure)
- Data structures or storage strategies
- Major refactorings
- Performance or security strategies

## Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring

### 2. Make Changes

- Write clean, documented code following the style guide
- Add JSDoc comments to all new functions/classes
- Update architecture diagrams if architecture changes
- Create ADR if making architectural decisions

### 3. Test Your Changes

- Test manually in the browser
- Verify IndexedDB operations work correctly
- Check that UI updates properly
- Test on different screen sizes (responsive)

### 4. Commit

Use conventional commit messages:

```bash
git commit -m "feat: add transaction filtering by group"
git commit -m "fix: correct monthly spending calculation"
git commit -m "docs: add JSDoc to storage service"
git commit -m "refactor: extract chart creation to helper"
```

Types:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation only
- `style:` - Code style changes (formatting, no logic change)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Build process or auxiliary tool changes

### 5. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub with:
- Clear title describing the change
- Description of what changed and why
- Reference to any related issues (`Fixes #123`)
- Screenshots if UI changes

## Pull Request Checklist

Before submitting a PR, ensure:

- [ ] Code follows the JavaScript style guide
- [ ] **All new functions have JSDoc comments**
- [ ] No console.log statements left in code
- [ ] Code has been tested manually
- [ ] Architecture diagrams updated if needed
- [ ] ADR created if architectural decision made
- [ ] Commit messages follow conventional commits format
- [ ] PR description clearly explains changes

## Code Review

Code reviews check for:
- **JSDoc completeness** - All public APIs documented
- Code quality and readability
- Adherence to MVC architecture
- Proper use of Web Components
- IndexedDB usage patterns
- Performance considerations (incremental aggregation)
- Security concerns (XSS, data validation)

## Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/FIn-Site/Finsite.git
   cd Finsite
   ```

2. Open in VS Code:
   ```bash
   code .
   ```

3. Install Live Server extension for development
4. Open `src/index.html` with Live Server

## Questions?

- Check existing code for examples
- Review [docs/architecture/](docs/architecture/) for system design
- Review [docs/adr/](docs/adr/) for architectural decisions
- Review [docs/JSDOC_STYLE_GUIDE.md](docs/JSDOC_STYLE_GUIDE.md) for documentation standards
- Open an issue with the `question` label

## License

By contributing, you agree that your contributions will be licensed under the project's license.

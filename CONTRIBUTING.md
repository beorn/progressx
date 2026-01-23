# Contributing to progressx

Thanks for your interest in contributing! This document covers everything you need to get started.

## Development Setup

### Prerequisites

- [Bun](https://bun.sh) v1.0+ (for package management and testing)
- Node.js 18+ (for compatibility testing)

### Getting Started

```bash
# Clone the repository
git clone https://github.com/beorn/progressx.git
cd progressx

# Install dependencies
bun install

# Run tests to verify setup
bun test
```

### Project Structure

```
progressx/
├── src/
│   ├── cli/          # CLI mode classes (Spinner, ProgressBar, MultiProgress)
│   ├── react/        # React components and hooks
│   ├── wrappers/     # Ergonomic wrappers (withSpinner, withProgress, etc.)
│   ├── types.ts      # Shared type definitions
│   └── index.ts      # Main entry point
├── tests/            # Test files
├── examples/         # Demo scripts
└── package.json
```

## Test Commands

```bash
# Run all tests
bun test

# Run specific test file
bun test tests/spinner.test.ts

# Run tests in watch mode
bun test --watch

# Run tests with coverage (when available)
bun test --coverage
```

### Writing Tests

- Tests use `bun:test` (Bun's built-in test runner)
- Place test files in `tests/` with `.test.ts` extension
- Name tests descriptively: `describe("ClassName", () => { it("does something specific", ...) })`

Example test structure:

```ts
import { describe, it, expect } from "bun:test";
import { Spinner } from "../src/cli/spinner.js";

describe("Spinner", () => {
  describe("constructor", () => {
    it("accepts string as text", () => {
      const spinner = new Spinner("Loading");
      expect(spinner.currentText).toBe("Loading");
    });
  });
});
```

## Code Style

### TypeScript

- Use TypeScript for all source files
- Export types from `types.ts` for shared interfaces
- Prefer explicit types over `any`
- Use ES modules (`.js` extension in imports for ESM compatibility)

### Formatting

- Use 2-space indentation
- Use double quotes for strings
- Add trailing commas in multi-line arrays/objects
- Keep lines under 100 characters when reasonable

### Naming Conventions

- **Classes**: PascalCase (`ProgressBar`, `MultiProgress`)
- **Functions/methods**: camelCase (`updateProgress`, `showSpinner`)
- **Constants**: UPPER_SNAKE_CASE (`SPINNER_FRAMES`, `STATUS_ICONS`)
- **Files**: kebab-case (`progress-bar.ts`, `multi-progress.ts`)

### Documentation

- Add JSDoc comments for public APIs
- Include `@example` blocks for components and functions
- Keep comments concise and useful

```ts
/**
 * Animated spinner component for React TUI apps
 *
 * @example
 * ```tsx
 * <Spinner label="Loading..." style="dots" />
 * ```
 */
export function Spinner({ ... }): React.ReactElement {
```

## Pull Request Process

### Before Submitting

1. **Fork the repository** and create a feature branch from `main`
2. **Write tests** for new functionality
3. **Run all tests** and ensure they pass: `bun test`
4. **Update documentation** if you changed public APIs

### PR Guidelines

- **Keep PRs focused** - one feature or fix per PR
- **Write clear commit messages** - describe what and why
- **Add tests** - new features need tests, bug fixes should include regression tests
- **Update the README** - if you added/changed public APIs

### Commit Message Format

```
<type>: <description>

[optional body]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `test`: Adding or updating tests
- `refactor`: Code changes that don't add features or fix bugs
- `chore`: Maintenance tasks

Examples:
```
feat: add bounce spinner style
fix: handle zero total in progress bar
docs: add wrapEmitter examples
test: add MultiProgress concurrent task tests
```

### Review Process

1. Submit your PR with a clear description
2. CI will run tests automatically
3. Maintainers will review your code
4. Address any feedback
5. Once approved, your PR will be merged

## Questions?

Open an issue if you have questions or need help with your contribution.

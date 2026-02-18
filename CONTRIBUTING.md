# Contributing to Strapi Plugin Gen Types

Thank you for your interest in contributing to this project! We appreciate your help in making this plugin better.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/strapi-plugin-gen-types.git
   cd strapi-plugin-gen-types
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Create a new branch** for your feature or bugfix:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### Running Tests

Before submitting changes, ensure all tests pass:

```bash
# Run unit tests
npm run test:unit

# Run TypeScript type checks
npm run test:ts:back
npm run test:ts:front
```

### Code Quality

We use Prettier for code formatting and Commitlint for conventional commits:

```bash
# Format all files
npm run format

# Check formatting
npm run format:check
```

The repository uses Husky to automatically format staged files and validate commit messages.

### Building the Plugin

```bash
npm run build
```

### Writing Tests

- Add unit tests for new features in `server/src/**/__tests__/`
- Use Jest and mock-fs for file system testing
- Ensure tests are isolated and repeatable
- Follow the existing test patterns

## Commit Message Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` - A new feature
- `fix:` - A bug fix
- `docs:` - Documentation changes
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks
- `refactor:` - Code refactoring

**Examples:**

```
feat: add include/exclude filtering for content types
fix: prevent self-imports in generated files
docs: update README with new config options
test: add test for core user type filtering
```

## Pull Request Process

1. **Update documentation** if you're adding new features or changing behavior
2. **Add tests** for new functionality
3. **Ensure all tests pass** locally before submitting
4. **Update CHANGELOG.md** if applicable
5. **Submit your PR** with a clear description of:
   - What the change does
   - Why it's needed
   - Any breaking changes

### PR Title Format

Follow conventional commit format for PR titles:

```
feat: add support for custom type mappings
fix: resolve circular dependency imports
```

## Code Style

- Use TypeScript for all new code
- Follow the existing code structure and patterns
- Keep functions focused and single-purpose
- Add JSDoc comments for public APIs
- Use descriptive variable and function names

## Areas We Need Help

- **Test coverage** - More comprehensive test cases
- **Documentation** - Better examples and use cases
- **Performance optimizations** - Faster type generation for large projects
- **Bug fixes** - See the GitHub Issues

## Questions?

Feel free to:

- Open an issue for discussion
- Ask questions in your PR
- Reach out to the maintainers

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

Thank you for contributing! 🎉

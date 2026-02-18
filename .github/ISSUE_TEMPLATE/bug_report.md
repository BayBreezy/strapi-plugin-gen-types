---
name: 🐞 Bug Report
about: Report a bug or unexpected behavior
title: "[BUG] "
labels: bug
assignees: ""
---

## Describe the Bug

A clear and concise description of what the bug is.

## To Reproduce

Steps to reproduce the behavior:

1. Install plugin version '...'
2. Configure with '...'
3. Run '...'
4. See error

## Expected Behavior

A clear and concise description of what you expected to happen.

## Actual Behavior

What actually happened instead.

## Environment

- **Plugin Version:** [e.g., 0.0.15]
- **Strapi Version:** [e.g., 5.36.0]
- **Node Version:** [e.g., 20.x]
- **OS:** [e.g., macOS, Windows, Linux]
- **Package Manager:** [e.g., npm, yarn]

## Plugin Configuration

```typescript
// config/plugins.ts
export default ({ env }) => ({
  "gen-types": {
    enabled: true,
    config: {
      // Your configuration here
    },
  },
});
```

## Generated Types Sample

If applicable, share a snippet of the generated types that show the issue.

```typescript
// Example of problematic generated code
```

## Error Messages / Logs

```
Paste any error messages or relevant logs here
```

## Screenshots

If applicable, add screenshots to help explain your problem.

## Additional Context

Add any other context about the problem here.

## Possible Solution

If you have ideas on how to fix this, please share.

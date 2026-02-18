# Security Policy

## Supported Versions

We release patches for security vulnerabilities for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.0.x   | :white_check_mark: |

## Reporting a Vulnerability

We take the security of this plugin seriously. If you discover a security vulnerability, please help us by reporting it responsibly.

**Please do NOT open a public issue.**

Instead, please report security vulnerabilities by:

1. **Email:** Send details to [behon.baker@yahoo.com](mailto:behon.baker@yahoo.com)
2. **GitHub Security Advisory:** Use the [private vulnerability reporting feature](https://github.com/BayBreezy/strapi-plugin-gen-types/security/advisories/new)

### What to Include

Please include the following information in your report:

- Description of the vulnerability
- Steps to reproduce the issue
- Potential impact of the vulnerability
- Any suggested fixes or mitigations
- Your contact information (optional but helpful)

### Response Timeline

- **Initial Response:** Within 48 hours of receipt
- **Status Update:** Within 7 days with our assessment
- **Fix Timeline:** We aim to release a patch within 30 days for confirmed vulnerabilities

### Disclosure Policy

- Please give us reasonable time to address the vulnerability before any public disclosure
- We will credit you in the security advisory unless you prefer to remain anonymous
- We will coordinate with you on the disclosure timeline

## Security Best Practices

When using this plugin:

1. **Development Only:** This plugin is designed for development environments only and should not run in production
2. **Keep Updated:** Regularly update to the latest version to receive security patches
3. **Dependency Updates:** Keep your Strapi installation and dependencies up to date
4. **Access Control:** Use Strapi's built-in RBAC to control who can access the Gen Types admin interface

## Known Security Considerations

- **File System Access:** This plugin writes files to your file system. Ensure proper permissions on the output directory.
- **Production Safety:** The plugin is disabled in production mode by default. Do not override this behavior.
- **Type Generation:** Generated types are based on your schema definitions. Ensure your schema doesn't expose sensitive information.

Thank you for helping keep this project and its users safe!

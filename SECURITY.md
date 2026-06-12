# Security Policy

## Supported Versions

Novae Universe is actively developed. Security fixes are applied to the latest
version on `main`.

| Version | Supported |
| --- | --- |
| latest (`main`) | :white_check_mark: |
| older commits | :x: |

## Reporting a Vulnerability

We take security seriously. If you discover a vulnerability in Novae Universe,
please **do not** open a public GitHub issue.

### How to Report

Please report vulnerabilities by emailing the maintainer directly or using
GitHub's private security advisory feature:

1. Go to the [Security Advisories](https://github.com/meneeses/novae-universe/security/advisories) page
2. Click **"Report a vulnerability"**
3. Fill in the details of the issue

Alternatively, contact: meneses-joao@hotmail.com

### What to Include

Please include as much of the following information as possible:

- A description of the vulnerability and its potential impact
- Steps to reproduce the issue
- Any proof-of-concept or exploit code (if applicable)
- Affected component(s) (e.g., auth flow, API route, database query)

## Sensitive Areas

Novae Universe handles the following sensitive data — please pay special
attention when auditing:

- **GitHub OAuth tokens** — used for authentication and GitHub API access
- **JWT session tokens** — signed with `JWT_SECRET`
- **Database credentials** — `DATABASE_URL` grants full PostgreSQL access
- **API routes** — under `novae-api/src/routes/` — ensure proper auth checks
- **Environment variables** — never commit `.env` files or secrets to the repo

## Response Timeline

- **Acknowledgement:** Within 72 hours of receiving a report
- **Status update:** Within 7 days
- **Fix or mitigation:** Depends on severity; critical issues will be prioritized

## Disclosure Policy

We follow a **coordinated disclosure** model. Once a fix is available, we will:

1. Publish a GitHub Security Advisory
2. Credit the reporter (unless they wish to remain anonymous)
3. Release a patched version

Thank you for helping keep Novae Universe and its users safe!

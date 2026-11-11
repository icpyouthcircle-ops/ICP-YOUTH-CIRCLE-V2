# ICP YOUTH CIRCLE V2

A student portal for learning resources, entry-test preparation, admissions guidance, opportunities, community questions and study tools.

## Owner guide

Start with [Admin and deployment guide](docs/ADMIN-AND-DEPLOYMENT-GUIDE.md). It covers administrator access, Firebase domains, publishing, Apps Script setup, AI credentials and Vercel deployment.

## Development

Use Node.js 22 or later.

```sh
npm ci
npm run dev
```

The preview runs on port 3000 by default; `--host` and `--port` flags are supported. To prepare a release:

```sh
npm run test:release
```

This checks JavaScript syntax and startup budget, builds `dist/`, and validates release assets and source-file exclusion. `npm test` also runs existing backend and Playwright regression tests; install their browser with `npx playwright install chromium` in a development environment that supports browser execution.

## Hosting and services

Vercel configuration is in `vercel.json`. Deploy the `dist/` output with `npm run build`. The existing Google Sheets/Apps Script backend and Firebase identity provider remain in use. API keys belong in Apps Script Script Properties. A frontend deployment does not update Apps Script or populate spreadsheet records.

The preparation tracker stores tasks in the visitor's browser and supports JSON export. Its focus timer and percentage calculator do not need a sign-in. AI, administrator editing, submissions, student questions and account scoring depend on correctly configured live services.

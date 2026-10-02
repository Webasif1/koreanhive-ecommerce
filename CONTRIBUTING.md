# Contributing to Korean Hive

Thanks for your interest in improving Korean Hive. This is the codebase of a
live shop, so changes are reviewed carefully before they reach `main`.

## Reporting bugs and ideas

- **Bugs and feature ideas:** open an issue using one of the templates.
- **Security issues:** do **not** open a public issue. Follow
  [SECURITY.md](SECURITY.md) instead.

## Local setup

```bash
npm install
cp .env.example .env      # then fill in MONGODB_URI, AUTH_SECRET, ADMIN_*
npm run db:seed
npm run admin:create
npm run dev
```

Use a **local or test database** only. Never point a development setup at the
production database.

## Making a change

1. Create a branch from `main` (`fix/...`, `feat/...`).
2. Keep each pull request focused on one change.
3. Before pushing, run the same checks as CI:

   ```bash
   npm run lint
   npx tsc --noEmit
   npm test
   ```

4. If you ran `npm install`, run `npm run lock:fix` and commit the regenerated
   `package-lock.json`, otherwise `npm ci` fails in CI.
5. Use [Conventional Commit](https://www.conventionalcommits.org) messages,
   for example `fix(checkout): ...` or `feat(combos): ...`.
6. Open a pull request and fill in the template.

## Secrets and customer data

- Never commit `.env` files, API keys, passwords, database URIs or FTP
  credentials. `.env.example` must contain placeholders only.
- Never include real customer names, phone numbers, addresses or orders in
  code, tests, screenshots or issues. Use made-up test data.
- If you commit a secret by mistake, tell the maintainer straight away. It has
  to be rotated; deleting the commit is not enough.

## Code of Conduct

By taking part you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

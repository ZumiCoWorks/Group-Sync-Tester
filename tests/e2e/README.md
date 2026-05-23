Playwright E2E tests for AFDA booking apps

Setup

1. Install Playwright in the project (from repo root or in the slot-booking app):

   npm install -D @playwright/test
   npx playwright install

2. Run tests from the repository root or the tests/e2e folder:

   npx playwright test --config=tests/e2e/playwright.config.ts

Notes
- Tests assume the `slot-booking` app runs on `http://localhost:3000` and backend on `http://localhost:3001`.
- Update selectors in `tests/e2e/tests/import.spec.ts` to match your UI structure.

# Wallet v2 — Personal Finance App

Mobile-first (iOS-first) personal finance tracker. BRL primary, USD secondary (FX ≈ 5.19). React Native. Geist + Geist Mono typography. Tabular numerals everywhere. Dark/light theme via CSS custom properties.

## Project Vision

Speed of input, clarity of visualization. Add a transaction in ≤ 4 seconds (2 taps + digits). Slightly brutalist: typography-driven hierarchy, borders over shadows, color as signal only (green = income/positive, red = expense/alert, amber = warning).

## Tech Stack

- **Frontend:** React Native (iOS-first, Android secondary)
- **Language:** TypeScript (strict mode)
- **State:** Zustand (with persistence middleware)
- **Styling:** SCSS with BEM naming — NO inline styles in TSX
- **Fonts:** Geist (sans) + Geist Mono (numerals, labels, captions)
- **i18n:** react-i18next — PT-BR default, EN secondary. Every visible string through `t()`. Missing translation key = bug
- **Backend:** AWS Lambda (Node.js 20+), API Gateway
- **Database:** DynamoDB single-table design (PK=userId, SK=entity-specific)
- **Auth:** AWS Cognito User Pool — invite-only (pre-sign-up Lambda trigger validates access_grants table)
- **Social login:** Cognito federated identity with Google OAuth
- **Storage:** S3 + CloudFront for static assets
- **IaC:** AWS CDK
- **CI/CD:** GitHub Actions — deploy on release tag

## Authentication

### Invite-Only Access
- No public signup. Users are added via an `access_grants` DynamoDB table
- A pre-sign-up Lambda trigger checks if the email exists in `access_grants` before allowing registration
- Social login (Google) goes through the same validation

### Cognito Setup
- User Pool with email as primary identifier
- Custom attributes: `custom:role` (owner, member, viewer)
- Post-confirmation Lambda assigns default group and initializes user profile in DynamoDB
- Federated identity provider: Google OAuth (via Cognito Hosted UI or custom UI)
- Token validation: always verify Cognito JWT signature server-side. No trust-the-header shortcuts

## Database Design (DynamoDB Single-Table)

```
PK              SK                          Entity
USER#<id>       PROFILE                     User profile
USER#<id>       SETTINGS                    User preferences (currency, theme, budget)
USER#<id>       ACCOUNT#<id>                Bank/card account
USER#<id>       TX#<YYYY-MM>#<id>           Transaction
USER#<id>       CAT#<slug>                  Custom category
USER#<id>       BUDGET#<YYYY-MM>            Monthly budget
USER#<id>       RECURRING#<id>              Recurring transaction template
INVITE#<email>  GRANT                       Access grant (invite-only)
```

## Screens (from mockups)

1. **Home** (A/B variants) — Monthly balance card, budget bar, stat grid (income/expenses/remaining/projected), recent transactions
2. **Add Transaction** (bottom sheet) — Segmented toggle (expense/income/transfer), amount with numeric keypad, category chips, account selector, description
3. **Transactions List** — Grouped by day, filter chips (all/expenses/income), search
4. **Forecast** (A/B variants) — Bar chart (6 months realized + 1 projected), confirmed recurring items with toggles, history-based category estimates
5. **Categories** — Grid of category cards with spent/budget progress bars, add new category
6. **Settings** — Profile, accounts (3), categories (9), monthly budget, theme, currency, export (CSV/OFX), auto backup
7. **Empty States** — First-use home (R$ 0,00 dashed), forecast insufficient data (progress tracker)

## Design Tokens

All defined in CSS custom properties. Use ONLY existing tokens — never invent variables.

### Colors
- Backgrounds: `--bg-0` through `--bg-4` (darkest to lightest)
- Text: `--text-1` through `--text-4` (primary to faintest)
- Borders: `--border-1`, `--border-2`
- Semantic: `--pos` (green), `--neg` (red), `--warn` (amber)
- Categories: `--cat-mercado`, `--cat-restaurante`, `--cat-transporte`, `--cat-casa`, `--cat-saude`, `--cat-lazer`, `--cat-trabalho`, `--cat-educacao`, `--cat-assinaturas`, `--cat-outros`

### Radii
- `--r-card: 16px`, `--r-card-sm: 12px`, `--r-input: 8px`, `--r-pill: 999px`

### Spacing
- `--s-1: 4px`, `--s-2: 8px`, `--s-3: 12px`, `--s-4: 16px`, `--s-5: 24px`, `--s-6: 32px`

## Categories

12 categories with OKLCH colors: mercado, restaurante, transporte, casa, saude, lazer, trabalho, assinaturas, educacao, salario, freelance, outros. Users can add custom categories.

## Component Inventory

- `BalanceCard` — Hero saldo, widget-ready. Props: value, delta, currency, month, kind (a=brutalist, b=quiet)
- `BudgetBar` — Progress bar with 25/50/75 markers. States: normal (green), warning (amber >70%), danger (red >90%)
- `StatCard` — 2x2 grid stat. Props: label, value, sub, accent, icon
- `TransactionRow` — Category icon + description + account + amount. Compact variant for home
- `TransactionGroup` — Day header (date + weekday + daily total) + transaction rows
- `CategoryIcon` — Colored rounded square with Lucide-style icon
- `FAB` — 3 variants for A/B testing: circle, pill, tab-center
- `BottomTabBar` — 5 tabs: Home, Transactions, (add), Forecast, Categories, Settings
- `MonthSelector` — Horizontal swipeable month selector with chevrons
- `BarChart` — 6 months realized (solid) + 1 projected (dashed outline)
- `NumericKeypad` — Custom 3x4 grid, comma for decimals, backspace
- `Chip` — Filter pills with optional leading dot (category color) or icon
- `SegmentedToggle` — Expense/Income/Transfer selector
- `BottomSheet` — Modal overlay with grip handle

## Microinteractions

- Balance count-up animation (300ms easeOut) on month change
- Horizontal swipe on month selector
- Haptic: medium on save transaction, light on toggle
- Pull-to-refresh with numeric tracker
- Swipe-left on list item reveals Edit/Delete
- Sheet slide-up animation on add transaction
- Toast notification after save ("Salvo · +R$ 187,42")

## Infrastructure Costs Page

Track and display AWS infrastructure costs:
- Lambda invocations + compute time
- DynamoDB read/write capacity units
- S3 storage + CloudFront bandwidth
- Cognito MAU
- API Gateway requests
- Total monthly cost with month-over-month trend

## Deploy

### Frontend
```bash
npm run build
aws s3 sync dist/ s3://<bucket-name> --delete --profile personal
aws cloudfront create-invalidation --distribution-id <id> --paths "/*" --profile personal
```

### Backend (CDK)
```bash
cd infra
cdk deploy --profile personal
```

### Smart Deploy Script
Detect changed files and deploy only affected stacks (frontend-only, backend-only, or full). Tag deployments with timestamp.

## Version Bumping

Semantic versioning: `vMAJOR.MINOR.PATCH`
- **MAJOR:** Breaking changes to data model or API
- **MINOR:** New features (new screen, new integration)
- **PATCH:** Bug fixes, UI tweaks

```bash
npm version patch|minor|major
git push --follow-tags
```

Release flow: develop → main (via PR) → tag → GitHub Actions deploy.

## Git Workflow

- **Branches:** `feat/<description>`, `fix/<description>`
- **Commits:** Conventional commits (`feat:`, `fix:`, `refactor:`, `chore:`)
- **PRs:** Against `develop` branch, squash merge
- **"Ship"** — When the user says "ship", it means: commit all changes, push to remote, and deploy (frontend to S3+CloudFront, backend via CDK). Execute all three steps without asking.
- **"Sync"** — When the user says "sync", it means: push develop to main and sync them. Checkout main, merge develop (fast-forward), push main, checkout develop back. Execute without asking.

## File Structure

```
src/
  ├── components/     # React components (PascalCase)
  ├── hooks/          # Custom hooks (use*.ts)
  ├── screens/        # Screen components (Home, Transactions, Forecast, etc.)
  ├── stores/         # Zustand stores
  ├── types/          # TypeScript interfaces (camelCase.ts)
  ├── utils/          # Utilities (camelCase.ts)
  ├── styles/         # SCSS (_*.scss partials, main.scss entry)
  ├── locales/        # i18n: pt-BR.json, en.json
  ├── data/           # Static data, constants, categories
  └── lib/            # API client, auth helpers
infra/                # AWS CDK stacks
.sources/             # Design mockups, prototypes (not deployed)
```

## Hard Rules

1. **NO inline styles in TSX** — all CSS in SCSS files with BEM naming
2. **Every visible string through `t()`** — i18n is mandatory, PT-BR default
3. **Use ONLY defined CSS tokens** — verify a variable exists before using `var(--anything)`
4. **Guard localStorage/sessionStorage in try/catch** — private mode throws
5. **Never hardcode API keys or secrets** — environment variables only
6. **Never catch errors silently** — recover, re-throw, or surface to user
7. **Every list MUST have search/filter** — as lists grow, this becomes mandatory
8. **Tabular numerals everywhere** — `font-variant-numeric: tabular-nums` on all monetary values
9. **AWS profile:** Always use `--profile personal` for all AWS CLI and CDK commands
10. **No `.env.production` files** — they override VITE defaults in CI. Use CI environment variables
11. **Amount formatting:** BRL with `pt-BR` locale, 2 decimal places. USD secondary with conversion at FX rate
12. **Never use `t` as a loop variable** — conflicts with `useTranslation()` hook's `t` function

## Testing

- **Framework:** Vitest + React Testing Library
- **Rules:** Never test implementation details. Mock API and storage, not internal state
- **Unit tests** for utils (formatters, calculators, validators)
- **Integration tests** for components with user interactions
- **All tests runnable locally** without additional tooling

## Security

- Cognito JWT signature verification on every API call
- AES-GCM 256-bit encryption for sensitive data at rest in Zustand persistence
- CORS restricted to specific origins (app domain only), never wildcard `*`
- No debug code (console.log, var_dump) in commits
- Input validation at system boundaries (API endpoints, user input)

## AWS Profile

**ALWAYS** use `--profile personal` for all AWS CLI and CDK commands. Never use the default profile or WineCommerce profile. This is a personal project.

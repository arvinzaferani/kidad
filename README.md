You are “WhoPaid?” — a Persian-first expense-splitting web application
designed for the Iranian community.

Your mission is to make shared expenses transparent, simple, and conflict-free
by answering one question clearly:
“Who paid, who owes, and why?”

The product must prioritize clarity, fairness, and real-world Iranian usage patterns.
1. Target Users & Context
Target users:
- Iranian users
- Friends, families, roommates, coworkers
- Informal, daily expense sharing (trips, rent, food, events)

Assumptions:
- Users may not be financially or technically skilled
- Many users prefer mobile usage
- Internet connectivity may be unreliable
2. Language, Tone & Localization Rules
Primary language: Persian (Farsi)
Layout direction: RTL

Tone:
- Friendly, neutral, human
- Never formal or bureaucratic
- Never judgmental
- Clear and short sentences

Examples:
❌ “You are a debtor”
✅ “You owe 250,000 Toman”

Numbers:
- Support Persian & English digits (user selectable)
Currency:
- Default: Toman
- Optional: Rial
Calendar:
- Jalali (Shamsi)
3. Core Product Features (Detailed)
3.1 Authentication & Identity
- Authentication with phone number or email + password
- No email required
- Nickname-based identity (real name optional)
- Avatar support
- Minimal stored personal data
3.2 Groups
Users can:
- Create groups
- Join groups via invite link
- Leave groups

Group properties:
- Name
- Members
- Default currency
- Optional description
- Group type (trip, home, work, event)

Permissions:
- Group admin
- Normal member
3.3 Expenses
Users can add expenses with:
- Amount
- Currency
- Date (Jalali)
- Description
- Category
- One or multiple payers
- One or multiple participants

Expense categories (default):
- Food
- Transportation
- Rent
- Utilities
- Shopping
- Entertainment
- Other
3.4 Split Methods
Supported split methods:
- Equal split
- Exact amount per user
- Percentage-based
- Share-based (weights)
- Exclude specific users (e.g. guest)

Rules:
- One expense may have multiple payers
- Total split must always equal total amount
- Rounding must be deterministic and transparent
3.5 Balance & Debt Calculation
For each user:
- Total paid
- Total share
- Net balance

Balances:
- Positive = others owe the user
- Negative = user owes others

System must:
- Calculate per-group balances
- Calculate global balances
- Explain calculations step-by-step on demand
3.6 Settlement Engine
Settlement goals:
- Minimize number of transactions
- Suggest optimal “who pays whom”

Settlement methods:
- Cash
- Card-to-card
- Bank transfer (Sheba)
- “Settled manually”

Settlement properties:
- Amount
- Payer
- Receiver
- Method
- Status (pending / settled)
3.7 Transparency & Audit
- Full expense history
- Edit/delete tracking
- Clear “why do I owe this?” explanation
- No hidden calculations
4. PWA Requirements (MANDATORY)
The application must be PWA-first.

Requirements:
- Installable (Add to Home Screen)
- Offline-first:
  - Create expenses offline
  - Queue sync when online
- Background sync
- Push notifications:
  - New expense
  - Settlement reminder
  - Group updates
- App-like mobile UX
5. Pages (Frontend – Next.js)
5.1 Public Pages
- /login
- /verify-otp
5.2 Core App Pages
- /dashboard
  - Global balance summary
  - Recent activity

- /groups
  - List of groups

- /groups/:groupId
  - Group balance
  - Members
  - Expenses list

- /groups/:groupId/expense/new
  - Create expense

- /groups/:groupId/expense/:expenseId
  - Expense details
  - Edit / delete

- /groups/:groupId/settle
  - Settlement suggestions
  - Manual settlement

- /profile
  - User info
  - Preferences
  - Currency & number format

- /settings
  - Language
  - Notifications
  - Data & privacy
6. API Design (Backend – NestJS)
6.1 Auth
POST   /auth/signup
POST   /auth/login
GET    /auth/me
6.2 Users
GET    /users/:id
PATCH  /users/:id
6.3 Groups
POST   /groups
GET    /groups
GET    /groups/:id
PATCH  /groups/:id
POST   /groups/:id/invite
POST   /groups/:id/join
POST   /groups/:id/leave
6.4 Expenses
POST   /groups/:groupId/expenses
GET    /groups/:groupId/expenses
GET    /expenses/:id
PATCH  /expenses/:id
DELETE /expenses/:id
6.5 Balances
GET    /groups/:groupId/balances
GET    /balances/global
6.6 Settlements
POST   /groups/:groupId/settlements/suggest
POST   /groups/:groupId/settlements
GET    /groups/:groupId/settlements
PATCH  /settlements/:id
7. Backend Architecture Rules
- Domain-driven design
- Pure calculation services (no DB inside logic)
- Event-based recalculation (expenseCreated → recalc)
- Idempotent APIs
- Strong TypeScript typing
8. AI Assistant Rules (Optional)
If AI features are enabled:
- Explain balances in simple Persian
- Suggest settlements
- Never judge users

9. Docker Deployment (VPS)
- This repository now includes Docker support for `web`, `api`, and `postgres`.

Files:
- `docker-compose.yml`
- `apps/api/Dockerfile`
- `apps/web/Dockerfile`
- `.dockerignore`

Run on VPS:
1. Install Docker + Docker Compose.
2. Clone project on server.
3. Start stack:
   - `docker compose up -d --build`
4. App URLs:
   - Web: `http://<SERVER_IP>:3000`
   - API: `http://<SERVER_IP>:3001/api`

Notes:
- API container runs migrations at startup.
- For production domains, place Nginx/Caddy in front of `web` and `api` containers.
- Never invent financial data
- Always be neutral and factual
9. Non-Goals (Explicit)
- No gambling
- No loans or interest
- No financial advice
- No forced real-name usage
10. Product Principle
If the user does not understand their balance in 5 seconds,
the feature is considered broken.

1️⃣ DB SCHEMA (TypeORM)

This project uses TypeORM entities under:

📁 apps/api/src/database/entities

enum Currency {
  TOMAN
  RIAL
}

enum SplitType {
  EQUAL
  EXACT
  PERCENT
  SHARE
}

enum SettlementMethod {
  CASH
  CARD
  BANK
  MANUAL
}

enum SettlementStatus {
  PENDING
  SETTLED
}

model User {
  id            String   @id @default(uuid())
  phone         String   @unique
  nickname      String
  avatarUrl     String?
  createdAt     DateTime @default(now())

  memberships   GroupMember[]
  expensesPaid  ExpensePayer[]
  splits        ExpenseSplit[]
  settlementsIn  Settlement[] @relation("payer")
  settlementsOut Settlement[] @relation("receiver")
}

model Group {
  id          String   @id @default(uuid())
  name        String
  currency    Currency @default(TOMAN)
  description String?
  createdAt   DateTime @default(now())

  members     GroupMember[]
  expenses    Expense[]
  settlements Settlement[]
}

model GroupMember {
  id      String @id @default(uuid())
  userId  String
  groupId String
  isAdmin Boolean @default(false)

  user  User  @relation(fields: [userId], references: [id])
  group Group @relation(fields: [groupId], references: [id])

  @@unique([userId, groupId])
}

model Expense {
  id          String    @id @default(uuid())
  groupId     String
  description String
  amount      Decimal
  currency    Currency
  splitType   SplitType
  date        DateTime
  createdAt   DateTime @default(now())

  group       Group         @relation(fields: [groupId], references: [id])
  payers      ExpensePayer[]
  splits      ExpenseSplit[]
}

model ExpensePayer {
  id        String  @id @default(uuid())
  expenseId String
  userId    String
  amount    Decimal

  expense Expense @relation(fields: [expenseId], references: [id])
  user    User    @relation(fields: [userId], references: [id])
}

model ExpenseSplit {
  id        String  @id @default(uuid())
  expenseId String
  userId    String
  value     Decimal

  expense Expense @relation(fields: [expenseId], references: [id])
  user    User    @relation(fields: [userId], references: [id])
}

model Settlement {
  id        String            @id @default(uuid())
  groupId   String
  payerId   String
  receiverId String
  amount    Decimal
  method    SettlementMethod
  status    SettlementStatus @default(PENDING)
  createdAt DateTime         @default(now())

  group    Group @relation(fields: [groupId], references: [id])
  payer    User  @relation("payer", fields: [payerId], references: [id])
  receiver User  @relation("receiver", fields: [receiverId], references: [id])
}

2️⃣ EXACT SETTLEMENT ALGORITHM (MINIMUM TRANSACTIONS)

This is the heart of the app
Pure function, no DB, fully testable

🧮 Problem

Input:

Users

Expenses

Payers

Splits

Output:

who pays whom + amount

Minimum number of transactions

🧠 Algorithm (Net Flow Method)
Step 1: Compute net balance per user
type BalanceMap = Record<string, number> // userId -> balance

function calculateBalances(
  expenses: ExpenseWithPayersAndSplits[]
): BalanceMap {
  const balance: BalanceMap = {}

  for (const expense of expenses) {
    for (const payer of expense.payers) {
      balance[payer.userId] =
        (balance[payer.userId] ?? 0) + payer.amount
    }

    for (const split of expense.splits) {
      balance[split.userId] =
        (balance[split.userId] ?? 0) - split.value
    }
  }

  return balance
}

Step 2: Separate debtors & creditors
function splitDebtorsCreditors(balance: BalanceMap) {
  const debtors: [string, number][] = []
  const creditors: [string, number][] = []

  for (const [userId, amount] of Object.entries(balance)) {
    if (amount < 0) debtors.push([userId, -amount])
    if (amount > 0) creditors.push([userId, amount])
  }

  return { debtors, creditors }
}

Step 3: Generate settlements (greedy, optimal)
type SettlementSuggestion = {
  from: string
  to: string
  amount: number
}

function generateSettlements(
  debtors: [string, number][],
  creditors: [string, number][]
): SettlementSuggestion[] {
  const result: SettlementSuggestion[] = []

  let i = 0
  let j = 0

  while (i < debtors.length && j < creditors.length) {
    const [debtorId, debt] = debtors[i]
    const [creditorId, credit] = creditors[j]

    const amount = Math.min(debt, credit)

    result.push({
      from: debtorId,
      to: creditorId,
      amount
    })

    debtors[i][1] -= amount
    creditors[j][1] -= amount

    if (debtors[i][1] === 0) i++
    if (creditors[j][1] === 0) j++
  }

  return result
}


✅ Guarantees:

Minimum transactions

Deterministic

Explainable

O(n)

3️⃣ PWA ARCHITECTURE (Next.js)
📁 Structure
app/
  layout.tsx
  page.tsx
  offline/page.tsx
public/
  manifest.json
  icons/
service-worker.ts
next.config.js

⚙️ next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true
})

module.exports = withPWA({
  reactStrictMode: true
})

📱 public/manifest.json
{
  "name": "WhoPaid?",
  "short_name": "WhoPaid",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#16a34a",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}

🔁 Offline Strategy
Resource	Strategy
App shell	Cache First
API GET	Network First
POST expenses	Background Sync
Images	Cache First
🔔 Push Notifications

Expense added

Settlement reminder

Sync completed

4️⃣ CURSOR RULES (VERY IMPORTANT)

Create .cursor/rules.md

# Cursor Rules – WhoPaid?

## General
- Always write TypeScript
- Prefer pure functions
- Never mix DB logic with calculations

## Language
- UI text must follow `persian-terminology.md`
- Never invent Persian copy

## Backend
- Use domain services
- No calculations inside controllers
- TypeORM via repositories

## Frontend
- Mobile-first
- RTL by default
- Offline-first mindset

## PWA
- Never break offline flows
- Always queue mutations if offline

## AI Safety
- Never invent financial data
- Never judge users

# Kidad — Quick Split

## Overview

**Quick Split (اسپلیت سریع)** allows a Kidad user who has paid for something to quickly create a split session and invite friends without requiring them to already have a Kidad account.

The core experience should be:

> **Create → Show QR → Friends Join → Add Expense → Split**

The feature is designed primarily for situations where people are physically together, such as a dinner, trip, coffee, or group activity.

---

# User Flow

```text
Quick Split
    ↓
Create Split Session
    ↓
Invite Screen
    ↓
Show QR Code + Share Link
    ↓
Friends scan QR / open link
    ↓
Join Session
    ↓
Participants appear in real-time / through polling
    ↓
Host adds expenses
    ↓
Select participants for each expense
    ↓
Split / Settlement
```

---

# 1. Create Quick Split

An authenticated Kidad user starts a new Quick Split.

The user does **not** need to enter the expense amount or manually define all participants before creating the session.

The session is created first.

```text
Quick Split
    ↓
Create Session
```

The host becomes the first member automatically.

```text
SplitSession
└── Host → Current User
```

---

# 2. Invite Friends

Immediately after creating the session, show an invite screen.

## Invite Screen

```text
Invite your friends

Scan the QR code or share the link
with your friends.

        ┌─────────────┐
        │             │
        │   QR CODE   │
        │             │
        └─────────────┘

Scan to join the split

kidad.ir/split/join/8xK92...

[ Share ]    [ Copy Link ]
```

### QR Code

Generate a QR code containing the session invite URL.

Example:

```text
https://kidad.ir/split/join/8xK92...
```

The QR code is the primary action for the physical/in-person use case.

### Share

Use the Web Share API where supported.

Fallback:

* Copy invite URL
* Allow the user to manually share it through any application

Do not depend on a specific messaging application.

---

# 3. Session Invite Link

There is **one invite link per Split Session**, not one link per participant.

Format:

```text
https://kidad.ir/split/join/:inviteToken
```

Example:

```text
https://kidad.ir/split/join/8xK92LmP...
```

Do not expose:

* user IDs
* member IDs
* database IDs

The token must be:

* cryptographically secure
* random
* non-guessable
* unique

---

# 4. Joining a Session

When a friend opens the invite URL:

```text
/split/join/:inviteToken
```

the backend validates the invite and identifies the Split Session.

## Authenticated User

If the user is already logged in:

```text
Open invite
    ↓
Validate token
    ↓
Create SplitMember if necessary
    ↓
Join session
    ↓
Redirect to /split/:sessionId
```

The user should not see an unnecessary authentication screen.

---

# 5. Unauthenticated User

If the user is not logged in:

```text
Invite
   ↓
Phone number
```

The existing Kidad authentication flow should be used.

## Existing User

If the phone number already belongs to a Kidad user:

```text
Phone
  ↓
Existing User
  ↓
Login / OTP
  ↓
Join Split
```

After authentication, automatically continue the original invite flow.

The user should not have to reopen the invite link.

---

## New User

If the phone number does not belong to an existing Kidad user:

```text
Phone
  ↓
Name
  ↓
Create User
  ↓
ONBOARDING / Guest
  ↓
Join Split
```

The new user is a **real Kidad User** from the beginning.

Do NOT create a separate Guest entity.

---

# 6. Guest User

A Guest is simply a Kidad User whose onboarding/account completion is not finished.

Conceptually:

```text
User
├── ONBOARDING
└── ACTIVE
```

A Guest User can:

* join Split Sessions
* participate in expenses
* have a phone number
* have a name
* have a persistent User ID

The user should not need to create another account later.

---

# 7. Guest → Active User

When the Guest decides to become a full Kidad user, the existing User should be upgraded.

Do NOT create a new User.

Example:

```text
User #123
status = ONBOARDING
```

After completing the required actions:

```text
User #123
status = ACTIVE
```

All previous data remains attached to the same User:

```text
User
 ├── Split Sessions
 ├── Expenses
 └── History
```

The conversion should require only the minimum number of actions necessary to complete the account.

---

# 8. Split Session

The main domain object is:

```text
SplitSession
```

Conceptually:

```text
SplitSession
├── id
├── hostId
├── status
├── inviteToken
├── members
└── expenses
```

Possible statuses:

```text
ACTIVE
COMPLETED
CANCELLED
```

Use existing project conventions if equivalent status enums already exist.

---

# 9. Split Members

Every participant in the session is represented by a `SplitMember`.

```ts
SplitMember {
  id
  sessionId
  userId
  joinedAt
}
```

`userId` always references a real Kidad User.

There is no Guest/temporary member entity.

Example:

```text
SplitSession #123

Members:
├── User #10 → Arvin
├── User #11 → Bardia
├── User #12 → Amir
└── User #13 → Reza (ONBOARDING)
```

---

# 10. Session Screen

After joining, the user enters the session.

Example:

```text
Quick Split

People

✓ Arvin — You
✓ Bardia
✓ Amir
○ Reza — Waiting

Expenses

No expenses yet.

[ Add Expense ]
```

The Host should be able to see participants as they join.

---

# 11. Do Not Wait for Everyone

The Host does **not** need to wait until every invited person has joined.

For example:

```text
✓ Arvin
✓ Bardia
○ Amir — Waiting
○ Reza — Waiting

[ Add Expense ]
```

The Host can already add an expense.

This is important because users may want to enter the expense immediately while other participants join later.

---

# 12. Add Expense

The Host can add an expense at any point.

Example:

```text
Add Expense

Title
[ Dinner ]

Amount
[ 1,200,000 تومان ]

Participants

☑ Arvin
☑ Bardia
☑ Amir
☑ Reza

[ Add Expense ]
```

The participants of an expense are selected independently.

Therefore, not every Session Member necessarily has to participate in every expense.

Example:

```text
Session Members:
Arvin
Bardia
Amir
Reza

Dinner:
Arvin
Bardia
Amir
Reza

Taxi:
Arvin
Bardia
```

Reuse the existing Kidad expense/splitting logic whenever possible.

Do not duplicate existing business logic.

---

# 13. Session Invite Model

The invite belongs to the Session.

Conceptually:

```text
SplitSession
├── id
├── hostId
├── inviteToken
└── ...
```

There is no need for:

```text
MemberInvite
```

unless the existing architecture requires a separate invitation entity.

The relationship is:

```text
Invite Token
      ↓
SplitSession
      ↓
Authenticated User
      ↓
SplitMember
```

---

# 14. Joining Idempotency

If a user opens the same invite multiple times:

```text
Open Invite
    ↓
Already a member?
    ↓
YES
    ↓
Redirect to existing session
```

Do not create duplicate `SplitMember` records.

---

# 15. Authorization

The backend must enforce authorization.

Users must not be able to:

* access arbitrary Split Sessions
* modify sessions they do not have permission to modify
* manipulate another user's membership
* add or edit expenses without permission
* join arbitrary sessions without a valid invite

Frontend checks are not sufficient.

All authorization must be validated server-side.

---

# 16. Realtime Updates

The session should show participants as they join.

First inspect the existing project architecture.

If WebSocket/SSE infrastructure already exists, reuse it.

If not, use lightweight polling/refetching for the MVP.

Do not introduce a complex realtime architecture only for Quick Split.

The architecture should remain upgradeable to WebSocket/SSE later.

---

# 17. Error States

Handle at least:

### Invalid Invite

```text
This invite is invalid or no longer available.
```

### Session Closed

```text
This split is no longer accepting participants.
```

### Already Joined

Redirect the user to the existing session.

### Network Error

Use the existing Kidad error handling pattern.

---

# 18. Closing a Session

The Host should eventually be able to stop accepting new participants.

Example:

```text
[ Stop accepting people ]
```

After closing:

```text
Session status = CLOSED
```

New users cannot join through the invite link.

Existing members can still access the session according to the product rules.

If the current architecture already has a suitable session status, reuse it.

---

# 19. Suggested Database Structure

Use the existing ORM and migration conventions.

Potential structure:

```text
split_sessions
----------------
id
host_id
invite_token
status
created_at
updated_at
```

```text
split_members
----------------
id
session_id
user_id
joined_at
```

Relationships:

```text
User
 │
 ├───────────────┐
 │               │
 ▼               ▼
SplitSession   SplitMember
     │
     │
     ▼
SplitMember
```

Add appropriate:

* foreign keys
* indexes
* unique constraints
* timestamps

At minimum, prevent duplicate membership:

```text
UNIQUE(session_id, user_id)
```

and duplicate invite tokens:

```text
UNIQUE(invite_token)
```

---

# 20. Frontend Routes

Suggested routes:

```text
/quick-split
```

Create a new Quick Split.

```text
/split/:sessionId
```

Session page.

```text
/split/join/:inviteToken
```

Invite/join entry point.

Use the existing routing conventions if different.

---

# 21. UX Principles

The feature should optimize for speed.

The desired interaction is:

```text
Create
  ↓
QR
  ↓
Scan
  ↓
Join
  ↓
Expense
```

Avoid unnecessary steps.

Do not ask the Host to:

* manually enter every friend's name
* know whether friends have accounts
* create accounts for friends
* wait for everyone before adding expenses

The friends should identify themselves when they join.

---

# 22. Mobile-first

Quick Split is expected to be heavily used on mobile.

Prioritize:

* large QR code
* large Share button
* easy Copy action
* minimal form fields
* fast login/signup
* clear participant status
* simple expense entry

The QR code should be large enough to scan comfortably from another phone.

---

# 23. Acceptance Scenario

The complete flow should work like this:

### Arvin

Arvin is already registered.

He opens:

```text
Quick Split
```

Creates a session.

Kidad shows:

```text
Invite your friends

        [ QR ]

Scan to join

kidad.ir/split/join/8xK92...

[ Share ] [ Copy ]
```

Arvin shows the QR to his friends.

### Bardia

Bardia scans the QR.

He is already logged in.

```text
Scan
 ↓
Join
 ↓
Split Session
```

### Amir

Amir scans the QR.

He is not logged in but already has an account.

```text
Scan
 ↓
Phone
 ↓
OTP / Login
 ↓
Join
```

### Reza

Reza scans the QR.

He has no Kidad account.

```text
Scan
 ↓
Phone
 ↓
Name
 ↓
Create User (ONBOARDING)
 ↓
Join
```

### Arvin

The session now shows:

```text
People

✓ Arvin
✓ Bardia
✓ Amir
✓ Reza
```

Arvin can immediately add:

```text
Dinner
1,200,000 تومان
```

and select the participants.

The existing Kidad split/settlement system calculates each person's share.

---

# Core Product Decision

The final Quick Split architecture is:

```text
                QUICK SPLIT
                     │
                     ▼
              Create Session
                     │
                     ▼
             ONE Invite Link
                     │
                     ▼
                ┌────────┐
                │   QR   │
                └────────┘
                     │
             Friends Join
                     │
        ┌────────────┴────────────┐
        │                         │
   Existing User            New User
        │                         │
      Login                Create User
        │                    ONBOARDING
        └────────────┬────────────┘
                     │
                     ▼
                SplitMember
                     │
                     ▼
              Split Session
                     │
                     ▼
                Add Expense
                     │
                     ▼
              Select Members
                     │
                     ▼
                 Split
```

## Final Decisions

* **One invite link per Session**
* **QR Code shown immediately after Session creation**
* **Share + Copy Link alongside QR**
* **No manual participant setup required before inviting**
* **Friends identify themselves when joining**
* **Guest = real Kidad User with incomplete onboarding**
* **Guest later becomes ACTIVE without creating a new User**
* **Host does not need to wait for everyone**
* **Expenses can be added while people are still joining**
* **Participants are selected per expense**
* **Reuse existing authentication and expense logic**
* **Mobile-first UX**
* **Keep realtime simple for MVP**

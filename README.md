# RoomSplit 💸

Smart expense splitter for college roommates. Split bills, track balances, and settle debts with minimum transactions via UPI.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Try%20it-brightgreen)](https://roomsplit.vercel.app)
[![CI](https://github.com/YOUR_USERNAME/roomsplit/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/roomsplit/actions)

> 👀 **[Try the live demo](https://roomsplit.vercel.app)** — click "Try Demo" on the landing page, no account needed.

## Features
- Create rooms and invite flatmates via a shareable link
- Add expenses with equal or custom splits
- Minimum debt settlement algorithm (greedy, O(n log n))
- One-tap UPI payment deep links — opens GPay / PhonePe directly
- Installable as a mobile app (PWA)

## Tech Stack
- Frontend: React 18 + Vite + Tailwind CSS
- Backend: Node.js + Express + Prisma ORM
- Database: PostgreSQL
- Auth: JWT (access + refresh token pattern)
- Deployed: Vercel + Railway

## Project Structure
```
roomsplit/
├── client/          # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── api/
│   │   ├── utils/
│   │   └── context/
│   └── public/
├── server/          # Express backend
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   └── utils/
│   └── prisma/
└── .github/workflows/
```

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database

### Setup
1. Clone the repository
2. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
3. Install dependencies:
   ```bash
   cd server && npm install
   cd ../client && npm install
   ```
4. Set up database:
   ```bash
   cd server
   npx prisma migrate dev
   ```
5. Run the servers:
   ```bash
   # Terminal 1 - Backend
   cd server && npm run dev

   # Terminal 2 - Frontend
   cd client && npm run dev
   ```

## API Endpoints

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/me` - Update user profile

### Rooms
- `POST /api/rooms` - Create room
- `GET /api/rooms` - Get user's rooms
- `GET /api/rooms/:id` - Get room details
- `POST /api/rooms/join` - Join room via invite code
- `DELETE /api/rooms/:id/leave` - Leave room
- `GET /api/rooms/:id/summary` - Get balances and settlement

### Expenses
- `GET /api/rooms/:roomId/expenses` - Get room expenses
- `POST /api/rooms/:roomId/expenses` - Add expense
- `DELETE /api/rooms/:roomId/expenses/:expenseId` - Delete expense

### Payments
- `GET /api/rooms/:roomId/payments` - Get room payments
- `POST /api/rooms/:roomId/payments` - Record payment
- `GET /api/rooms/:roomId/payments/settlement` - Get settlement plan

## Settlement Algorithm
The app uses a greedy algorithm to minimize the number of transactions needed to settle all debts:
1. Calculate net balance for each member
2. Separate into creditors (positive balance) and debtors (negative balance)
3. Match largest creditor with largest debtor iteratively
4. Continue until all balances are settled

Time complexity: O(n log n) due to sorting

## Demo Mode
Click "Try Demo" on the landing page to explore the app without creating an account. Demo mode uses pre-populated data and shows a warning banner indicating changes won't be saved.

## License
MIT

RoomSplit 💸

RoomSplit is an expense-sharing app I built for college roommates. It helps groups record shared expenses, keep track of who owes whom, and settle the final balances with as few transactions as possible.

Live Demo: https://roomsplit.vercel.app/

Features
Create rooms and invite members
Add expenses with equal or custom splits
Calculate balances between room members
Generate a settlement plan with minimum transactions
Open UPI payment links directly in GPay / PhonePe
Installable as a PWA
Tech Stack
React, Vite, Tailwind CSS
Node.js, Express
PostgreSQL, Prisma
JWT authentication
Vercel + Railway
How it works

The frontend is a React app that communicates with an Express REST API. The backend handles authentication, rooms, expenses and payments, and uses Prisma to work with the PostgreSQL database.

For settling debts, I wrote a greedy algorithm that calculates each member's net balance, separates creditors and debtors, and matches them until everything is settled. The sorting step makes the algorithm O(n log n).

Project Structure
roomsplit/
├── client/          # React frontend
├── server/          # Express backend
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   └── utils/
│   └── prisma/
└── .github/
Run locally
git clone https://github.com/pradnesh-jayam/roomsplit.git

cd roomsplit

cd server
npm install

cd ../client
npm install

Create the required environment files, configure PostgreSQL, then run Prisma migrations:

cd server
npx prisma migrate dev

Run the backend and frontend in separate terminals:

# backend
cd server
npm run dev
# frontend
cd client
npm run dev
Demo

You can use the Try Demo option on the landing page to explore the app without creating an account.

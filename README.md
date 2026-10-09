# RoomSplit

A full-stack expense-splitting app for roommates to record shared expenses, track balances, and coordinate repayments.

**[Live Demo](https://roomsplit-ochre.vercel.app)** · **[GitHub Repository](https://github.com/pradnesh-jayam/roomsplit)**



## Features

- Create rooms and invite members with a shareable link or invite code
- Record expenses with equal or custom splits
- View room balances and suggested debt settlements
- Open UPI payment links for repayments
- Install the app on supported devices as a Progressive Web App (PWA)

## Tech Stack

- **Frontend:** React, Vite, Tailwind CSS
- **Backend:** Node.js, Express
- **Database / ORM:** PostgreSQL, Prisma
- **Authentication:** JWT access and refresh tokens
- **Deployment:** Vercel (frontend), Render (backend)

## Project Structure

```text
roomsplit/
├── src/                 # Frontend source
├── public/              # Static assets
├── server/
│   ├── src/             # Express API
│   └── prisma/          # Prisma schema
└── .github/workflows/   # GitHub Actions workflows
```

## Run Locally

**Prerequisites:** Node.js and a PostgreSQL database.

1. Install frontend dependencies from the repository root:

   ```bash
   npm install
   ```

2. Install backend dependencies:

   ```bash
   cd server
   npm install
   ```

3. Configure the backend environment variables:

   - `DATABASE_URL`
   - `JWT_SECRET`
   - `JWT_REFRESH_SECRET`
   - `FRONTEND_URL`

   Set `VITE_API_URL` for the frontend to point to your backend API.

4. Configure the Prisma database schema for your local database. Then start the backend from `server/`:

   ```bash
   npm run dev
   ```

5. In a second terminal, start the frontend from the repository root:

   ```bash
   npm run dev
   ```

Check the scripts in the root and `server/package.json` if your local setup uses different script names.

## Settlement Approach

RoomSplit uses a greedy, sort-based approach to suggest transfers between members with positive and negative net balances. Sorting gives the settlement routine **O(n log n)** time complexity; the greedy approach does not guarantee the globally minimum possible number of transfers in every case.

## Usage Note

The app has been tried by **more than 30 friends**, and **more than 10 rooms** have been created. Six supplied test cases were reported as passing.

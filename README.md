# Freshsales Webhook & Logs Dashboard (Next.js)

This project has been upgraded to a **Next.js** application. It serves two main purposes:
1. Listens for webhooks from Freshsales CRM, fetches custom deal data, and auto-populates it.
2. Provides a beautiful React-based dashboard to view real-time execution logs.

## Setup

1. Copy `.env.example` to `.env` and fill in the values.
2. Ensure you have a MongoDB connection string in `MONGO_URI`.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

## Endpoints

- `GET /` - The React Dashboard (Logs)
- `POST /api/webhook` - The endpoint to configure in Freshsales.
- `GET /api/test` - A test endpoint to manually trigger a sync using `TEST_DEAL_ID` from your `.env`.

## Deployment

Deploy this on Vercel by simply importing the Git repository. Vercel automatically detects Next.js and builds the project with zero configuration.

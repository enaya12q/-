This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Environment Variables

To run this project, you will need to set up the following environment variables. Create a `.env.local` file in the `smart-coin-frontend` directory and a `.env` file in the `smart-coin-backend` directory.

### Frontend (`smart-coin-frontend/.env.local`)

*   `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL.
*   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase public anon key.
*   `NEXT_PUBLIC_SITE_URL`: The public URL of your deployed application (e.g., `https://your-app.vercel.app`). This is used for the Magic Link redirect.

### Backend (`smart-coin-backend/.env`)

*   `SUPABASE_URL`: Your Supabase project URL (same as `NEXT_PUBLIC_SUPABASE_URL`).
*   `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key. **WARNING: This key has elevated privileges and must ONLY be used on the server-side. Never expose it to the client-side.**
*   `GMAIL_USER`: The Gmail email address used for sending withdrawal notifications.
*   `GMAIL_APP_PASSWORD`: The Gmail App Password for the `GMAIL_USER` account. (Refer to Google's documentation on how to generate an App Password).

### Vercel Deployment

When deploying to Vercel, ensure these environment variables are configured in your Vercel project settings.
*   For `smart-coin-frontend`, configure `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_SITE_URL` as "Environment Variables".
*   For `smart-coin-backend`, configure `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GMAIL_USER`, and `GMAIL_APP_PASSWORD` as "Environment Variables".

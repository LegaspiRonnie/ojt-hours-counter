# OJT Hours Counter

A React/Next.js web application for tracking On-the-Job Training (OJT) hours with Google authentication.

## Features

- Google OAuth login
- Add, edit, delete OJT entries
- Calculate total hours with break time deduction
- Progress bar toward 486-hour target
- Export data as CSV
- Dark mode toggle
- Responsive design
- Data persistence per user

## Setup

1. Clone or download this project.

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up Google OAuth:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URIs:
     - For development: `http://localhost:3000/api/auth/callback/google`
     - For production: `https://your-vercel-app.vercel.app/api/auth/callback/google`

4. Create `.env.local` file in the root directory:
   ```
   NEXTAUTH_SECRET=your-random-secret-here
   NEXTAUTH_URL=http://localhost:3000
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment to Vercel

1. Push your code to GitHub.

2. Connect your GitHub repo to Vercel.

3. In Vercel dashboard, go to your project settings > Environment Variables, and add:
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (set to your Vercel app URL, e.g., `https://your-app.vercel.app`)
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`

4. Deploy!

## Usage

- Sign in with your Google account
- Add entries with date, time in/out, and optional break time
- View total hours and progress
- Edit or delete entries
- Export data as CSV
- Toggle dark mode

## Technologies Used

- Next.js 16
- TypeScript
- Tailwind CSS
- NextAuth.js
- Google OAuth
- Local Storage (client-side persistence)

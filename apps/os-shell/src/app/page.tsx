import { redirect } from 'next/navigation';

export default function HomePage() {
  // Middleware handles the redirection logic based on setup status.
  // We keep this as a simple redirect to /auth (or dashboard) to satisfy the app structure.
  redirect('/auth');
}

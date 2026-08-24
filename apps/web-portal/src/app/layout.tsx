import './global.css';
import { Providers } from './providers';

export const metadata = {
  title: 'Business OS — Web Portal',
  description: 'Enterprise web portal powered by Business OS design system.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

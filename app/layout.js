import './globals.css';

export const metadata = {
  title: 'Webhook Dashboard',
  description: 'View real-time logs for the Freshsales Deal Sync Webhook',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

import './globals.css';

export const metadata = {
  title: 'HoneyMoon — Vendor Portal',
  description: 'Manage your bookings and services on HoneyMoon',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-dark text-cream font-body antialiased">{children}</body>
    </html>
  );
}

import './globals.css';
import '../src/App.css';
import '../src/account.css';
import '../src/admin-extra.css';
import '../src/mobile.css';
import { AuthProvider } from '../src/context/AuthContext';
import TopBar from '../src/components/TopBar';
import Navigation from '../src/components/Navigation';
import Footer from '../src/components/Footer';
import ConciergeWidget from '../src/components/ConciergeWidget';

export const metadata = {
  title: 'Cobblyn | Luxury Handcrafted Footwear',
  description: 'Cobblyn Shoes - Bespoke luxury footwear handcrafted with timeless design.',
};

export const viewport = {
  themeColor: '#000000',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@400;500;600;700;800&family=Cormorant+Garamond:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <div className="App">
          <AuthProvider>
            <TopBar />
            <Navigation />
            {children}
            <Footer />
            <ConciergeWidget />
          </AuthProvider>
        </div>
      </body>
    </html>
  );
}
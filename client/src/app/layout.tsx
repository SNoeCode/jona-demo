import { Inter } from 'next/font/google';
// import { AuthUserProvider } from '@/context/AuthUserContext';
import { AuthProvider } from '@/context/AuthUserContext';
import { ThemeProvider } from '@/context/ThemeContext';
// import { SessionTimeoutProvider } from '@/context/SessionTimeoutContext';
import NavbarAppRouter from '@/components/navbar/Navbar';
import Footer from '@/components/footer/Footer';
import './globals.css';
import { AuthUser } from '@/types/user';
import NavbarWrapper from '@/helpers/NavWrapper';
import { SessionMonitor } from '@/components/SessionMonitor';
interface NavbarProps {
  user?: AuthUser;
  onLogoutAction?: () => void;
}

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider>
            <SessionMonitor>

            {/* <SessionTimeoutProvider> */}
              <NavbarWrapper />
              <main className="min-h-screen">{children}</main>
              <Footer />
            {/* </SessionTimeoutProvider> */}
            </SessionMonitor>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
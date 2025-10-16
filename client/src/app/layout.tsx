import { Inter } from 'next/font/google';
import { AuthUserProvider } from '@/context/AuthUserContext';
import { ThemeProvider } from '@/context/ThemeContext';
// import { SessionTimeoutProvider } from '@/context/SessionTimeoutContext';
import NavbarAppRouter from '@/components/navbar/Navbar';
import Footer from '@/components/footer/Footer';
import './globals.css';
import { AuthUser } from '@/types/user';
import NavbarWrapper from '@/helpers/NavWrapper';
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
          <AuthUserProvider>
            {/* <SessionTimeoutProvider> */}
              <NavbarWrapper />
              <main className="min-h-screen">{children}</main>
              <Footer />
            {/* </SessionTimeoutProvider> */}
          </AuthUserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
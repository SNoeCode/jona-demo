'use client';

import { useAuth } from '@/context/AuthUserContext';
import NavbarAppRouter from '@/components/navbar/Navbar';

export default function NavbarWrapper() {
  // No longer need to pass props - Navbar gets everything from useAuth()
  return <NavbarAppRouter />;
}
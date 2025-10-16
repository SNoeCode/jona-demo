import {AuthUser,UserProfile, SlimUser} from '@/types/user/index'
export interface AppShellProps {
  initialUser: AuthUser | null;
  user?: AuthUser | null;
  currentPage: string;
  setCurrentPageAction: (page: string) => void;
  onLogoutAction: () => void;
  handleLogout?: () => void;
  loading?: boolean;
  showTimeoutWarning?: boolean;
  setShowTimeoutWarning?: (show: boolean) => void;
  resetAuthTimeout?: () => void;
  children: React.ReactNode;
}
export interface SessionControl {
  loading?: boolean;
  showTimeoutWarning?: boolean;
  setShowTimeoutWarning?: (show: boolean) => void;
  resetAuthTimeout?: () => void;
  handleLogout?: () => void;
}
export interface AuthFormProps {
  mode: "login" | "register";
  onSuccessAction: (user: AuthUser) => void;
  setCurrentPageAction: (page: string) => void;
}
interface AppShellState {
  user: SlimUser | null;
  profile: UserProfile | null;
  isLoading: boolean;
  authError: string | null;
}
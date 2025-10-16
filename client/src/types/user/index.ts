// types/index.ts
import { AuthUser } from "./authUser";
import { UserRole } from "./authUser";

export * from "./app_shell";
export * from "./application";
export * from "./authUser";   // Keep this - it's your main auth types
export * from "./dashboard";         
export * from "./jobs";             
export * from "./notifications"; 
export * from "./profile";
export * from "./resume";            
export * from "./settings";
export * from "./subscription";
export * from "./usage";            
export * from "./calendar";            


export interface AuthContextType {
  authUser: AuthUser | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; user?: AuthUser | null; error?: string }>;
  register: (email: string, password: string, options?: { full_name?: string; role?: UserRole }) => Promise<{ success: boolean; user?: AuthUser | null; error?: string }>;
  logout: () => Promise<void>;
  refreshSession?: () => Promise<void>;
}
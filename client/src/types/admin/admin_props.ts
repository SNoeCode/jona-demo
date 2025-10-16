import { AdminAuthUser } from "./admin_authuser";
// ===== COMPONENT PROPS =====
export interface AdminTabProps {
  user: AdminAuthUser;
  onStatsUpdate?: () => void;
}

export interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}


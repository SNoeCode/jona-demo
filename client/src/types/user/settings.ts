import {AuthUser, Notification} from '@/types/user/index'

export interface UserSettings {
  id: string;
  user_id?: string;
  auto_scrape_enabled?: boolean;
  scrape_frequency_hours?: number;
  auto_apply_enabled?: boolean;
  notification_email?: boolean;
  notification_push?: boolean;
  created_at?: string;
  updated_at?: string;
}
export type SettingsState = {
  darkMode: boolean;
  notifications: boolean;
  emailAlerts: boolean;
  soundAlerts: boolean;
  autoSave: boolean;
  defaultCategory: string;
  jobAlertFrequency: string;
};
export interface SettingsProps {
  user: AuthUser;
  onSettingsChange: (settings: SettingsState) => void;
}


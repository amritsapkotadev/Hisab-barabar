import { createContext, useContext } from 'react';

export type AppAlertButton = {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
};

export type AppAlertState = {
  title: string;
  message?: string;
  buttons: AppAlertButton[];
};

export type AppAlertContextValue = {
  showAlert: (title: string, message?: string, buttons?: AppAlertButton[]) => void;
};

export const AppAlertContext = createContext<AppAlertContextValue | undefined>(undefined);

export function useAppAlert() {
  const context = useContext(AppAlertContext);
  if (!context) {
    throw new Error('useAppAlert must be used within ThemeProvider');
  }
  return context.showAlert;
}

import { create } from 'zustand';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertState {
  visible: boolean;
  title: string;
  message: string;
  type: AlertType;
  buttons: AlertButton[];
  onDismiss?: () => void;
  showAlert: (options: {
    title: string;
    message: string;
    type?: AlertType;
    buttons?: AlertButton[];
    onDismiss?: () => void;
  }) => void;
  hideAlert: () => void;
}

export const useAlertStore = create<AlertState>((set) => ({
  visible: false,
  title: '',
  message: '',
  type: 'info',
  buttons: [{ text: 'OK', style: 'default' }],
  onDismiss: undefined,
  
  showAlert: (options) => {
    set({
      visible: true,
      title: options.title,
      message: options.message,
      type: options.type || 'info',
      buttons: options.buttons || [{ text: 'OK', style: 'default' }],
      onDismiss: options.onDismiss,
    });
  },
  
  hideAlert: () => {
    set((state) => {
      if (state.onDismiss) {
        state.onDismiss();
      }
      return { visible: false };
    });
  },
}));
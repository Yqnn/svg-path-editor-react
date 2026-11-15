import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import Snackbar from '@mui/material/Snackbar';
import SnackbarContent from '@mui/material/SnackbarContent';
import Icon from '@mui/material/Icon';

interface SnackbarContextValue {
  showCopied: () => void;
}

const SnackbarContext = createContext<SnackbarContextValue | null>(null);

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  const showCopied = useCallback(() => {
    setOpen(true);
  }, []);

  const value = useMemo(() => ({ showCopied }), [showCopied]);

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={2000}
        onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ top: 8 }}
      >
        <SnackbarContent
          message={
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ flex: 1 }}>Copied to clipboard</span>
              <Icon>content_pasted</Icon>
            </div>
          }
        />
      </Snackbar>
    </SnackbarContext.Provider>
  );
}

export function useSnackbar(): SnackbarContextValue {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error('useSnackbar must be used inside a SnackbarProvider');
  }
  return context;
}

import { createTheme } from '@mui/material/styles';

/**
 * Replicates the Angular Material 2 dark theme used by the original app
 * (grey 800 primary, blue accent, red warn).
 */
export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#424242', contrastText: '#ffffff' },
    secondary: { main: '#2196f3', contrastText: '#ffffff' },
    error: { main: '#f44336', contrastText: '#ffffff' },
    background: { default: '#1e1e1e', paper: '#252526' },
    text: { primary: '#ffffff', secondary: '#c8c8c8', disabled: 'rgba(255,255,255,0.38)' },
    divider: 'rgba(255, 255, 255, 0.12)',
    action: {
      active: '#ffffff',
      hover: 'rgba(255, 255, 255, 0.08)',
      selected: 'rgba(255, 255, 255, 0.16)',
      disabled: 'rgba(255, 255, 255, 0.38)',
      disabledBackground: 'rgba(255, 255, 255, 0.12)',
    },
  },
  shape: { borderRadius: 4 },
  typography: {
    fontFamily: 'Roboto, Arial, "Helvetica Neue", sans-serif',
    fontSize: 12,
    body1: { fontSize: '12px', lineHeight: '16px' },
    body2: { fontSize: '12px', lineHeight: '12px' },
    button: {
      fontSize: '14px',
      fontWeight: 500,
      letterSpacing: 'normal',
      textTransform: 'none',
    },
    h6: { fontSize: '20px', fontWeight: 500, lineHeight: '32px', letterSpacing: '0.0125em' },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          fontSize: 12,
        },
      },
    },
    MuiButtonBase: {
      defaultProps: {
        disableRipple: false,
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          fontWeight: 500,
          fontSize: 14,
          letterSpacing: 'normal',
          textTransform: 'none',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        sizeSmall: {
          fontSize: 13,
        },
      },
    },
    MuiFab: {
      defaultProps: {
        color: 'primary',
      },
      styleOverrides: {
        root: {
          boxShadow:
            '0px 3px 5px -1px rgba(0,0,0,0.2), 0px 6px 10px 0px rgba(0,0,0,0.14), 0px 1px 18px 0px rgba(0,0,0,0.12)',
          textTransform: 'none',
        },
        sizeSmall: {
          width: 40,
          height: 40,
          minHeight: 40,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#ffffff',
          color: 'rgba(0, 0, 0, 0.87)',
          fontSize: 12,
          fontWeight: 400,
          lineHeight: '16px',
          padding: '4px 8px',
          borderRadius: 4,
          minWidth: 40,
          maxWidth: 200,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: '#252526',
          backgroundImage: 'none',
          borderRadius: 4,
          boxShadow:
            '0px 11px 15px -7px rgba(0,0,0,0.2), 0px 24px 38px 3px rgba(0,0,0,0.14), 0px 9px 46px 8px rgba(0,0,0,0.12)',
          margin: 32,
        },
      },
    },
    MuiBackdrop: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(0, 0, 0, 0.32)',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          padding: '17px 24px 9px',
          margin: '0 0 1px',
          lineHeight: '32px',
          fontSize: 20,
          fontWeight: 500,
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: '0 24px 20px',
          fontSize: 16,
          lineHeight: '24px',
          color: 'rgba(255, 255, 255, 0.7)',
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: 8,
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: '#424242',
          backgroundImage: 'none',
          maxWidth: 320,
          minWidth: 112,
        },
        list: {
          paddingTop: 8,
          paddingBottom: 8,
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          minHeight: 48,
          fontSize: 16,
          lineHeight: '24px',
          padding: '6px 16px',
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          minWidth: 40,
          color: 'inherit',
        },
      },
    },
    MuiCheckbox: {
      defaultProps: {
        color: 'secondary',
        size: 'small',
      },
      styleOverrides: {
        root: {
          padding: 4,
        },
      },
    },
    MuiSlider: {
      defaultProps: {
        color: 'secondary',
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'filled',
        color: 'secondary',
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          fontSize: 16,
        },
      },
    },
    MuiFormLabel: {
      styleOverrides: {
        root: {
          fontSize: 16,
        },
      },
    },
    MuiTable: {
      styleOverrides: {
        root: {
          backgroundColor: 'transparent',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          fontSize: 12,
          color: '#ffffff',
          borderBottomColor: 'rgba(255, 255, 255, 0.12)',
          padding: '0 16px',
          height: 48,
        },
        head: {
          fontSize: 14,
          fontWeight: 500,
          height: 56,
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
          },
        },
      },
    },
    MuiTableSortLabel: {
      styleOverrides: {
        root: {
          '&:hover': {
            color: '#ffffff',
          },
          '&.Mui-active': {
            color: '#ffffff',
          },
          '& .MuiTableSortLabel-icon': {
            color: 'rgba(255, 255, 255, 0.5)',
          },
          userSelect: 'none',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: 'inherit',
        },
      },
    },
    MuiSnackbarContent: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          color: 'rgba(0, 0, 0, 0.87)',
          fontSize: 14,
          minWidth: 344,
          minHeight: 52,
          padding: '6px 16px',
        },
      },
    },
  },
});

import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#7C4DFF',
      light: '#B388FF',
      dark: '#651FFF',
    },
    secondary: {
      main: '#00E5FF',
      light: '#18FFFF',
      dark: '#00B8D4',
    },
    background: {
      default: '#0A0E1A',
      paper: 'rgba(20, 27, 45, 0.8)',
    },
    success: {
      main: '#00E676',
    },
    error: {
      main: '#FF5252',
    },
    warning: {
      main: '#FFD740',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h3: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h4: {
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.95rem',
          padding: '10px 24px',
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #7C4DFF 0%, #448AFF 100%)',
          boxShadow: '0 4px 20px rgba(124, 77, 255, 0.4)',
          '&:hover': {
            background: 'linear-gradient(135deg, #651FFF 0%, #2979FF 100%)',
            boxShadow: '0 6px 30px rgba(124, 77, 255, 0.6)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'rgba(20, 27, 45, 0.6)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(124, 77, 255, 0.15)',
          borderRadius: 20,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            background: 'rgba(255, 255, 255, 0.05)',
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#7C4DFF',
            },
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          background: 'rgba(15, 20, 35, 0.95)',
          backdropFilter: 'blur(30px)',
          border: '1px solid rgba(124, 77, 255, 0.2)',
          borderRadius: 24,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});

export default theme;

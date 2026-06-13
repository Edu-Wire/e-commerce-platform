export const theme = {
  colors: {
    // ECOM Premium Forest Green Theme
    brand: {
      primary: '#0FA86E',        // Forest Green
      primaryHover: '#0d9561',   // Darker Green
      primaryLight: '#EBF7F2',   // Light Sage
      border: '#D5E6CD',         // Sage Border
    },

    // Legacy/Classic Blue Theme
    classic: {
      50: '#eff6ff',
      100: '#dbeafe',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      900: '#1e3a8a',
    },

    // Amazon/Amber Accent Theme (Ratings, Gold Highlights, CTAs)
    accent: {
      50: '#fffcf5',
      100: '#fef3c7',
      500: '#f97316',            // Orange
      600: '#ea580c',            // Dark Orange
      amazonOrange: '#e47911',
      amazonYellow: '#f0c14b',
      amazonBorder: '#a88734',
      priceRed: '#b12704',
      linkBlue: '#0066c0',
    },

    // Neutral Grayscale & Slate
    neutral: {
      white: '#ffffff',
      bgLight: '#f8fafc',
      bgMuted: '#f1f5f9',
      borderLight: '#f1f5f9',
      border: '#e2e8f0',
      borderDark: '#cbd5e1',
      textLight: '#94a3b8',
      textMuted: '#64748b',
      textDark: '#334155',
      textBlack: '#1e293b',
      slate900: '#0f172a',
    },

    // Semantic Status Systems
    semantic: {
      success: {
        text: '#0FA86E',
        bg: '#EBF7F2',
        border: 'rgba(213, 230, 205, 0.3)',
      },
      danger: {
        text: '#EF4444',
        bg: '#FEF2F2',
        border: '#FEE2E2',
      },
      warning: {
        text: '#F59E0B',
        bg: '#FEF3C7',
        border: '#FDE68A',
      },
      info: {
        text: '#3B82F6',
        bg: '#EFF6FF',
        border: '#DBEAFE',
      },
      muted: {
        text: '#64748B',
        bg: '#F8FAFC',
        border: '#E2E8F0',
      }
    },

    // Custom Gradients
    gradients: {
      green: 'linear-gradient(135deg, #0FA86E 0%, #0d9561 100%)',
      greenLight: 'linear-gradient(135deg, #EBF7F2 0%, #D5E6CD 100%)',
      gold: 'linear-gradient(135deg, #f0c14b 0%, #edd8a4 100%)',
      blue: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
      dark: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    }
  }
};

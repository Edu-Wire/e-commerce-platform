export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        brand: {
          primary: '#0FA86E',        // Forest Green
          primaryHover: '#0d9561',   // Darker Green
          primaryLight: '#EBF7F2',   // Light Sage
          border: '#D5E6CD',         // Sage Border
        },
        classic: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a'
        },
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
        neutralCustom: {
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
        }
      }
    }
  },
  plugins: []
};

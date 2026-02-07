/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '1rem', // 16px (space-4)
        lg: '1.5rem', // 24px (space-6)
      },
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
      },
    },
    extend: {
      colors: {
        primary: {
          900: '#0f1835', // Main brand color
          800: '#1a2444',
          700: '#253054',
          600: '#304063',
          500: '#3b5073',
          DEFAULT: '#0f1835',
        },
        accent: {
          600: '#e25a4a', // Primary actions
          500: '#fa6e5b', // Hover states
          400: '#fb8575',
          300: '#fc9d8f',
          200: '#fdb5a9',
          DEFAULT: '#e25a4a',
        },
        gray: {
          900: '#0f1835', // Headings
          800: '#333333', // Body text
          700: '#555555', // Secondary text
          600: '#5d6272', // Muted text
          500: '#999999', // Disabled text
          400: '#afb2bd', // Placeholder
          300: '#cccccc', // Borders
          200: '#e8ecf2', // Dividers
          100: '#f4f6fa', // Backgrounds
          50: '#f8f9fa',  // Surface backgrounds
        },
        success: {
          700: '#0a7c42',
          600: '#0d9e54',
          500: '#10b866',
          400: '#3ec97d',
          DEFAULT: '#10b866',
        },
        warning: {
          700: '#c17200',
          600: '#e88700',
          500: '#ff9500',
          400: '#ffaa33',
          DEFAULT: '#ff9500',
        },
        error: {
          700: '#c42a1f',
          600: '#e25a4a',
          500: '#fa6e5b',
          400: '#fb8575',
          DEFAULT: '#e25a4a',
        },
        info: {
          700: '#0558d6',
          600: '#066de8',
          500: '#1e88e5',
          400: '#4aa3f0',
          DEFAULT: '#1e88e5',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      fontSize: {
        'display-xl': ['60px', { lineHeight: '72px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-l': ['48px', { lineHeight: '60px', letterSpacing: '-0.01em', fontWeight: '700' }],
        'h1': ['36px', { lineHeight: '44px', letterSpacing: '-0.01em', fontWeight: '600' }],
        'h2': ['30px', { lineHeight: '38px', letterSpacing: '-0.005em', fontWeight: '600' }],
        'h3': ['24px', { lineHeight: '32px', letterSpacing: '0', fontWeight: '600' }],
        'h4': ['20px', { lineHeight: '28px', letterSpacing: '0', fontWeight: '600' }],
        'h5': ['18px', { lineHeight: '26px', letterSpacing: '0', fontWeight: '500' }],
        'body-l': ['16px', { lineHeight: '24px', letterSpacing: '0', fontWeight: '400' }],
        'body-m': ['14px', { lineHeight: '21px', letterSpacing: '0', fontWeight: '400' }],
        'body-s': ['13px', { lineHeight: '19px', letterSpacing: '0', fontWeight: '400' }],
        'body-xs': ['12px', { lineHeight: '18px', letterSpacing: '0.01em', fontWeight: '400' }],
      },
      spacing: {
        '0': '0px',
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '7': '28px',
        '8': '32px',
        '10': '40px',
        '12': '48px',
        '16': '64px',
        '20': '80px',
        '24': '96px',
      },
      borderRadius: {
        'none': '0px',
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '24px',
        'full': '9999px',
      },
      boxShadow: {
        'sm': '0 1px 2px rgba(15, 24, 53, 0.05)',
        DEFAULT: '0 1px 3px rgba(15, 24, 53, 0.1), 0 1px 2px rgba(15, 24, 53, 0.06)',
        'md': '0 4px 6px rgba(15, 24, 53, 0.07), 0 2px 4px rgba(15, 24, 53, 0.06)',
        'lg': '0 10px 15px rgba(15, 24, 53, 0.1), 0 4px 6px rgba(15, 24, 53, 0.05)',
        'xl': '0 20px 25px rgba(15, 24, 53, 0.15), 0 10px 10px rgba(15, 24, 53, 0.04)',
        '2xl': '0 25px 50px rgba(15, 24, 53, 0.25)',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(156deg, #ff7265 0%, #7ac3ff 100%)',
      },
      transitionProperty: {
        'DEFAULT': 'all',
      },
      transitionTimingFunction: {
        'DEFAULT': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
      transitionDuration: {
        'DEFAULT': '200ms',
        'fast': '150ms',
        'slow': '300ms',
        'bounce': '400ms',
      },
    },
  },
  plugins: [],
};

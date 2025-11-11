import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        background: '#F5F5F0',
        foreground: '#2C2C2C',
        border: '#E8E8E3',
        disabled: '#999',
        hint: '#666',
        
        primary: {
          DEFAULT: '#2C2C2C',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#E8E8E3',
          foreground: '#2C2C2C',
        },
        muted: {
          DEFAULT: '#E8E8E3',
          foreground: '#666',
        },
        accent: {
          DEFAULT: '#2C2C2C',
          foreground: '#FFFFFF',
        },
      },
      borderRadius: {
        lg: '12px',
        md: '8px',
        sm: '4px',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          '"PingFang SC"',
          '"Hiragino Sans GB"',
          '"Microsoft YaHei"',
          'sans-serif',
        ],
      },
      fontSize: {
        'title': ['36px', { lineHeight: '1.2', fontWeight: '500', letterSpacing: '1.5px' }],
        'subtitle': ['24px', { lineHeight: '1.3', fontWeight: '500', letterSpacing: '0.5px' }],
        'body': ['18px', { lineHeight: '1.5', fontWeight: '400', letterSpacing: '0.5px' }],
        'caption': ['16px', { lineHeight: '1.4', fontWeight: '400', letterSpacing: '0.25px' }],
        'small': ['14px', { lineHeight: '1.4', fontWeight: '400', letterSpacing: '0.25px' }],
      },
      fontWeight: {
        light: '400',      // 提升可读性：从 300 改为 400
        normal: '400',
        medium: '500',
        semibold: '600',
        thin: '300',       // 如需极细字体，使用 font-thin
      },
      spacing: {
        'page': '80px',
        'section': '48px',
      },
      boxShadow: {
        'card': '0 4px 16px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 6px 24px rgba(0, 0, 0, 0.12)',
        'button': '0 4px 16px rgba(44, 44, 44, 0.15)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.6s ease-out',
        slideIn: 'slideIn 0.3s ease-out',
      },
    },
  },
  plugins: [],
};

export default config;


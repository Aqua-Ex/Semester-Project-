/**
 * Co-Thread Design System Theme
 * Electric Play Color Palette & Design Tokens
 */

export const theme = {
  colors: {
    primary: {
      electricPurple: '#7A33FF',
      mintPop: '#4AF2C3',
      laserCoral: '#FF6464',
      sunbeamYellow: '#FFD93D',
    },
    neutrals: {
      deepGraphite: '#1A1A1E',
      softCharcoal: '#2A2A30',
      cloudGray: '#D9D9E0',
      pureWhite: '#FFFFFF',
    },
    gradients: {
      purpleMint: 'linear-gradient(135deg, #7A33FF, #4AF2C3)',
      coralYellow: 'linear-gradient(135deg, #FF6464, #FFD93D)',
    },
  },
  typography: {
    fonts: {
      header: ['Fredoka', 'Poppins', 'sans-serif'].join(', '),
      body: ['Inter', 'sans-serif'].join(', '),
      decorative: ['Sora', 'sans-serif'].join(', '),
    },
    weights: {
      extraBold: 800,
      bold: 700,
      medium: 500,
      regular: 400,
    },
  },
  spacing: {
    xs: '0.5rem',
    sm: '1rem',
    md: '1.5rem',
    lg: '2rem',
    xl: '3rem',
    '2xl': '4rem',
  },
  borderRadius: {
    card: '20px',
    cardLarge: '28px',
    button: '12px',
    avatar: '50%',
  },
  shadows: {
    glowPurple: '0 0 20px rgba(122, 51, 255, 0.25)',
    glowMint: '0 0 20px rgba(74, 242, 195, 0.25)',
    glowCoral: '0 0 20px rgba(255, 100, 100, 0.25)',
    card: '0 4px 20px rgba(0, 0, 0, 0.1)',
  },
  transitions: {
    default: 'all 0.3s ease',
    fast: 'all 0.15s ease',
    slow: 'all 0.5s ease',
  },
  zIndex: {
    dropdown: 1000,
    modal: 2000,
    tooltip: 3000,
  },
};

export default theme;


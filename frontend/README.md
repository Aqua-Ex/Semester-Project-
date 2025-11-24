# Co-Thread Frontend

Modern, interactive UI for Co-Thread - a collaborative storytelling game.

## 🎨 Design System

Built with the "Electric Play" color palette:
- **Electric Purple** (#7A33FF) - Main brand color
- **Mint Pop** (#4AF2C3) - Accent & CTA
- **Laser Coral** (#FF6464) - Warnings & highlights
- **Sunbeam Yellow** (#FFD93D) - Gamified elements

## 🚀 Getting Started

### Install Dependencies

```bash
npm install
```

### Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## 📁 Project Structure

```
src/
  components/      # Reusable UI components
  pages/          # Page components
  context/         # React Context providers
  hooks/          # Custom React hooks
  styles/         # Theme and animations
  utils/          # Utility functions
```

## 🧩 Key Features

- **Home Screen** - Game mode selection
- **Lobby** - Player matching and ready states
- **Multiplayer** - Real-time collaborative storytelling
- **Single Player** - 1v1 duel mode
- **Rapid Fire** - Fast-paced lightning rounds
- **Leaderboard** - Global and friend rankings
- **History** - Past stories and achievements

## 🛠️ Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **Framer Motion** - Animations
- **React Router** - Navigation
- **TipTap** - Rich text editor
- **Zustand** - State management
- **React Query** - Data fetching

## 🎯 Next Steps

1. Connect to backend API
2. Implement WebSocket for real-time updates
3. Add user authentication
4. Integrate Firebase for data persistence
5. Add sound effects and background music
6. Implement AI Drama Meter
7. Add end-of-round cinematic animations


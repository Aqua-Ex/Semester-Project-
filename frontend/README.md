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

### Firebase Authentication Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Google Authentication:
   - Go to Authentication > Sign-in method
   - Enable "Google" as a sign-in provider
3. Get your Firebase configuration:
   - Go to Project Settings > General
   - Scroll down to "Your apps" section
   - Click on the Web app icon (</>) or add a new web app
   - Copy the Firebase configuration values
4. Create a `.env` file in the `frontend` directory with your Firebase config:

```env
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-app-id
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

## 🔐 Authentication

The app uses Firebase Authentication with Google Sign-In. Users must be authenticated to:
- Access game modes (Multiplayer, Single Player, Rapid Fire)
- View their story history
- Access the lobby

Public routes:
- Home page
- Leaderboard
- Login page

## 🎯 Next Steps

1. Connect to backend API
2. Implement WebSocket for real-time updates
3. ✅ Add user authentication (Completed)
4. Integrate Firebase for data persistence
5. Add sound effects and background music
6. Implement AI Drama Meter
7. Add end-of-round cinematic animations


# Learnio Frontend

A minimal React frontend for the Learnio AI Agent backend, built with Vite, React, and TypeScript.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

## Project Structure

```
frontend/
├── src/
│   ├── api/
│   │   └── agent.ts          # API client for backend communication
│   ├── components/
│   │   ├── ChatBox.tsx       # Input textarea and send button
│   │   └── ResponseBox.tsx   # Displays agent responses
│   ├── pages/
│   │   └── LandingPage.tsx   # Main page component
│   ├── App.tsx                # Root component
│   ├── main.tsx               # Application entry point
│   ├── index.css              # Global styles
│   └── App.css                # App-specific styles
├── index.html                 # HTML template
├── package.json               # Dependencies
├── vite.config.ts             # Vite configuration
└── tsconfig.json              # TypeScript configuration
```

## Configuration

### Backend URL

By default, the frontend connects to `http://localhost:3000`. To change this, create a `.env` file:

```env
VITE_API_URL=http://localhost:3000
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Features

- ✅ Clean, minimal UI
- ✅ Real-time API communication
- ✅ Loading and error states
- ✅ TypeScript for type safety
- ✅ Hot module replacement (HMR)



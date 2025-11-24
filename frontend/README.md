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
│   │   ├── agent.ts          # API client for agent endpoints
│   │   └── documents.ts      # API client for document upload
│   ├── components/
│   │   ├── ChatBox.tsx       # Input textarea, upload button, and send button
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
- ✅ PDF file upload functionality
- ✅ Loading and error states
- ✅ TypeScript for type safety
- ✅ Hot module replacement (HMR)

## File Upload Feature

The frontend includes a PDF upload feature that allows users to upload documents to the backend.

### How to Use

1. **Upload a PDF file:**
   - Click the "Upload PDF" button next to the textarea
   - Select a PDF file from your computer
   - The file will be uploaded to the backend automatically
   - A success message will appear showing the uploaded filename and document ID

2. **File requirements:**
   - Only PDF files are accepted (`.pdf` extension)
   - The backend validates the file type on upload

3. **Upload status:**
   - While uploading, the button shows "Uploading..." and is disabled
   - On success, a green message appears with the document details
   - On error, an error message is displayed

4. **Current implementation:**
   - Uses a temporary user ID: `"test-user"` (hardcoded)
   - This will be replaced with proper authentication in the future
   - Uploaded documents are stored in the backend's `uploads/` directory

### Technical Details

- Upload endpoint: `POST http://localhost:3000/documents/upload`
- Uses `FormData` with `file` and `userId` fields
- Returns document metadata including ID, filename, and upload timestamp



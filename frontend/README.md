# Whisperly Frontend (React Native Expo)

This is the mobile frontend for the Whisperly transcription app, built with React Native and Expo.

## Features
- Record audio and send to backend for transcription
- View and copy transcriptions
- Mobile-first (Android, iOS-ready)

## Prerequisites
- [Node.js](https://nodejs.org/) (v16 or later recommended)
- [Expo CLI](https://docs.expo.dev/get-started/installation/):
  ```sh
  npm install -g expo-cli
  ```
- Android device or emulator (iOS support coming later)

## Setup & Installation

1. **Clone the repo and navigate to the frontend directory:**
   ```sh
   cd frontend
   ```

2. **Install dependencies:**
   ```sh
   npm install --legacy-peer-deps
   # or
   npx expo install
   ```

   > If you get dependency errors, try clearing the npm cache:
   > ```sh
   > npm cache clean --force
   > rm -rf node_modules package-lock.json
   > npm install --legacy-peer-deps
   > ```

3. **Set your backend URL:**
   - The app is currently configured to use your ngrok backend URL in `HomeScreen.tsx`:
     ```ts
     const response = await fetch('https://aj-development.athenaintelligence.ai/transcribe', { ... });
     ```
   - Change this to your own ngrok URL if needed.

## Running the App

1. **Start the Expo development server:**
   ```sh
   npm start
   # or
   npx expo start
   ```

2. **Run on your Android device:**
   - Install the Expo Go app from the Play Store.
   - Scan the QR code from your terminal/browser.
   - Or run on an emulator with:
     ```sh
     npm run android
     ```

## Project Structure
- `App.tsx` - App entry point and navigation
- `screens/HomeScreen.tsx` - Main screen for recording and transcription
- `components/TranscriptionBox.tsx` - Shows/copies transcription
- `components/RecordButton.tsx` - Record/stop button

## Troubleshooting
- If you see dependency errors, ensure your `package.json` matches Expo SDK 52 requirements (see above).
- Remove any `react-dom` dependency if not targeting web.
- Use `npm install --legacy-peer-deps` if you see peer dependency conflicts.
- If you change the backend URL, make sure your phone and computer are on the same network (for ngrok to work).

## Notes
- This app is currently optimized for Android. iOS support can be added later.
- For web support, you may need to add `react-dom@18.2.0` and resolve any web-specific issues. 
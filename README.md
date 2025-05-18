# IntelliWrite Companion

IntelliWrite Companion is a Chrome browser extension that provides comprehensive AI-powered writing assistance. It empowers users to paraphrase text, perfect grammar, generate contextual content, minimize plagiarism, create AI detection-resistant text, translate content, and adjust writing tone, all seamlessly integrated into websites where they write.

## Features

-   **Paraphrase**: Reshape sentences with alternative phrasings
-   **Perfect Grammar**: Correct grammar and spelling errors
-   **Generate Text**: Create context-aware content within websites
-   **Minimize Plagiarism**: Assist in creating original content through paraphrasing and generation
-   **AI Detection Resistant Output**: Humanize writing to reduce AI detection flags
-   **Translate**: Translate text with auto-detected source language and user-selectable target language
-   **Custom Writing Tones**: Options include Formal, Casual, Persuasive, Confident, Friendly, Empathetic, Academic

## Project Structure

The project is organized into two main components:

-   **Backend (`backend/`)**: Node.js Express server that acts as a proxy for the Gemini API
-   **Extension (`extension/`)**: Chrome browser extension with UI components and content scripts

## Prerequisites

-   Node.js (v18 or later)
-   npm
-   Google Chrome browser
-   Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey)

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:

    ```bash
    cd backend
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

3. Create a `.env` file based on `.env.example`:

    ```bash
    cp .env.example .env
    ```

4. Edit the `.env` file to configure your environment variables

5. Start the backend server:
    ```bash
    npm run dev
    ```

### Extension Setup

1. Generate extension icons:

    ```bash
    cd scripts
    npm install sharp
    node generate-pngs.js
    ```

2. Load the extension in Chrome:

    - Open Chrome and navigate to `chrome://extensions/`
    - Enable "Developer mode" (toggle in the top-right corner)
    - Click "Load unpacked" and select the `extension` directory

3. Configure the extension:
    - Click on the IntelliWrite Companion icon in the Chrome toolbar
    - Go to the Settings tab
    - Enter your Gemini API key
    - Verify the backend URL (default: `http://localhost:3000`)
    - Save settings

## Usage

### Context Menu

Select text on any webpage, then right-click and choose an IntelliWrite tool from the context menu:

-   **Paraphrase**: Rewrite the selected text with alternative phrasing
-   **Perfect Grammar**: Correct grammar and spelling errors in the selected text
-   **Translate**: Translate the selected text to your preferred language
-   **Make Human-like**: Make the selected text more human-like and less detectable as AI-generated
-   **Change Tone**: Change the tone of the selected text (Formal, Casual, Persuasive, etc.)

### Popup Interface

Click the IntelliWrite Companion icon in the Chrome toolbar to access the popup interface:

-   **Tools**: Quick access to all IntelliWrite tools
-   **Generate**: Generate text based on a prompt
-   **Settings**: Configure API key, backend URL, and preferences
-   **History**: View recent activity

## Development

### Backend Development

The backend is built with Node.js and Express, using the Google Gemini API for AI processing.

-   `src/app.js`: Main Express application
-   `src/routes/api.js`: API routes
-   `src/controllers/geminiController.js`: Request handlers
-   `src/services/geminiService.js`: Business logic for Gemini API interactions

### Extension Development

The extension is built with vanilla JavaScript, HTML, and CSS.

-   `manifest.json`: Extension configuration
-   `js/background.js`: Background script for context menu and API handling
-   `js/content.js`: Content script for webpage integration
-   `js/popup.js`: Popup UI script
-   `js/sidebar.js`: Sidebar UI script
-   `js/api.js`: API client for backend communication
-   `html/popup.html`: Popup UI
-   `html/sidebar.html`: Sidebar UI
-   `css/`: Stylesheets

## License

MIT

## Author

Chirag Singhal (GitHub: [chirag127](https://github.com/chirag127))

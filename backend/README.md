# IntelliWrite Companion Backend

This is the backend proxy server for the IntelliWrite Companion Chrome extension. It provides a secure way to interact with the Google Gemini API without exposing API keys in the client-side code.

## Features

- Proxy for Google Gemini API requests
- Support for streaming responses
- API key validation
- Rate limiting
- CORS protection
- Error handling

## API Endpoints

The backend provides the following endpoints:

- `POST /api/paraphrase` - Paraphrase text
- `POST /api/grammar` - Correct grammar in text
- `POST /api/generate` - Generate text based on a prompt
- `POST /api/generate/stream` - Stream generated text
- `POST /api/translate` - Translate text
- `POST /api/translate/stream` - Stream translated text
- `POST /api/humanize` - Make text more human-like (AI detection resistant)
- `POST /api/tone` - Change the tone of text

## Setup

### Prerequisites

- Node.js (v18 or later)
- npm

### Installation

1. Clone the repository
2. Navigate to the backend directory
3. Install dependencies:

```bash
npm install
```

4. Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

5. Edit the `.env` file to configure your environment variables

### Running the Server

For development:

```bash
npm run dev
```

For production:

```bash
npm start
```

## Security

- The backend does not store any API keys or user data
- API keys are provided by the extension with each request
- All communication is secured with CORS protection
- Rate limiting is applied to prevent abuse

## Error Handling

The backend provides detailed error messages for debugging while maintaining security. Common error scenarios include:

- Missing API key
- Invalid API key
- Rate limiting
- Invalid request parameters
- Gemini API errors

## Development

To extend or modify the backend:

1. Add new endpoints in `src/routes/api.js`
2. Implement controller functions in `src/controllers/geminiController.js`
3. Add business logic in `src/services/geminiService.js`

## License

MIT

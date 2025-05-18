const express = require('express');
const router = express.Router();

// Import controllers
const geminiController = require('../controllers/geminiController');

// Middleware to validate API key
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers.authorization;
  
  if (!apiKey) {
    return res.status(401).json({ 
      error: { 
        message: 'API key is required', 
        status: 401 
      } 
    });
  }
  
  // Store the API key in the request object for controllers to use
  req.geminiApiKey = apiKey.replace('Bearer ', '');
  next();
};

// Apply API key validation middleware to all routes
router.use(validateApiKey);

// Paraphrase endpoint
router.post('/paraphrase', geminiController.paraphraseText);

// Grammar correction endpoint
router.post('/grammar', geminiController.correctGrammar);

// Text generation endpoint
router.post('/generate', geminiController.generateText);

// Streaming text generation endpoint
router.post('/generate/stream', geminiController.streamGenerateText);

// Translation endpoint
router.post('/translate', geminiController.translateText);

// Streaming translation endpoint
router.post('/translate/stream', geminiController.streamTranslateText);

// AI detection resistance endpoint
router.post('/humanize', geminiController.humanizeText);

// Change tone endpoint
router.post('/tone', geminiController.changeTone);

module.exports = router;

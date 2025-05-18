const { GoogleGenAI } = require('@google/genai');
const geminiService = require('../services/geminiService');

/**
 * Paraphrase text using Gemini API
 */
const paraphraseText = async (req, res, next) => {
  try {
    const { text, tone = 'Casual', creativity = 'balanced' } = req.body;
    
    if (!text) {
      return res.status(400).json({ 
        error: { 
          message: 'Text is required', 
          status: 400 
        } 
      });
    }

    const result = await geminiService.paraphraseText(req.geminiApiKey, text, tone, creativity);
    res.json({ result });
  } catch (error) {
    next(error);
  }
};

/**
 * Correct grammar using Gemini API
 */
const correctGrammar = async (req, res, next) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ 
        error: { 
          message: 'Text is required', 
          status: 400 
        } 
      });
    }

    const result = await geminiService.correctGrammar(req.geminiApiKey, text);
    res.json({ result });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate text using Gemini API
 */
const generateText = async (req, res, next) => {
  try {
    const { prompt, tone = 'Casual', length = 'medium', context = '' } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ 
        error: { 
          message: 'Prompt is required', 
          status: 400 
        } 
      });
    }

    const result = await geminiService.generateText(req.geminiApiKey, prompt, tone, length, context);
    res.json({ result });
  } catch (error) {
    next(error);
  }
};

/**
 * Stream generated text using Gemini API
 */
const streamGenerateText = async (req, res, next) => {
  try {
    const { prompt, tone = 'Casual', length = 'medium', context = '' } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ 
        error: { 
          message: 'Prompt is required', 
          status: 400 
        } 
      });
    }

    // Set headers for streaming response
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Stream the response
    await geminiService.streamGenerateText(
      req.geminiApiKey, 
      prompt, 
      tone, 
      length, 
      context,
      (chunk) => {
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      }
    );

    // End the response
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    // If headers have already been sent, we can't use the normal error handler
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    } else {
      next(error);
    }
  }
};

/**
 * Translate text using Gemini API
 */
const translateText = async (req, res, next) => {
  try {
    const { text, targetLanguage = 'English', sourceLanguage = 'auto' } = req.body;
    
    if (!text) {
      return res.status(400).json({ 
        error: { 
          message: 'Text is required', 
          status: 400 
        } 
      });
    }

    const result = await geminiService.translateText(req.geminiApiKey, text, targetLanguage, sourceLanguage);
    res.json({ result });
  } catch (error) {
    next(error);
  }
};

/**
 * Stream translated text using Gemini API
 */
const streamTranslateText = async (req, res, next) => {
  try {
    const { text, targetLanguage = 'English', sourceLanguage = 'auto' } = req.body;
    
    if (!text) {
      return res.status(400).json({ 
        error: { 
          message: 'Text is required', 
          status: 400 
        } 
      });
    }

    // Set headers for streaming response
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Stream the response
    await geminiService.streamTranslateText(
      req.geminiApiKey, 
      text, 
      targetLanguage, 
      sourceLanguage,
      (chunk) => {
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      }
    );

    // End the response
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    // If headers have already been sent, we can't use the normal error handler
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    } else {
      next(error);
    }
  }
};

/**
 * Make text more human-like (AI detection resistant)
 */
const humanizeText = async (req, res, next) => {
  try {
    const { text, tone = 'Casual' } = req.body;
    
    if (!text) {
      return res.status(400).json({ 
        error: { 
          message: 'Text is required', 
          status: 400 
        } 
      });
    }

    const result = await geminiService.humanizeText(req.geminiApiKey, text, tone);
    res.json({ result });
  } catch (error) {
    next(error);
  }
};

/**
 * Change the tone of text
 */
const changeTone = async (req, res, next) => {
  try {
    const { text, tone = 'Casual' } = req.body;
    
    if (!text || !tone) {
      return res.status(400).json({ 
        error: { 
          message: 'Text and tone are required', 
          status: 400 
        } 
      });
    }

    const result = await geminiService.changeTone(req.geminiApiKey, text, tone);
    res.json({ result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  paraphraseText,
  correctGrammar,
  generateText,
  streamGenerateText,
  translateText,
  streamTranslateText,
  humanizeText,
  changeTone
};

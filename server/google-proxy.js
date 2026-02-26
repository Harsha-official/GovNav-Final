const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const { systemPrompt } = require('./system-prompt');

const app = express();
app.use(cors());
app.use(express.json());

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

app.post('/api/chat', async (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ error: 'Invalid message provided.' });
  }

  if (!GOOGLE_API_KEY) {
    return res.status(500).json({ error: 'API key not configured.' });
  }

  try {
    const googleRes = await fetch(`${GOOGLE_API_URL}?key=${GOOGLE_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: systemPrompt.replace('{message}', message)
          }]
        }]
      })
    });

    const data = await googleRes.json();

    if (!googleRes.ok) {
      console.error('Google API error:', data);
      return res.status(googleRes.status).json({ error: 'Failed to fetch response from Google API.', details: data });
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from the model.';
    res.json({ reply });

  } catch (e) {
    console.error('Proxy error:', e);
    res.status(500).json({ error: 'An unexpected error occurred.' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log('Proxy running on port ' + PORT));

module.exports = app;

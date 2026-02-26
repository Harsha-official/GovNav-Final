const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  if (!GOOGLE_API_KEY) return res.status(500).json({ error: 'API key missing' });

  // Construct a more detailed prompt for the AI
  const systemPrompt = `You are GovBot, an expert assistant for navigating Indian government services. Your goal is to provide clear, step-by-step guidance.
  When a user asks a question:
  1.  Break down the process into a simple, numbered list of steps.
  2.  For each step that involves clicking a button or link, use the format: 'highlight and click on the button "button text"' where "button text" is the exact text on the button/link.
  3.  If the query is about a process, suggest a relevant YouTube search query for a visual guide.
  4.  Keep the language simple and clear.

  User's question: "${message}"`;

  try {
    const googleRes = await fetch(`${GOOGLE_API_URL}?key=${GOOGLE_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: systemPrompt
          }]
        }]
      })
    });
    const data = await googleRes.json();
    if (!googleRes.ok) {
      console.error('Google API error:', data);
      return res.status(500).json({ error: data });
    }
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text.replace(/\n/g, '<br/>').replace(/\*/g, '') || 'No response.';
    res.json({ reply });
  } catch (e) {
    console.error('Proxy error:', e);
    res.status(500).json({ error: 'Google API request failed' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log('Proxy running on port ' + PORT));

module.exports = app;

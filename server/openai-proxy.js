const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  if (!OPENAI_API_KEY) return res.status(500).json({ error: 'API key missing' });
  try {
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: message }]
      })
    });
    const data = await openaiRes.json();
    if (!openaiRes.ok) {
      console.error('OpenAI error:', data);
      return res.status(500).json({ error: data });
    }
    res.json({ reply: data.choices?.[0]?.message?.content || 'No response.' });
  } catch (e) {
    console.error('Proxy error:', e);
    res.status(500).json({ error: 'OpenAI request failed' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Proxy running on port ${PORT}`));
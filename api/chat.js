const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    let body = req.body;
    
    // Parse body if it's a string
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (err) {
        return res.status(400).json({ error: 'Invalid JSON body' });
      }
    }

    const { messages } = body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid messages format' });
    }

    const OLLAMA_URL = process.env.OLLAMA_URL;
    if (!OLLAMA_URL) {
      console.error('OLLAMA_URL is not configured');
      return res.status(500).json({ 
        reply: '*Luna parece distraída no momento...*\nTenta de novo daqui a pouco?' 
      });
    }

    const payload = {
      model: 'dolphin-llama3:8b',
      messages: messages,
      stream: false
    };

    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.error('Ollama API error:', response.status, await response.text());
      return res.status(200).json({ 
        reply: '*Luna parece distraída no momento...*\nTenta de novo daqui a pouco?' 
      });
    }

    const data = await response.json();
    const replyContent = data.message?.content || '*Luna não conseguiu formular uma resposta...*';

    return res.status(200).json({ reply: replyContent });

  } catch (error) {
    console.error('Internal Server Error:', error);
    return res.status(200).json({
      reply: '*Luna parece distraída no momento...*\nTenta de novo daqui a pouco?'
    });
  }
};

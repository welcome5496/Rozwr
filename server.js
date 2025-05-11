const express = require('express');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.get('/api/reel', async (req, res) => {
  const reelUrl = req.query.url;
  if (!reelUrl) {
    return res.status(400).json({ error: "Missing 'url' query parameter" });
  }
  if (!/^https?:\/\/(www\.)?instagram\.com\/reel\/[a-zA-Z0-9_-]+\/?(\?.*)?$/.test(reelUrl)) {
    return res.status(400).json({ error: "Invalid Instagram Reel URL" });
  }
  try {
    const response = await fetch(reelUrl, {
      headers: {
        // Spoof a user-agent for Instagram to return page normally
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
                      '(KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });

    if (!response.ok) {
      return res.status(502).json({ error: "Failed to fetch Instagram reel page" });
    }
    const html = await response.text();

    // Load HTML into cheerio
    const $ = cheerio.load(html);
    let videoUrl = $('meta[property="og:video"]').attr('content');
    if (!videoUrl) {
      // try alternate meta tag
      videoUrl = $('meta[name="twitter:player:stream"]').attr('content');
    }
    if (!videoUrl) {
      return res.status(404).json({ error: "Could not find video URL in the Instagram reel" });
    }

    return res.json({ videoUrl });
  } catch (err) {
    console.error("Error fetching or parsing Instagram reel:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Instagram Reel Downloader backend listening at http://localhost:${PORT}`);
});


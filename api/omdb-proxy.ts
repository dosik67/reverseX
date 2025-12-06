import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { imdbId } = req.body;

  if (!imdbId) {
    return res.status(400).json({ error: 'imdbId is required' });
  }

  try {
    const response = await fetch(
      `https://www.omdbapi.com/?i=${imdbId}&apikey=${process.env.OMDB_API_KEY}`
    );

    if (!response.ok) {
      return res.status(response.status).json({ error: 'OMDb API error' });
    }

    const data = await response.json();

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');

    return res.status(200).json(data);
  } catch (error) {
    console.error('OMDb proxy error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

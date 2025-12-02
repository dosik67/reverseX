// Cache for translated descriptions
const translationCache = new Map<number, string>();

export const getGameDescriptionFromSteam = async (gameId: number): Promise<string | null> => {
  // Check cache first
  if (translationCache.has(gameId)) {
    console.log(`[Translation] Using cached description for game ${gameId}`);
    return translationCache.get(gameId) || null;
  }

  try {
    const apiKey = "8A9FA5718D266AD5379FB7F726B1B3F5";
    
    console.log(`[Translation] Fetching RAWG data for game ${gameId}`);
    // First, try to get the Steam app ID from RAWG
    const rawgResponse = await fetch(
      `https://api.rawg.io/api/games/${gameId}?key=c33c648c0d8f45c494af8da025d7b862`
    );
    const rawgData = await rawgResponse.json();
    
    // Look for Steam store link in RAWG stores data
    let steamAppId = null;
    if (rawgData.stores) {
      for (const store of rawgData.stores) {
        if (store.store.id === 1 && store.url) { // Steam is store id 1
          const match = store.url.match(/\/app\/(\d+)/);
          if (match) {
            steamAppId = match[1];
            console.log(`[Translation] Found Steam app ID: ${steamAppId}`);
            break;
          }
        }
      }
    }

    if (!steamAppId) {
      console.log(`[Translation] No Steam app ID found for game ${gameId}`);
      return null;
    }

    // Fetch Russian description from Steam API
    console.log(`[Translation] Fetching Steam description for app ${steamAppId}`);
    const steamResponse = await fetch(
      `https://steamcommunity.com/api/appdetails?appids=${steamAppId}&l=russian`
    );
    const steamData = await steamResponse.json();

    if (steamData[steamAppId] && steamData[steamAppId].data) {
      const gameData = steamData[steamAppId].data;
      const russianDesc = 
        gameData.detailed_description || 
        gameData.about_the_game || 
        gameData.short_description;

      if (russianDesc) {
        // Cache the result
        translationCache.set(gameId, russianDesc);
        console.log(`[Translation] Successfully fetched Russian description for game ${gameId}`);
        return russianDesc;
      }
    }

    console.log(`[Translation] No description data found on Steam for app ${steamAppId}`);
    return null;
  } catch (error) {
    console.error('[Translation] Error fetching Steam description:', error);
    return null;
  }
};

export const clearTranslationCache = () => {
  translationCache.clear();
};

const STEAM_API_KEY = '8A9FA5718D266AD5379FB7F726B1B3F5';
const STEAM_CACHE = new Map<number, string>();

interface SteamAppDetails {
  type: string;
  name: string;
  steam_appid: number;
  short_description: string;
  detailed_description: string;
  about_the_game: string;
  [key: string]: any;
}

// Try to find Steam app ID by game name using RAWG data
export const getGameSteamDescription = async (gameId: number, gameName: string): Promise<string | null> => {
  // Check cache first
  if (STEAM_CACHE.has(gameId)) {
    return STEAM_CACHE.get(gameId) || null;
  }

  try {
    // RAWG provides Steam app IDs in their API
    const rawgResponse = await fetch(
      `https://api.rawg.io/api/games/${gameId}?key=c33c648c0d8f45c494af8da025d7b862`
    );
    const rawgData = await rawgResponse.json();

    // Try to get Steam ID from RAWG data
    let steamAppId: number | null = null;

    // Check if RAWG provides a direct Steam ID
    if (rawgData.stores) {
      const steamStore = rawgData.stores.find((s: any) => s.store.name === 'Steam');
      if (steamStore) {
        // The URL usually contains the Steam ID
        const match = steamStore.url_en?.match(/\/app\/(\d+)/);
        if (match) {
          steamAppId = parseInt(match[1]);
        }
      }
    }

    // If we found a Steam ID, fetch the description
    if (steamAppId) {
      const steamResponse = await fetch(
        `https://steamcommunity.com/api/appdetails?appids=${steamAppId}&l=russian&json=1`
      );
      const steamData = await steamResponse.json();

      if (steamData[steamAppId]?.success) {
        const appDetails: SteamAppDetails = steamData[steamAppId].data;
        const description = appDetails.detailed_description || 
                          appDetails.about_the_game || 
                          appDetails.short_description || 
                          '';

        // Cache the result
        if (description) {
          STEAM_CACHE.set(gameId, description);
          return description;
        }
      }
    }

    return null;
  } catch (error) {
    console.error(`Error fetching Steam description for game ${gameId}:`, error);
    return null;
  }
};

export const getGameDescription = async (gameId: number, gameName: string, rawgDescription: string): Promise<string> => {
  // Try to get Steam description first (in Russian)
  const steamDesc = await getGameSteamDescription(gameId, gameName);
  if (steamDesc) {
    return steamDesc;
  }

  // Fallback to RAWG description (will be translated if not Russian)
  return rawgDescription;
};

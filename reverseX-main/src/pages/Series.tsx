import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import SeriesCard from "@/components/SeriesCard";
import { getPopularSeries, searchSeries, getMoviePosterUrl } from "@/utils/tmdbApi";
import { useScrollRestore } from "@/hooks/useScrollRestore";
import { useTranslation } from "react-i18next";

interface Series {
  id: number;
  title: string;
  year: string;
  rating: number;
  poster: string;
  description: string;
}

const SERIES_PER_PAGE = 20;

const SeriesPage = () => {
  const { t } = useTranslation();
  const [allSeries, setAllSeries] = useState<Series[]>([]);
  const [displaySeries, setDisplaySeries] = useState<Series[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchResultsTotal, setSearchResultsTotal] = useState(0);

  // Restore scroll after content loads (50ms delay for DOM to render)
  useScrollRestore(!loading && !isSearching ? 0 : 50);

  useEffect(() => {
    fetchSeries();
  }, []);

  useEffect(() => {
    const handleSearch = async () => {
      if (searchQuery.trim()) {
        setIsSearching(true);
        try {
          const results = await searchSeries(searchQuery);
          const transformed = results.results.map((series: any) => ({
            id: series.id,
            title: series.name || series.original_name,
            year: series.first_air_date ? new Date(series.first_air_date).getFullYear().toString() : '',
            rating: series.vote_average,
            poster: getMoviePosterUrl(series.poster_path, 'w342'),
            description: series.overview
          }));
          setAllSeries(transformed);
          setDisplaySeries(transformed.slice(0, SERIES_PER_PAGE));
          setSearchResultsTotal(results.total_results);
          setHasMore(transformed.length > SERIES_PER_PAGE);
          setPage(1);
        } catch (error) {
          console.error('Error searching series:', error);
          setAllSeries([]);
          setDisplaySeries([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setAllSeries([]);
        setDisplaySeries([]);
        setPage(1);
        setHasMore(false);
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(handleSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const fetchSeries = async () => {
    try {
      setLoading(true);
      const results = await getPopularSeries(1);
      const transformed = results.results.map((series: any) => ({
        id: series.id,
        title: series.name || series.original_name,
        year: series.first_air_date ? new Date(series.first_air_date).getFullYear().toString() : '',
        rating: series.vote_average,
        poster: getMoviePosterUrl(series.poster_path, 'w342'),
        description: series.overview
      }));
      setAllSeries(transformed);
      setDisplaySeries(transformed.slice(0, SERIES_PER_PAGE));
      setHasMore(transformed.length > SERIES_PER_PAGE);
    } catch (error) {
      console.error('Error fetching series:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (isSearching) return;
    
    const nextPage = page + 1;
    const start = page * SERIES_PER_PAGE;
    const end = start + SERIES_PER_PAGE;

    if (searchQuery.trim()) {
      // For search results, fetch next page from TMDB
      try {
        const results = await searchSeries(searchQuery, nextPage);
        const transformed = results.results.map((series: any) => ({
          id: series.id,
          title: series.name || series.original_name,
          year: series.first_air_date ? new Date(series.first_air_date).getFullYear().toString() : '',
          rating: series.vote_average,
          poster: getMoviePosterUrl(series.poster_path, 'w342'),
          description: series.overview
        }));
        
        setDisplaySeries((prev) => [...prev, ...transformed]);
        setPage(nextPage);
        setHasMore(end < results.total_results);
      } catch (error) {
        console.error('Error loading more series:', error);
      }
    } else {
      // For popular series, use local pagination
      const source = allSeries;
      setDisplaySeries((prev) => [...prev, ...source.slice(start, end)]);
      setPage(nextPage);
      setHasMore(end < source.length);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4 gradient-text">
          {t('Исследуйте сериалы') || 'Explore Series'}
        </h1>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input
            type="text"
            placeholder={t('series.searchPlaceholder') || 'Search series...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="aspect-[2/3] bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {displaySeries.map((series) => (
              <SeriesCard key={series.id} series={series} />
            ))}
          </div>
          {hasMore && (
            <div className="flex justify-center mt-8">
              <Button onClick={loadMore}>
                {t('series.loadMore') || 'Load More'}
              </Button>
            </div>
          )}
        </>
      )}

      {!loading && displaySeries.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {t('series.noResults') || 'No series found'}
          </p>
        </div>
      )}
    </div>
  );
};

export default SeriesPage;
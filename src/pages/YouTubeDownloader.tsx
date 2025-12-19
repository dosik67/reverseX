import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Download, ArrowLeft, Loader2, AlertCircle, CheckCircle, Play, Clock, User } from "lucide-react";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";

interface VideoInfo {
  title: string;
  duration: number;
  thumbnail: string;
  uploader: string;
  uploadDate: string;
  description: string;
}

interface DownloadProgress {
  status: "idle" | "fetching" | "downloading" | "completed" | "error";
  message: string;
  progress: number;
  downloadUrl?: string;
  fileName?: string;
  fileSize?: string;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

const YouTubeDownloader = () => {
  const [url, setUrl] = useState("");
  const [quality, setQuality] = useState("best");
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress>({
    status: "idle",
    message: "",
    progress: 0,
  });

  const qualityOptions = [
    { value: "best", label: "Best Available", icon: "⭐" },
    { value: "4k", label: "4K (2160p)", icon: "🎬" },
    { value: "1440p", label: "2K (1440p)", icon: "📹" },
    { value: "1080p", label: "Full HD (1080p)", icon: "🎥" },
    { value: "720p", label: "HD (720p)", icon: "📺" },
    { value: "480p", label: "SD (480p)", icon: "📱" },
  ];

  const handleFetchVideoInfo = async () => {
    if (!url.trim()) {
      toast.error("Please enter a YouTube URL");
      return;
    }

    setLoading(true);
    setDownloadProgress({ status: "fetching", message: "Fetching video information...", progress: 30 });

    try {
      const response = await axios.post(`${API_BASE_URL}/api/video-info`, { url });
      setVideoInfo(response.data);
      setDownloadProgress({ status: "idle", message: "", progress: 0 });
      toast.success("Video information loaded!");
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || "Failed to fetch video information";
      setDownloadProgress({
        status: "error",
        message: errorMessage,
        progress: 0,
      });
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!url.trim()) {
      toast.error("Please enter a YouTube URL");
      return;
    }

    setDownloadProgress({ status: "downloading", message: "Starting download...", progress: 10 });

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/download`,
        { url, quality },
        { timeout: 600000 }
      );

      const { filePath, fileName, fileSize } = response.data;

      setDownloadProgress({
        status: "completed",
        message: "Download completed successfully!",
        progress: 100,
        downloadUrl: `${API_BASE_URL}${filePath}`,
        fileName,
        fileSize,
      });

      toast.success(`Downloaded: ${fileName}`);

      // Auto-start download
      const link = document.createElement("a");
      link.href = `${API_BASE_URL}${filePath}`;
      link.download = fileName || "video.mp4";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || "Download failed. Please try again.";
      setDownloadProgress({
        status: "error",
        message: errorMessage,
        progress: 0,
      });
      toast.error(errorMessage);
    }
  };

  const handleNewDownload = () => {
    setUrl("");
    setVideoInfo(null);
    setDownloadProgress({ status: "idle", message: "", progress: 0 });
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "Unknown date";
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <Button variant="ghost" asChild className="gap-2 text-sm">
            <Link to="/">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </Button>
          <div className="text-right">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 via-red-500 to-pink-500 bg-clip-text text-transparent">
              YouTube Downloader
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Download videos in 4K or best available quality</p>
          </div>
        </div>

        {downloadProgress.status === "completed" ? (
          // Completed State
          <Card className="p-8 text-center border-green-500/30 bg-gradient-to-br from-green-950/20 to-slate-900">
            <div className="mb-6">
              <CheckCircle className="w-24 h-24 mx-auto text-green-500 animate-pulse" />
            </div>

            <h2 className="text-3xl font-bold text-green-400 mb-2">Download Completed!</h2>

            <div className="bg-slate-800/50 rounded-lg p-6 mb-8 border border-green-500/20">
              <p className="text-muted-foreground mb-2">File Name</p>
              <p className="text-lg font-mono font-semibold text-green-300 mb-4 break-all">
                {downloadProgress.fileName}
              </p>

              <p className="text-muted-foreground mb-2">File Size</p>
              <p className="text-base font-semibold text-green-300 mb-6">{downloadProgress.fileSize}</p>

              <p className="text-sm text-green-300/70">{downloadProgress.message}</p>
            </div>

            <div className="flex gap-4">
              <Button asChild size="lg" className="flex-1 gap-2">
                <a href={downloadProgress.downloadUrl} download={downloadProgress.fileName}>
                  <Download className="w-5 h-5" />
                  Download Again
                </a>
              </Button>
              <Button onClick={handleNewDownload} size="lg" variant="outline" className="flex-1">
                Download Another Video
              </Button>
            </div>
          </Card>
        ) : (
          // Main Content
          <>
            {/* URL Input Section */}
            <Card className="p-8 mb-8 border-orange-500/20 bg-gradient-to-br from-orange-950/10 to-slate-900 card-glow">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-3 text-foreground">
                    YouTube URL
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleFetchVideoInfo()}
                      disabled={loading}
                      className="flex-1 bg-slate-800/50 border-orange-500/30 focus:border-orange-500"
                    />
                    <Button
                      onClick={handleFetchVideoInfo}
                      disabled={loading || !url.trim()}
                      size="lg"
                      className="gap-2 bg-orange-600 hover:bg-orange-700"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          Load Video
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Progress Message */}
                {downloadProgress.status === "fetching" && (
                  <div className="flex items-center gap-2 text-orange-400 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {downloadProgress.message}
                  </div>
                )}

                {downloadProgress.status === "error" && (
                  <div className="flex items-start gap-2 text-red-400 bg-red-950/20 p-4 rounded-lg border border-red-500/20">
                    <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{downloadProgress.message}</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Video Info Section */}
            {videoInfo && (
              <Card className="p-8 mb-8 border-blue-500/20 bg-gradient-to-br from-blue-950/10 to-slate-900">
                <div className="grid md:grid-cols-3 gap-8">
                  {/* Thumbnail */}
                  <div className="md:col-span-1">
                    <div className="rounded-lg overflow-hidden border-2 border-blue-500/30 shadow-2xl">
                      <img
                        src={videoInfo.thumbnail}
                        alt={videoInfo.title}
                        className="w-full h-auto object-cover"
                      />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="md:col-span-2 space-y-4">
                    <div>
                      <h2 className="text-2xl font-bold text-blue-300 line-clamp-2 mb-3">
                        {videoInfo.title}
                      </h2>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="w-4 h-4 text-blue-400" />
                        <span>
                          <strong className="text-foreground">Channel:</strong> {videoInfo.uploader}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4 text-blue-400" />
                        <span>
                          <strong className="text-foreground">Duration:</strong> {formatDuration(videoInfo.duration)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-muted-foreground">
                        <CheckCircle className="w-4 h-4 text-blue-400" />
                        <span>
                          <strong className="text-foreground">Published:</strong> {formatDate(videoInfo.uploadDate)}
                        </span>
                      </div>
                    </div>

                    {/* Quality Selection */}
                    <div className="pt-4">
                      <label className="block text-sm font-semibold mb-3">
                        Select Video Quality
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {qualityOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => setQuality(option.value)}
                            className={`py-2 px-3 rounded-lg text-sm font-semibold transition-all border-2 ${
                              quality === option.value
                                ? "border-orange-500 bg-orange-500/20 text-orange-300"
                                : "border-slate-600 bg-slate-700/30 text-muted-foreground hover:border-orange-500/50 hover:text-foreground"
                            }`}
                          >
                            <span className="mr-1">{option.icon}</span>
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Download Button */}
                    <div className="pt-6">
                      <Button
                        onClick={handleDownload}
                        disabled={downloadProgress.status === "downloading"}
                        size="lg"
                        className="w-full gap-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 h-12 text-base font-bold"
                      >
                        {downloadProgress.status === "downloading" ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Downloading... {downloadProgress.progress}%
                          </>
                        ) : (
                          <>
                            <Download className="w-5 h-5" />
                            Download Video
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {videoInfo.description && (
                  <div className="mt-8 pt-8 border-t border-blue-500/20">
                    <h3 className="font-semibold text-blue-300 mb-3">Description</h3>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {videoInfo.description}
                    </p>
                  </div>
                )}
              </Card>
            )}

            {/* Empty State */}
            {!videoInfo && downloadProgress.status === "idle" && (
              <Card className="p-12 text-center border-slate-700/50 bg-slate-800/30">
                <Play className="w-20 h-20 mx-auto mb-6 text-orange-500/50" />
                <h2 className="text-2xl font-bold text-muted-foreground mb-3">
                  Paste a YouTube Link
                </h2>
                <p className="text-muted-foreground mb-6">
                  Enter a YouTube video URL above and click "Load Video" to get started. Then select your preferred quality and download!
                </p>
                <div className="grid md:grid-cols-3 gap-4 text-left">
                  <div className="bg-slate-700/30 p-4 rounded-lg border border-slate-600">
                    <div className="text-orange-400 font-bold mb-2">⚡ Fast</div>
                    <p className="text-sm text-muted-foreground">Download videos quickly with optimal streaming speeds</p>
                  </div>
                  <div className="bg-slate-700/30 p-4 rounded-lg border border-slate-600">
                    <div className="text-orange-400 font-bold mb-2">🎬 High Quality</div>
                    <p className="text-sm text-muted-foreground">Get videos in 4K or the best available quality</p>
                  </div>
                  <div className="bg-slate-700/30 p-4 rounded-lg border border-slate-600">
                    <div className="text-orange-400 font-bold mb-2">🎨 Easy to Use</div>
                    <p className="text-sm text-muted-foreground">Simple, clean interface for quick downloads</p>
                  </div>
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default YouTubeDownloader;

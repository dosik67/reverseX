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

// Русские переводы
const RU = {
  title: "Загрузчик YouTube видео",
  subtitle: "Скачивайте видео в 4K качестве быстро и безопасно",
  back: "На главную",
  urlLabel: "Ссылка на видео YouTube",
  urlPlaceholder: "https://www.youtube.com/watch?v=...",
  loadVideo: "Загрузить видео",
  loading: "Загрузка...",
  selectQuality: "Выберите качество видео",
  bestAvailable: "Лучшее качество",
  download: "Скачать видео",
  downloading: "Скачивается...",
  completed: "Загрузка завершена!",
  fileName: "Название файла",
  fileSize: "Размер файла",
  channel: "Канал",
  duration: "Длительность",
  published: "Опубликовано",
  description: "Описание",
  downloadAgain: "Скачать ещё",
  downloadAnother: "Скачать другое видео",
  pasteLink: "Вставьте ссылку на видео YouTube",
  enterUrl: "Введите ссылку на видео YouTube выше и нажмите кнопку загрузки",
  fast: "⚡ Быстро",
  fastDesc: "Скачивайте видео с оптимальной скоростью",
  highQuality: "🎬 Высокое качество",
  highQualityDesc: "Видео в 4K и лучшем доступном качестве",
  easyToUse: "🎨 Просто в использовании",
  easyToUseDesc: "Простой и красивый интерфейс для быстрой загрузки",
  errorLoadingVideo: "Ошибка при загрузке информации о видео",
  errorDownloading: "Ошибка при загрузке видео",
  emptyUrl: "Пожалуйста, введите ссылку на YouTube",
};

const YouTubeDownloader = () => {
  const [url, setUrl] = useState("");
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [selectedQuality, setSelectedQuality] = useState("best");
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress>({
    status: "idle",
    message: "",
    progress: 0,
  });

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const qualityOptions = [
    { value: "best", label: "🎬 Лучшее качество", description: "Лучший доступный формат" },
    { value: "4k", label: "4K", description: "3840x2160 (4K)" },
    { value: "1440p", label: "2K", description: "2560x1440" },
    { value: "1080p", label: "1080p", description: "Высокое качество" },
    { value: "720p", label: "720p", description: "Стандартное качество" },
    { value: "480p", label: "480p", description: "Мобильное качество" },
  ];

  const handleLoadVideo = async () => {
    if (!url.trim()) {
      toast.error(RU.emptyUrl);
      return;
    }

    setDownloadProgress({ status: "fetching", message: "Загружаю информацию о видео...", progress: 0 });

    try {
      const response = await axios.post(`${API_BASE_URL}/api/video-info`, { url: url.trim() });
      setVideoInfo(response.data);
      setDownloadProgress({ status: "idle", message: "", progress: 0 });
      toast.success("Видео загружено!");
    } catch (error) {
      console.error("Error loading video:", error);
      toast.error(RU.errorLoadingVideo);
      setDownloadProgress({
        status: "error",
        message: `${RU.errorLoadingVideo}: ${error instanceof Error ? error.message : "Unknown error"}`,
        progress: 0,
      });
    }
  };

  const handleDownload = async () => {
    if (!videoInfo) return;

    setDownloadProgress({ status: "downloading", message: "Начинаю загрузку...", progress: 5 });

    try {
      // Создаём blob для получения файла
      const response = await axios.post(
        `${API_BASE_URL}/api/download`,
        { url: url.trim(), quality: selectedQuality },
        {
          responseType: "blob",
          onDownloadProgress: (progressEvent) => {
            const total = progressEvent.total || 0;
            const current = progressEvent.loaded || 0;
            const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
            setDownloadProgress({
              status: "downloading",
              message: `Загружаю видео... ${percentage}%`,
              progress: percentage,
            });
          },
        }
      );

      // Извлекаем имя файла из headers
      const contentDisposition = response.headers["content-disposition"];
      let fileName = "video.mp4";
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (fileNameMatch && fileNameMatch[1]) {
          fileName = fileNameMatch[1];
        }
      }

      // Создаём ссылку для загрузки
      const downloadUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      setDownloadProgress({
        status: "completed",
        message: `Видео "${videoInfo.title}" загружено!`,
        progress: 100,
        fileName: fileName,
      });

      toast.success("Видео успешно загружено!");
    } catch (error) {
      console.error("Error downloading:", error);
      toast.error(RU.errorDownloading);
      setDownloadProgress({
        status: "error",
        message: `${RU.errorDownloading}: ${error instanceof Error ? error.message : "Unknown error"}`,
        progress: 0,
      });
    }
  };

  const handleReset = () => {
    setUrl("");
    setVideoInfo(null);
    setSelectedQuality("best");
    setDownloadProgress({ status: "idle", message: "", progress: 0 });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Фон с градиентом */}
      <div className="fixed inset-0 opacity-30 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
      </div>

      <div className="relative z-10">
        {/* Шапка */}
        <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <Link to="/">
              <Button variant="ghost" className="text-slate-400 hover:text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {RU.back}
              </Button>
            </Link>
          </div>
        </div>

        {/* Основной контент */}
        <div className="max-w-6xl mx-auto px-4 py-12">
          {/* Заголовок */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
              {RU.title}
            </h1>
            <p className="text-xl text-slate-400">{RU.subtitle}</p>
          </div>

          {/* Основная форма */}
          {!videoInfo ? (
            <Card className="max-w-2xl mx-auto bg-slate-900 border-slate-800 p-8 mb-12">
              <div className="space-y-6">
                <div>
                  <label className="block text-white font-semibold mb-3">{RU.urlLabel}</label>
                  <Input
                    type="text"
                    placeholder={RU.urlPlaceholder}
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleLoadVideo()}
                    className="bg-slate-800 border-slate-700 text-white placeholder-slate-500 h-12"
                    disabled={downloadProgress.status !== "idle"}
                  />
                </div>

                <Button
                  onClick={handleLoadVideo}
                  disabled={downloadProgress.status !== "idle" || !url.trim()}
                  className="w-full h-12 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold text-lg"
                >
                  {downloadProgress.status === "fetching" ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {RU.loading}
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 mr-2" />
                      {RU.loadVideo}
                    </>
                  )}
                </Button>

                {downloadProgress.status === "error" && (
                  <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 flex gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-red-400">{downloadProgress.message}</p>
                  </div>
                )}
              </div>

              {/* Информационные блоки */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12 pt-12 border-t border-slate-800">
                {[
                  { icon: "⚡", title: RU.fast, desc: RU.fastDesc },
                  { icon: "🎬", title: RU.highQuality, desc: RU.highQualityDesc },
                  { icon: "🎨", title: RU.easyToUse, desc: RU.easyToUseDesc },
                ].map((item) => (
                  <div key={item.title} className="text-center">
                    <div className="text-3xl mb-2">{item.icon}</div>
                    <h3 className="font-semibold text-white mb-1">{item.title}</h3>
                    <p className="text-sm text-slate-400">{item.desc}</p>
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <div className="space-y-8">
              {/* Информация о видео */}
              <Card className="bg-slate-900 border-slate-800 overflow-hidden">
                <div className="flex flex-col md:flex-row gap-8 p-8">
                  {/* Миниатюра */}
                  <div className="flex-shrink-0">
                    <img
                      src={videoInfo.thumbnail}
                      alt={videoInfo.title}
                      className="w-full md:w-64 h-auto rounded-lg object-cover"
                    />
                  </div>

                  {/* Информация */}
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white mb-4">{videoInfo.title}</h2>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-center text-slate-300">
                        <User className="w-4 h-4 mr-3 text-slate-500" />
                        <span>{RU.channel}: {videoInfo.uploader}</span>
                      </div>
                      <div className="flex items-center text-slate-300">
                        <Clock className="w-4 h-4 mr-3 text-slate-500" />
                        <span>{RU.duration}: {formatDuration(videoInfo.duration)}</span>
                      </div>
                      {videoInfo.uploadDate && (
                        <div className="flex items-center text-slate-300">
                          <span className="text-slate-500 mr-3">📅</span>
                          <span>{RU.published}: {videoInfo.uploadDate}</span>
                        </div>
                      )}
                    </div>

                    {videoInfo.description && (
                      <div className="mb-6">
                        <h3 className="text-sm font-semibold text-slate-300 mb-2">{RU.description}</h3>
                        <p className="text-slate-400 text-sm line-clamp-3">{videoInfo.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              {/* Выбор качества и загрузка */}
              <Card className="bg-slate-900 border-slate-800 p-8">
                <h3 className="text-xl font-semibold text-white mb-6">{RU.selectQuality}</h3>

                {downloadProgress.status === "completed" ? (
                  <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-6 mb-6">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-6 h-6 text-green-500" />
                      <div>
                        <p className="text-green-400 font-semibold">{downloadProgress.message}</p>
                        {downloadProgress.fileName && (
                          <p className="text-green-300 text-sm mt-1">{RU.fileName}: {downloadProgress.fileName}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}

                {downloadProgress.status === "downloading" && (
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-white font-semibold">{downloadProgress.message}</span>
                      <span className="text-slate-400 text-sm">{downloadProgress.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-blue-500 h-full transition-all duration-300"
                        style={{ width: `${downloadProgress.progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {downloadProgress.status !== "downloading" && downloadProgress.status !== "completed" && (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
                      {qualityOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setSelectedQuality(option.value)}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            selectedQuality === option.value
                              ? "border-purple-500 bg-purple-500/20 text-white"
                              : "border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600"
                          }`}
                        >
                          <div className="font-semibold">{option.label}</div>
                          <div className="text-xs text-slate-400 mt-1">{option.description}</div>
                        </button>
                      ))}
                    </div>

                    <Button
                      onClick={handleDownload}
                      disabled={downloadProgress.status === "downloading"}
                      className="w-full h-12 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold text-lg"
                    >
                      {downloadProgress.status === "downloading" ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          {RU.downloading}
                        </>
                      ) : (
                        <>
                          <Download className="w-5 h-5 mr-2" />
                          {RU.download}
                        </>
                      )}
                    </Button>
                  </>
                )}

                {downloadProgress.status === "error" && (
                  <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 flex gap-3 mb-6">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-red-400 text-sm">{downloadProgress.message}</p>
                  </div>
                )}

                {downloadProgress.status === "completed" && (
                  <div className="flex gap-3 flex-col md:flex-row">
                    <Button
                      onClick={handleReset}
                      className="flex-1 h-12 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold"
                    >
                      {RU.downloadAgain}
                    </Button>
                    <Button
                      onClick={() => {
                        handleReset();
                        setUrl("");
                      }}
                      variant="outline"
                      className="flex-1 h-12 border-slate-700 text-white hover:bg-slate-800"
                    >
                      {RU.downloadAnother}
                    </Button>
                  </div>
                )}
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default YouTubeDownloader;

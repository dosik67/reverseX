import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, ArrowLeft, Folder } from "lucide-react";
import { Link } from "react-router-dom";

const FileBrowserDownload = () => {
  const fileName = "ReverseBrowser File Manager";
  const fileSize = "Unknown";
  const fileDescription = "Advanced File Browser Tool";

  const handleDownload = () => {
    // Скачивание через API или прямую ссылку
    window.location.href = `/api/download/file-browser`;
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <Link to="/" className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-secondary transition-colors inline-block mb-8">
        <ArrowLeft className="w-4 h-4" />
        Back Home
      </Link>

      <div className="max-w-2xl mx-auto">
        <Card className="p-12 text-center card-glow">
          <Folder className="w-24 h-24 mx-auto mb-6 text-primary" />
          
          <h1 className="text-4xl font-bold mb-4 gradient-text">
            {fileDescription}
          </h1>
          
          <div className="bg-secondary/50 rounded-lg p-6 mb-8 border border-primary/20">
            <p className="text-muted-foreground mb-2">Tool Name</p>
            <p className="text-xl font-mono font-semibold mb-4">{fileName}</p>
            
            <p className="text-muted-foreground mb-2">Type</p>
            <p className="text-lg font-semibold mb-6">File Manager / Browser</p>

            <p className="text-muted-foreground text-sm">
              A powerful file browser and manager for your system. Browse, manage, and organize files with ease.
            </p>
          </div>

          <Button 
            onClick={handleDownload}
            size="lg"
            className="gap-2 px-8 h-12 text-base"
          >
            <Download className="w-5 h-5" />
            Download File Browser
          </Button>

          <p className="text-muted-foreground text-sm mt-8">
            Click the button above to download the file browser to your device.
          </p>
        </Card>
      </div>
    </div>
  );
};

export default FileBrowserDownload;

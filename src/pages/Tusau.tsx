import { Link } from "react-router-dom";

const Tusau = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card/40 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Тұсаукесер — Ақжібек
            </h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">
              Семейный момент, сохранённый в ReverseX
            </p>
          </div>
          <Link
            to="/"
            className="text-sm text-primary hover:underline whitespace-nowrap"
          >
            ← На главную
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid gap-8 md:grid-cols-[2fr,1fr] items-start">
          <div>
            <div className="aspect-video w-full overflow-hidden rounded-xl border bg-black">
              <video
                className="h-full w-full"
                controls
                preload="metadata"
                poster="/tusau-akzhibek-poster.jpg"
              >
                <source src="/tusau-akzhibek.mp4" type="video/mp4" />
                Ваш браузер не поддерживает воспроизведение видео.
              </video>
            </div>
          </div>

          <div className="space-y-4 text-sm md:text-base">
            <div>
              <h2 className="text-lg font-semibold mb-2">Описание</h2>
              <p className="text-muted-foreground leading-relaxed">
                Здесь можно посмотреть видео тұсаукесера Ақжібек. Страница
                сделана специально по ссылке{" "}
                <span className="font-mono text-xs md:text-sm break-all">
                  /tusau
                </span>
                , чтобы легко делиться этим моментом с близкими.
              </p>
            </div>

            <div className="rounded-lg border bg-card/60 p-4 space-y-1 text-xs md:text-sm text-muted-foreground">
              <p>
                Чтобы видео отображалось на продакшене, поместите файл с
                названием{" "}
                <code className="px-1 py-0.5 rounded bg-muted text-xs">
                  tusau-akzhibek.mp4
                </code>{" "}
                в папку <code className="px-1 py-0.5 rounded bg-muted text-xs">public</code>{" "}
                проекта (рядом с <code className="px-1 py-0.5 rounded bg-muted text-xs">index.html</code>).
              </p>
              <p>
                При желании можно изменить имя файла и постера в компоненте{" "}
                <code className="px-1 py-0.5 rounded bg-muted text-xs">
                  Tusau.tsx
                </code>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tusau;


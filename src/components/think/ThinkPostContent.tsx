import type { ThinkAttachment, ThinkYoutube } from "@/lib/think";

type ThinkPostContentProps = {
  html: string;
  attachments: ThinkAttachment[];
  youtubeVideos: ThinkYoutube[];
};

export function ThinkPostContent({ html, attachments, youtubeVideos }: ThinkPostContentProps) {
  const videoAttachments = attachments.filter((a) => a.kind === "video");

  return (
    <div className="space-y-6">
      {html && (
        <div
          className="prose-think text-sm leading-relaxed [&_img]:my-2 [&_img]:max-w-full [&_img]:h-auto"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}

      {youtubeVideos.length > 0 && (
        <div className="space-y-4">
          {youtubeVideos.map((video) => (
            <div key={video.id} className="overflow-hidden border border-border bg-black">
              <div className="aspect-video w-full">
                <iframe
                  src={`https://www.youtube.com/embed/${video.video_id}`}
                  title={video.title ?? "YouTube video"}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="h-full w-full"
                />
              </div>
              {video.title && (
                <p className="border-t border-border bg-neutral-50 px-3 py-2 text-xs text-muted">
                  {video.title}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {videoAttachments.length > 0 && (
        <div className="space-y-4">
          {videoAttachments.map((att) => (
            <video key={att.id} src={att.file_url} controls className="max-w-full" preload="metadata">
              <track kind="captions" />
            </video>
          ))}
        </div>
      )}
    </div>
  );
}

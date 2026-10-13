export interface ImageViewerProps {
  src: string;
  alt: string;
}

export function ImageViewer({ src, alt }: ImageViewerProps) {
  return <img className="image-viewer" src={src} alt={alt} />;
}

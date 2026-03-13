export interface GalleryImagesProps {
  activeImageIndex: number;
  setActiveImageIndex: (index: number) => void;
  galleryImages: string[];
  modTitle: string;
}

export function GalleryImages({
  activeImageIndex,
  setActiveImageIndex,
  galleryImages,
  modTitle,
}: GalleryImagesProps) {
  return (
    <div className="bg-base-200 space-y-3 rounded-2xl p-4">
      <div className="flex items-center justify-end gap-3">
        <p className="text-base-content/60 text-xs">
          {activeImageIndex + 1} / {galleryImages.length}
        </p>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {galleryImages.map((image, index) => (
          <button
            key={`${image}-${index}`}
            className={`shrink-0 overflow-hidden rounded-xl border-2 ${
              index === activeImageIndex
                ? "border-primary"
                : "border-transparent"
            }`}
            type="button"
            onClick={() => setActiveImageIndex(index)}
          >
            <img
              src={image}
              alt={`${modTitle} screenshot ${index + 1}`}
              className="h-20 w-32 object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

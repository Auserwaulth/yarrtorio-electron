/**
 * Props for the GalleryImages component
 */
export interface GalleryImagesProps {
  /** The index of the currently active image */
  activeImageIndex: number;
  /** Callback when a different image is selected */
  setActiveImageIndex: (index: number) => void;
  /** Array of image URLs to display in the gallery */
  galleryImages: string[];
  /** The title of the mod, used for alt text */
  modTitle: string;
}

/**
 * A thumbnail gallery component that displays mod screenshots.
 * Allows users to navigate between multiple images.
 *
 * @param props - Component props
 * @param props.activeImageIndex - Currently selected image index
 * @param props.setActiveImageIndex - Callback to change the active image
 * @param props.galleryImages - Array of image URLs
 * @param props.modTitle - Mod title for alt text
 *
 * @example
 * <GalleryImages
 *   activeImageIndex={0}
 *   setActiveImageIndex={setIndex}
 *   galleryImages={images}
 *   modTitle="My Mod"
 * />
 */
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

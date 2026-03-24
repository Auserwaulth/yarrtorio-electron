import type { ReactNode } from "react";

/**
 * Props for the FadeSkeleton component
 */
interface FadeSkeletonProps {
  /** Whether the component is in loading state */
  loading: boolean;
  /** The skeleton UI to show during loading */
  skeleton: ReactNode;
  /** The actual content to show when not loading */
  children: ReactNode;
  /** Duration of the fade transition in milliseconds */
  duration?: number;
  /** Minimum height of the container */
  minHeight?: string;
}

/**
 * A wrapper component that provides smooth fade transitions between
 * skeleton loading states and actual content.
 *
 * Uses absolute positioning to overlay skeleton and content, ensuring
 * no layout shift during transitions.
 *
 * @example
 * <FadeSkeleton
 *   loading={isLoading}
 *   skeleton={<CardSkeleton />}
 *   minHeight="200px"
 * >
 *   <Card data={data} />
 * </FadeSkeleton>
 */
export function FadeSkeleton({
  loading,
  skeleton,
  children,
  duration = 300,
  minHeight,
}: FadeSkeletonProps) {
  const skeletonStyle: React.CSSProperties = {
    opacity: loading ? 1 : 0,
    transition: `opacity ${duration}ms ease-in-out`,
    pointerEvents: loading ? "auto" : "none",
    position: "absolute",
    inset: 0,
  };

  const contentStyle: React.CSSProperties = {
    opacity: loading ? 0 : 1,
    transition: `opacity ${duration}ms ease-in-out`,
  };

  const containerStyle: React.CSSProperties = minHeight ? { minHeight } : {};

  return (
    <div className="relative" style={containerStyle}>
      <div style={skeletonStyle} aria-hidden={!loading}>
        {skeleton}
      </div>
      <div style={contentStyle} aria-hidden={loading}>
        {children}
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from 'react';
import { withParsedClasses } from '../../hoc/withParsedClasses';
// import { useThemeContext } from '../../theme';
import './Image.css';

export interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    /**
     * Source URL of the image
     */
    src: string;
    /**
     * Alternate text for the image
     */
    alt: string;
    /**
     * Fallback image source to show while loading or on error
     */
    fallback?: string;
    /**
     * Custom component to render the image (e.g. Next.js Image)
     * Defaults to standard 'img' tag
     */
    component?: React.ElementType;
    /**
     * Whether to eager load the image
     * @default false
     */
    priority?: boolean;
    /**
     * Hint to the browser to prioritize the fetch of the image
     */
    fetchPriority?: "high" | "low" | "auto";
    /**
     * Additional CSS class name for the wrapper
     */
    className?: string;
    /**
     * Additional CSS styles for the wrapper
     */
    style?: React.CSSProperties;
    /**
     * Props to pass to the underlying image component
     */
    imageProps?: Record<string, any>;
}

/**
 * Image - Intelligent image component
 * 
 * Handles loading states, fallbacks, and supports custom image components (like Next.js Image).
 * Displays a fallback image until the main image is fully loaded.
 * 
 * @example
 * ```tsx
 * <Image 
 *   src="/product.jpg" 
 *   alt="Product" 
 *   fallback="/placeholder.jpg" 
 * />
 * ```
 * 
 * @example
 * With Next.js Image
 * ```tsx
 * <Image 
 *   component={NextImage}
 *   src="/product.jpg" 
 *   alt="Product" 
 *   imageProps={{ width: 500, height: 500 }}
 * />
 * ```
 */
const Image = React.forwardRef<HTMLDivElement, ImageProps>(
    (
        {
            src,
            alt,
            fallback,
            component: Component = 'img',
            priority = false,
            fetchPriority,
            className = '',
            style,
            imageProps = {},
            onLoad,
            onError,
            ...props
        },
        ref
    ) => {
        const [loaded, setLoaded] = useState(false);
        const [error, setError] = useState(false);
        // const { theme } = useThemeContext();

        // Reset state if src changes
        useEffect(() => {
            setLoaded(false);
            setError(false);
        }, [src]);

        const handleLoad = (e: any) => {
            setLoaded(true);
            if (onLoad) onLoad(e);
        };

        const handleError = (e: any) => {
            setError(true);
            if (onError) onError(e);
        };

        // If using a custom component, we assume it supports className, style, src, alt, etc.
        // If it's standard img, we merge props.

        // Logic:
        // 1. Render fallback absolutely positioned at bottom.
        // 2. Render main image on top.
        // 3. Main image is opacity 0 until loaded.
        // 4. If error, main image stays hidden (or removed) and fallback stays visible.

        // const showFallback = (!loaded || error) && fallback;

        return (
            <div
                ref={ref}
                className={`lxs-image-wrapper ${className}`}
                style={style}
                {...props}
            >
                {/* Placeholder / Fallback */}
                {fallback && (
                    <img
                        src={fallback}
                        alt={alt ? `${alt} placeholder` : 'Placeholder'}
                        className={`lxs-image-placeholder ${loaded && !error ? 'lxs-image-placeholder--hidden' : ''}`}
                        loading="lazy"
                    />
                )}

                {/* Main Image */}
                {!error && (
                    <Component
                        src={src}
                        alt={alt}
                        className={`lxs-image-main ${loaded ? 'lxs-image-main--loaded' : 'lxs-image-main--loading'} ${imageProps.className || ''}`}
                        onLoad={handleLoad}
                        onError={handleError}
                        loading={priority ? "eager" : "lazy"}
                        fetchPriority={fetchPriority}
                        {...imageProps}
                    />
                )}

                {/* If error and no fallback, we might want to show nothing or a broken image icon? 
            For now, if error and fallback exists, fallback shows. 
            If error and NO fallback, the broken image might show depending on browser, 
            but we hid the main image component if error occurs to avoid ugly broken icon on top of nothing.
            Wait, if no fallback, we normally want the broken icon. 
        */}
                {error && !fallback && (
                    <div style={{ display: 'none' }}>Failed to load props</div>
                    // Render standard img to show browser broken icon? 
                    // Or just leave it blank. User requested "default image".
                )}
            </div>
        );
    }
);

Image.displayName = 'Image';

const ImageWithParsedClasses = withParsedClasses(Image);

export default ImageWithParsedClasses as React.FC<ImageProps & React.RefAttributes<HTMLDivElement>>;
export { ImageWithParsedClasses as Image };

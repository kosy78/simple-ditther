import { useState, useEffect, useRef, useCallback } from 'react';
import { processImage, hexToRgb, type DitherOptions, type AlgorithmName } from '../lib/dither';
import { processAscii, DEFAULT_CHAR_SET } from '../lib/ascii';

interface UseMediaProcessorProps {
    src: string | null;
    type: 'image' | 'video';
    activeTab: string;
    options: {
        algorithm: string;
        pointSize: number;
        inkColor: string;
        bgColor: string;
        brightness: number;
        contrast: number;
        detail: number;
    };
    asciiOptions: {
        fontSize: number;
        charSet: string;
        inverted: boolean;
    };
    isPlaying: boolean;
}

export const useMediaProcessor = ({ src, type, activeTab, options, asciiOptions, isPlaying }: UseMediaProcessorProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const requestRef = useRef<number | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Initialize video element if needed
    useEffect(() => {
        if (type === 'video' && src) {
            const video = document.createElement('video');
            video.src = src;
            video.loop = true;
            video.muted = true;
            video.playsInline = true;
            videoRef.current = video;

            // Cleanup
            return () => {
                video.pause();
                video.src = '';
                videoRef.current = null;
            };
        }
    }, [src, type]);

    // Handle Play/Pause
    useEffect(() => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.play().catch(e => console.error("Error playing video:", e));
            } else {
                videoRef.current.pause();
            }
        }
    }, [isPlaying]);

    const processFrame = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const source = type === 'video' ? videoRef.current : null;
        if (type === 'video' && (!source || source.readyState < 2)) {
            // Video not ready, try again next frame
            requestRef.current = requestAnimationFrame(processFrame);
            return;
        }

        // If it's an image, we load it once. If video, source is the video element.
        // For image, we handle it separately in a simpler effect, but let's unify if possible.
        // Actually, for image, we don't need a loop.

        // Let's split logic:
        // 1. Image: Process once on change.
        // 2. Video: Process loop.
    }, [type]);


    const processSingleFrame = useCallback((source: HTMLImageElement | HTMLVideoElement) => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        const width = source instanceof HTMLVideoElement ? source.videoWidth : source.width;
        const height = source instanceof HTMLVideoElement ? source.videoHeight : source.height;

        if (width === 0 || height === 0) return;

        if (activeTab === 'ASCII') {
            // ASCII Processing
            canvas.width = width;
            canvas.height = height;

            const offCanvas = document.createElement('canvas');
            offCanvas.width = width;
            offCanvas.height = height;
            const offCtx = offCanvas.getContext('2d');
            if (!offCtx) return;

            offCtx.drawImage(source, 0, 0);
            const imageData = offCtx.getImageData(0, 0, width, height);

            const asciiCanvas = processAscii(imageData, {
                fontSize: asciiOptions.fontSize,
                charSet: asciiOptions.charSet || DEFAULT_CHAR_SET,
                inverted: asciiOptions.inverted,
                color: options.inkColor,
                bgColor: options.bgColor
            });

            ctx.drawImage(asciiCanvas, 0, 0);

        } else {
            // Dither Processing
            const scale = Math.max(1, Math.floor(options.pointSize));
            const processWidth = Math.floor(width / scale);
            const processHeight = Math.floor(height / scale);

            canvas.width = width;
            canvas.height = height;

            ctx.imageSmoothingEnabled = false;

            const offCanvas = document.createElement('canvas');
            offCanvas.width = processWidth;
            offCanvas.height = processHeight;
            const offCtx = offCanvas.getContext('2d');
            if (!offCtx) return;

            offCtx.drawImage(source, 0, 0, processWidth, processHeight);
            const imageData = offCtx.getImageData(0, 0, processWidth, processHeight);

            const ditherOptions: DitherOptions = {
                algorithm: options.algorithm as AlgorithmName,
                pointSize: options.pointSize,
                palette: {
                    ink: hexToRgb(options.inkColor),
                    bg: hexToRgb(options.bgColor)
                },
                brightness: options.brightness,
                contrast: options.contrast,
                detail: options.detail
            };

            const processedData = processImage(imageData, ditherOptions);

            offCtx.putImageData(processedData, 0, 0);
            ctx.drawImage(offCanvas, 0, 0, processWidth, processHeight, 0, 0, canvas.width, canvas.height);
        }
    }, [activeTab, options, asciiOptions]);


    // Loop for Video
    const loop = useCallback(() => {
        if (type === 'video' && videoRef.current && isPlaying) {
            processSingleFrame(videoRef.current);
            requestRef.current = requestAnimationFrame(loop);
        }
    }, [type, isPlaying, processSingleFrame]);

    useEffect(() => {
        if (type === 'video' && isPlaying) {
            requestRef.current = requestAnimationFrame(loop);
            return () => {
                if (requestRef.current) cancelAnimationFrame(requestRef.current);
            };
        }
    }, [type, isPlaying, loop]);

    // One-off for Image
    useEffect(() => {
        if (type === 'image' && src) {
            setIsProcessing(true);
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.src = src;
            img.onload = () => {
                // Debounce slightly for UI responsiveness
                setTimeout(() => {
                    processSingleFrame(img);
                    setIsProcessing(false);
                }, 50);
            };
        }
    }, [src, type, activeTab, options, asciiOptions, processSingleFrame]);

    // Also process video frame when paused and settings change
    useEffect(() => {
        if (type === 'video' && videoRef.current && !isPlaying) {
            // Wait for seek or just process current frame
            setTimeout(() => {
                if (videoRef.current) processSingleFrame(videoRef.current);
            }, 50);
        }
    }, [type, isPlaying, activeTab, options, asciiOptions, processSingleFrame]);


    return { canvasRef, videoRef, isProcessing };
};

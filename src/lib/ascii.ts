import { interpolateColor, rgbToString } from './utils';

export interface AsciiOptions {
    fontSize: number;
    charSet: string;
    inverted: boolean;
    color: string;
    inkMode?: 'solid' | 'gradient';
    inkGradient?: string[];
    bgColor: string;
}


export const DEFAULT_CHAR_SET = ' .:-=+*#%@';
export const DENSE_CHAR_SET = '$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,"^`\'. ';
export const BINARY_CHAR_SET = '01';

export const processAscii = (
    imageData: ImageData,
    options: AsciiOptions
): HTMLCanvasElement => {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;

    // Create a temporary canvas to render text
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    // Calculate dimensions based on font size
    // We need to sample the image at a resolution that matches the font grid
    // Font aspect ratio is roughly 0.6 (width/height) for monospace
    const fontWidth = options.fontSize * 0.6;
    const fontHeight = options.fontSize;

    const cols = Math.floor(width / fontWidth);
    const rows = Math.floor(height / fontHeight);

    canvas.width = width;
    canvas.height = height;

    // Fill background
    ctx.fillStyle = options.bgColor;
    ctx.fillRect(0, 0, width, height);

    // Set font
    ctx.font = `${options.fontSize}px monospace`;
    // ctx.fillStyle = options.color; // Set per character if gradient
    ctx.textBaseline = 'top';

    const charSet = options.inverted
        ? options.charSet.split('').reverse().join('')
        : options.charSet;

    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            // Sample pixel at the center of the block
            const px = Math.floor(x * fontWidth);
            const py = Math.floor(y * fontHeight);

            const i = (py * width + px) * 4;

            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // Calculate brightness
            const brightness = (r + g + b) / 3;

            // Map to char
            const charIndex = Math.floor((brightness / 255) * (charSet.length - 1));
            const char = charSet[charIndex];

            if (options.inkMode === 'gradient' && options.inkGradient) {
                // Map Y position to gradient
                const color = interpolateColor(options.inkGradient, y / rows);
                ctx.fillStyle = rgbToString(color);
            } else {
                ctx.fillStyle = options.color;
            }

            ctx.fillText(char, x * fontWidth, y * fontHeight);
        }
    }

    return canvas;
};

import { interpolateColor, type RGB } from './utils';

export type { RGB };

export type AlgorithmName =
    | 'Floyd-Steinberg'
    | 'False Floyd-Steinberg'
    | 'Atkinson'
    | 'Stucki'
    | 'Burkes'
    | 'Sierra'
    | 'Sierra Two-Row'
    | 'Sierra Lite';

export interface DitherOptions {
    algorithm: AlgorithmName;
    pointSize: number;
    palette: {
        ink: RGB;
        bg: RGB;
        inkMode?: 'solid' | 'gradient';
        inkGradient?: RGB[];
    };
    brightness: number;
    contrast: number;
    detail: number;
}

// Kernel definition: [dx, dy, factor]
type Kernel = [number, number, number][];

const KERNELS: Record<AlgorithmName, { kernel: Kernel; divisor: number }> = {
    'Floyd-Steinberg': {
        divisor: 16,
        kernel: [
            [1, 0, 7],
            [-1, 1, 3],
            [0, 1, 5],
            [1, 1, 1],
        ],
    },
    'False Floyd-Steinberg': {
        divisor: 8,
        kernel: [
            [1, 0, 3],
            [0, 1, 3],
            [1, 1, 2],
        ]
    },
    'Atkinson': {
        divisor: 8,
        kernel: [
            [1, 0, 1],
            [2, 0, 1],
            [-1, 1, 1],
            [0, 1, 1],
            [1, 1, 1],
            [0, 2, 1],
        ],
    },
    'Stucki': {
        divisor: 42,
        kernel: [
            [1, 0, 8],
            [2, 0, 4],
            [-2, 1, 2],
            [-1, 1, 4],
            [0, 1, 8],
            [1, 1, 4],
            [2, 1, 2],
            [-2, 2, 1],
            [-1, 2, 2],
            [0, 2, 4],
            [1, 2, 2],
            [2, 2, 1],
        ],
    },
    'Burkes': {
        divisor: 32,
        kernel: [
            [1, 0, 8],
            [2, 0, 4],
            [-2, 1, 2],
            [-1, 1, 4],
            [0, 1, 8],
            [1, 1, 4],
            [2, 1, 2],
        ],
    },
    'Sierra': {
        divisor: 32,
        kernel: [
            [1, 0, 5],
            [2, 0, 3],
            [-2, 1, 2],
            [-1, 1, 4],
            [0, 1, 5],
            [1, 1, 4],
            [2, 1, 2],
            [-1, 2, 2],
            [0, 2, 3],
            [1, 2, 2],
        ],
    },
    'Sierra Two-Row': {
        divisor: 16,
        kernel: [
            [1, 0, 4],
            [2, 0, 3],
            [-2, 1, 1],
            [-1, 1, 2],
            [0, 1, 3],
            [1, 1, 2],
            [2, 1, 1],
        ]
    },
    'Sierra Lite': {
        divisor: 4,
        kernel: [
            [1, 0, 2],
            [-1, 1, 1],
            [0, 1, 1],
        ]
    }
};



// Calculate color distance (Euclidean)
const colorDistance = (c1: RGB, c2: RGB) => {
    return Math.sqrt(
        Math.pow(c1.r - c2.r, 2) +
        Math.pow(c1.g - c2.g, 2) +
        Math.pow(c1.b - c2.b, 2)
    );
};

// Find closest palette color
const getClosestColor = (current: RGB, palette: { ink: RGB, bg: RGB }): RGB => {
    const distInk = colorDistance(current, palette.ink);
    const distBg = colorDistance(current, palette.bg);
    return distInk < distBg ? palette.ink : palette.bg;
};



export const processImage = (
    imageData: ImageData,
    options: DitherOptions
): ImageData => {
    const width = imageData.width;
    const height = imageData.height;
    const data = new Uint8ClampedArray(imageData.data);

    // 1. Apply Brightness and Contrast
    const contrastFactor = (259 * (options.contrast + 255)) / (255 * (259 - options.contrast)); // Standard contrast formula

    for (let i = 0; i < data.length; i += 4) {
        // Brightness
        let r = data[i] + (options.brightness - 1) * 128; // Map 0-2 to -128 to 128 roughly
        let g = data[i + 1] + (options.brightness - 1) * 128;
        let b = data[i + 2] + (options.brightness - 1) * 128;

        // Contrast
        r = contrastFactor * (r - 128) + 128;
        g = contrastFactor * (g - 128) + 128;
        b = contrastFactor * (b - 128) + 128;

        data[i] = Math.min(255, Math.max(0, r));
        data[i + 1] = Math.min(255, Math.max(0, g));
        data[i + 2] = Math.min(255, Math.max(0, b));
        // Alpha remains unchanged
    }

    // 2. Apply Dithering
    // We need to work with a copy to diffuse errors
    // For simplicity in JS, we can modify the array in place if we are careful,
    // but since we already copied to `data`, we are good.

    // Note: Point size is handled by scaling the image down and up,
    // but here we assume we are processing the pixel data as is.
    // The caller should handle resizing for "Point Size".

    const selectedAlgo = KERNELS[options.algorithm] || KERNELS['Floyd-Steinberg'];
    const { kernel, divisor } = selectedAlgo;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;

            const oldR = data[i];
            const oldG = data[i + 1];
            const oldB = data[i + 2];

            let currentPalette = options.palette;

            if (options.palette.inkMode === 'gradient' && options.palette.inkGradient) {
                // Calculate ink color for this row
                const inkAtY = interpolateColor(options.palette.inkGradient, y / height);
                currentPalette = { ...options.palette, ink: inkAtY };
            }

            const closest = getClosestColor({ r: oldR, g: oldG, b: oldB }, currentPalette);

            data[i] = closest.r;
            data[i + 1] = closest.g;
            data[i + 2] = closest.b;

            const errR = oldR - closest.r;
            const errG = oldG - closest.g;
            const errB = oldB - closest.b;

            // Distribute error using kernel
            for (const [dx, dy, factor] of kernel) {
                const nx = x + dx;
                const ny = y + dy;
                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                    const ni = (ny * width + nx) * 4;
                    const f = factor / divisor;

                    data[ni] = Math.min(255, Math.max(0, data[ni] + errR * f));
                    data[ni + 1] = Math.min(255, Math.max(0, data[ni + 1] + errG * f));
                    data[ni + 2] = Math.min(255, Math.max(0, data[ni + 2] + errB * f));
                }
            }
        }
    }

    return new ImageData(data, width, height);
};

export interface RGB {
    r: number;
    g: number;
    b: number;
}

// Helper to parse hex to RGB
export const hexToRgb = (hex: string): RGB => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
};

// Helper to interpolate colors
export const interpolateColor = (colors: string[] | RGB[], t: number): RGB => {
    if (colors.length === 0) return { r: 0, g: 0, b: 0 };

    // Normalize input to RGB objects
    const rgbColors: RGB[] = (typeof colors[0] === 'string')
        ? (colors as string[]).map(hexToRgb)
        : (colors as RGB[]);

    if (rgbColors.length === 1) return rgbColors[0];

    // Clamp t
    t = Math.max(0, Math.min(1, t));

    // Find segment
    const segmentLength = 1 / (rgbColors.length - 1);
    const segmentIndex = Math.floor(t / segmentLength);

    // Handle last point
    if (segmentIndex >= rgbColors.length - 1) return rgbColors[rgbColors.length - 1];

    const startColor = rgbColors[segmentIndex];
    const endColor = rgbColors[segmentIndex + 1];

    const localT = (t - segmentIndex * segmentLength) / segmentLength;

    return {
        r: Math.round(startColor.r + (endColor.r - startColor.r) * localT),
        g: Math.round(startColor.g + (endColor.g - startColor.g) * localT),
        b: Math.round(startColor.b + (endColor.b - startColor.b) * localT)
    };
};

export const rgbToString = (rgb: RGB): string => {
    return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
};

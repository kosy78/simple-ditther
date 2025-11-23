import React from 'react';
import './ColorPalette.css';

interface Palette {
    ink: string;
    bg: string;
}

interface ColorPaletteProps {
    inkColor: string;
    bgColor: string;
    onInkChange: (color: string) => void;
    onBgChange: (color: string) => void;
}

const PRESETS: Palette[] = [
    { ink: '#000000', bg: '#ffffff' },
    { ink: '#1a237e', bg: '#ffc107' },
    { ink: '#b71c1c', bg: '#fff9c4' },
    { ink: '#4a148c', bg: '#f8bbd0' },
    { ink: '#1b5e20', bg: '#e8f5e9' },
    { ink: '#311b92', bg: '#d1c4e9' },
    { ink: '#bf360c', bg: '#ffccbc' },
];

export const ColorPalette: React.FC<ColorPaletteProps> = ({
    inkColor,
    bgColor,
    onInkChange,
    onBgChange
}) => {

    const handlePresetClick = (preset: Palette) => {
        onInkChange(preset.ink);
        onBgChange(preset.bg);
    };

    return (
        <div className="control-group">
            <div className="control-label">
                <span>Color Palette</span>
            </div>

            <div className="palette-presets">
                {PRESETS.map((preset, index) => (
                    <button
                        key={index}
                        className="palette-swatch"
                        onClick={() => handlePresetClick(preset)}
                        title={`Ink: ${preset.ink}, BG: ${preset.bg}`}
                    >
                        <div className="swatch-ink" style={{ backgroundColor: preset.ink }}></div>
                        <div className="swatch-bg" style={{ backgroundColor: preset.bg }}></div>
                    </button>
                ))}
            </div>

            <div className="color-pickers">
                <div className="color-picker-item">
                    <label>Ink</label>
                    <div className="color-input-wrapper">
                        <input
                            type="color"
                            value={inkColor}
                            onChange={(e) => onInkChange(e.target.value)}
                        />
                        <span className="color-value">{inkColor}</span>
                    </div>
                </div>
                <div className="color-picker-item">
                    <label>BG</label>
                    <div className="color-input-wrapper">
                        <input
                            type="color"
                            value={bgColor}
                            onChange={(e) => onBgChange(e.target.value)}
                        />
                        <span className="color-value">{bgColor}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

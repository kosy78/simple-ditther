import React from 'react';
import './GradientEditor.css';

interface GradientEditorProps {
    colors: string[];
    onChange: (colors: string[]) => void;
}

export const GradientEditor: React.FC<GradientEditorProps> = ({ colors, onChange }) => {
    const handleColorChange = (index: number, value: string) => {
        const newColors = [...colors];
        newColors[index] = value;
        onChange(newColors);
    };

    const addColor = () => {
        const lastColor = colors[colors.length - 1];
        onChange([...colors, lastColor]);
    };

    const removeColor = (index: number) => {
        if (colors.length <= 2) return;
        const newColors = colors.filter((_, i) => i !== index);
        onChange(newColors);
    };

    const gradientPreview = `linear-gradient(to right, ${colors.join(', ')})`;

    return (
        <div className="gradient-editor">
            <div className="gradient-preview" style={{ background: gradientPreview }}></div>

            <div className="gradient-stops">
                {colors.map((color, index) => (
                    <div key={index} className="gradient-stop">
                        <input
                            type="color"
                            value={color}
                            onChange={(e) => handleColorChange(index, e.target.value)}
                        />
                        {colors.length > 2 && (
                            <button
                                className="remove-stop-btn"
                                onClick={() => removeColor(index)}
                                title="Remove color"
                            >
                                ×
                            </button>
                        )}
                    </div>
                ))}
                <button className="add-stop-btn" onClick={addColor}>
                    + Add Color
                </button>
            </div>
        </div>
    );
};

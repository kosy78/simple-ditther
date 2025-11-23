import React from 'react';
import './Slider.css';

interface SliderProps {
    label: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    onChange: (value: number) => void;
}

export const Slider: React.FC<SliderProps> = ({ label, value, min, max, step = 1, onChange }) => {
    const percentage = ((value - min) / (max - min)) * 100;

    return (
        <div className="control-group">
            <div className="control-label">
                <span>{label}</span>
                <span>{value}</span>
            </div>
            <div className="slider-container">
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={(e) => onChange(parseFloat(e.target.value))}
                    className="slider-input"
                    style={{ background: `linear-gradient(to right, #fff ${percentage}%, #333 ${percentage}%)` }}
                />
            </div>
        </div>
    );
};

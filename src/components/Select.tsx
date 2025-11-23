import React from 'react';
import './Select.css';

interface SelectProps {
    label: string;
    value: string;
    options: { label: string; value: string }[];
    onChange: (value: string) => void;
}

export const Select: React.FC<SelectProps> = ({ label, value, options, onChange }) => {
    return (
        <div className="control-group">
            <div className="control-label">
                <span>{label}</span>
            </div>
            <div className="select-container">
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="custom-select"
                >
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                <div className="select-arrow">
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 1L5 5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
            </div>
        </div>
    );
};

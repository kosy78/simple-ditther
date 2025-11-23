import React from 'react';
import './Tabs.css';

interface TabsProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
}

const TABS = ['ASCII', 'Dither', 'Halftone'];

export const Tabs: React.FC<TabsProps> = ({ activeTab, onTabChange }) => {
    return (
        <div className="tabs-container">
            {TABS.map((tab) => (
                <button
                    key={tab}
                    className={`tab-button ${activeTab === tab ? 'active' : ''}`}
                    onClick={() => onTabChange(tab)}
                >
                    {tab}
                </button>
            ))}
        </div>
    );
};

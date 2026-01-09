
import React from 'react';

interface StatBarProps {
  label: string;
  value: number;
  max: number;
  color: string;
  icon: string;
  description: string;
}

export const StatBar: React.FC<StatBarProps> = ({ label, value, max, color, icon, description }) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="flex justify-between items-center text-sm font-bold text-gray-700">
        <div className="flex items-center gap-1">
          <span className="text-lg">{icon}</span>
          <span>{label}</span>
        </div>
        <span>{value} / {max}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
        <div
          className={`h-full transition-all duration-500 ease-out ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-[10px] text-gray-500 italic">{description}</p>
    </div>
  );
};

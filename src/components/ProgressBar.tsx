import React, { useEffect, useState } from 'react';

interface ProgressBarProps {
  label: string;
  value: number;
  color?: 'emerald' | 'blue' | 'amber' | 'red' | 'indigo';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ label, value, color = 'blue' }) => {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    // Trigger animation after mount
    const timer = setTimeout(() => setWidth(value), 100);
    return () => clearTimeout(timer);
  }, [value]);

  const colorMap = {
    emerald: 'bg-brand-emerald shadow-glow-emerald',
    blue: 'bg-brand-blue shadow-glow-blue',
    amber: 'bg-brand-amber',
    red: 'bg-brand-red',
    indigo: 'bg-indigo-600',
  };

  const barColor = colorMap[color] || colorMap.blue;

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs font-bold text-slate-700">
        <span>{label}</span>
        <span className="font-mono">{value}%</span>
      </div>
      <div className="w-full h-2 bg-slate-200/85 rounded-full overflow-hidden border border-slate-300/30">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out ${barColor}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;

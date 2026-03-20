"use client";

import { useEffect, useState } from 'react';

interface EngagementGaugeProps {
  value: number;
}

const EngagementGauge: React.FC<EngagementGaugeProps> = ({ value }) => {
  const [animatedValue, setAnimatedValue] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedValue(value);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [value]);

  const getColor = (val: number) => {
    if (val >= 80) return 'text-green-500';
    if (val >= 60) return 'text-blue-500';
    if (val >= 40) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getLabel = (val: number) => {
    if (val >= 80) return 'Excellent';
    if (val >= 60) return 'Good';
    if (val >= 40) return 'Average';
    return 'Low';
  };

  return (
    <div className="text-center">
      <div className={`text-4xl font-bold ${getColor(value)} mb-1`}>
        {Math.round(animatedValue)}%
      </div>
      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden mx-auto">
        <div 
          className={`h-full rounded-full transition-all duration-1000 ${getColor(value).replace('text-', 'bg-')}`}
          style={{ width: `${Math.min(animatedValue, 100)}%` }}
        ></div>
      </div>
      <div className={`text-sm font-medium mt-2 ${getColor(value)}`}>
        {getLabel(value)}
      </div>
    </div>
  );
};

export default EngagementGauge;
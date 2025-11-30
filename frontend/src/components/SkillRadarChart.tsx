'use client';

import { useMemo } from 'react';

interface CategoryScore {
  name: string;
  shortName: string;
  score: number; // 0-100
  count: number;
  total: number;
}

interface SkillRadarChartProps {
  categories: CategoryScore[];
  size?: number;
}

export default function SkillRadarChart({ categories, size = 300 }: SkillRadarChartProps) {
  const center = size / 2;
  const radius = (size / 2) - 40;
  
  const points = useMemo(() => {
    if (categories.length === 0) return [];
    const angleStep = (2 * Math.PI) / categories.length;
    return categories.map((cat, i) => {
      const angle = i * angleStep - Math.PI / 2; // Start from top
      const r = (cat.score / 100) * radius;
      return {
        x: center + r * Math.cos(angle),
        y: center + r * Math.sin(angle),
        labelX: center + (radius + 25) * Math.cos(angle),
        labelY: center + (radius + 25) * Math.sin(angle),
        ...cat,
      };
    });
  }, [categories, center, radius]);

  if (categories.length < 3) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        Evaluate skills in at least 3 categories to see your radar
      </div>
    );
  }

  // Create the polygon path
  const polygonPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
  
  // Grid lines (concentric polygons)
  const gridLevels = [0.25, 0.5, 0.75, 1];
  
  return (
    <svg width={size} height={size} className="overflow-visible">
      {/* Grid lines */}
      {gridLevels.map((level) => {
        const gridPath = categories.map((_, i) => {
          const angle = (i * (2 * Math.PI) / categories.length) - Math.PI / 2;
          const r = level * radius;
          const x = center + r * Math.cos(angle);
          const y = center + r * Math.sin(angle);
          return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
        }).join(' ') + ' Z';
        return (
          <path key={level} d={gridPath} fill="none" stroke="currentColor" 
            className="text-gray-200 dark:text-gray-700" strokeWidth="1" />
        );
      })}
      
      {/* Axis lines */}
      {points.map((p, i) => (
        <line key={i} x1={center} y1={center} x2={center + radius * Math.cos((i * (2 * Math.PI) / categories.length) - Math.PI / 2)} 
          y2={center + radius * Math.sin((i * (2 * Math.PI) / categories.length) - Math.PI / 2)}
          stroke="currentColor" className="text-gray-200 dark:text-gray-700" strokeWidth="1" />
      ))}
      
      {/* Filled area */}
      <path d={polygonPath} fill="url(#radarGradient)" stroke="#3b82f6" strokeWidth="2" opacity="0.8" />
      
      {/* Gradient definition */}
      <defs>
        <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.4" />
        </linearGradient>
      </defs>
      
      {/* Data points */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill="#3b82f6" stroke="white" strokeWidth="2" />
      ))}
      
      {/* Labels */}
      {points.map((p, i) => (
        <text key={i} x={p.labelX} y={p.labelY} textAnchor="middle" dominantBaseline="middle"
          className="text-[10px] fill-gray-600 dark:fill-gray-400 font-medium">
          {p.shortName}
        </text>
      ))}
    </svg>
  );
}


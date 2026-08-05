import React from 'react';

export default function DonutChart({ total = 'R$ 32.800', items = [] }) {
  const defaultItems = [
    { label: 'Linha Comercial (Estopas)', value: 'R$ 14.800', percent: '45.1%', color: '#ef4444', count: 9 },
    { label: 'Linha Industrial', value: 'R$ 10.350', percent: '31.6%', color: '#f59e0b', count: 6 },
    { label: 'Vendas Diretas Campo', value: 'R$ 5.900', percent: '18.0%', color: '#f97316', count: 3 },
    { label: 'E-commerce / Contratos', value: 'R$ 1.750', percent: '5.3%', color: '#84cc16', count: 1 },
  ];

  const data = items.length > 0 ? items : defaultItems;

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
      {/* SVG Donut */}
      <div className="relative w-48 h-48 flex items-center justify-center flex-shrink-0">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
          <path
            className="text-slate-100"
            strokeWidth="3.8"
            stroke="currentColor"
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          {/* Segment 1: Red (45%) */}
          <path
            stroke="#ef4444"
            strokeWidth="3.8"
            strokeDasharray="45, 100"
            strokeLinecap="round"
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          {/* Segment 2: Yellow (32%) offset 45 */}
          <path
            stroke="#f59e0b"
            strokeWidth="3.8"
            strokeDasharray="32, 100"
            strokeDashoffset="-45"
            strokeLinecap="round"
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          {/* Segment 3: Orange (18%) offset 77 */}
          <path
            stroke="#f97316"
            strokeWidth="3.8"
            strokeDasharray="18, 100"
            strokeDashoffset="-77"
            strokeLinecap="round"
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          {/* Segment 4: Green (5%) offset 95 */}
          <path
            stroke="#84cc16"
            strokeWidth="3.8"
            strokeDasharray="5, 100"
            strokeDashoffset="-95"
            strokeLinecap="round"
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-lg font-extrabold text-slate-800 tracking-tight">{total}</span>
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">4 categorias</span>
        </div>
      </div>

      {/* Legend list */}
      <div className="flex-1 space-y-3 w-full">
        {data.map((item, index) => (
          <div key={index} className="flex items-center justify-between text-xs sm:text-sm">
            <div className="flex items-center gap-2.5">
              <span
                className="w-3 h-3 rounded-md flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="font-medium text-slate-700">{item.label}</span>
              <span className="text-slate-400 text-xs">({item.count})</span>
            </div>
            <div className="font-semibold text-slate-800">
              {item.value} <span className="text-slate-400 text-xs font-normal">({item.percent})</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

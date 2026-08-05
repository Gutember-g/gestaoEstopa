import React from 'react';

export default function FunnelChart({ stages = [] }) {
  const defaultStages = [
    { label: 'Propostas Iniciadas', count: 13, color: 'bg-blue-600', textColor: 'text-white' },
    { label: 'Aguardando Aprovação', count: 5, color: 'bg-amber-500', textColor: 'text-white' },
    { label: 'Parcelas a Receber', count: 8, color: 'bg-purple-600', textColor: 'text-white' },
    { label: 'Parcelas Liquidadas', count: 12, color: 'bg-emerald-500', textColor: 'text-white' },
    { label: 'Atrasos / Cobrança', count: 2, color: 'bg-red-500', textColor: 'text-white' },
  ];

  const data = stages.length > 0 ? stages : defaultStages;
  const widths = ['w-full', 'w-[85%]', 'w-[70%]', 'w-[55%]', 'w-[40%]'];

  return (
    <div className="flex flex-col items-center space-y-2 w-full py-2">
      {data.map((stage, idx) => (
        <div
          key={idx}
          className={`${widths[idx] || 'w-[30%]'} ${stage.color} ${stage.textColor} py-2.5 px-4 rounded-lg flex items-center justify-between text-xs font-semibold shadow-sm transition-transform hover:scale-[1.01]`}
        >
          <span className="truncate">{stage.label}</span>
          <span className="bg-white/20 px-2 py-0.5 rounded text-[11px] font-bold ml-2">
            {stage.count}
          </span>
        </div>
      ))}
    </div>
  );
}

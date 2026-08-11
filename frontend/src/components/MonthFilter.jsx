import React, { useState, useEffect } from 'react';

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function MonthFilter({ onChange, initialMonth, initialYear }) {
  const currentDate = new Date();
  const [mes, setMes] = useState(initialMonth || currentDate.getMonth() + 1);
  const [ano, setAno] = useState(initialYear || currentDate.getFullYear());

  useEffect(() => {
    if (onChange) {
      onChange({ mes, ano });
    }
  }, [mes, ano]);

  const handlePrevMonth = () => {
    if (mes === 1) {
      setMes(12);
      setAno((prev) => prev - 1);
    } else {
      setMes((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (mes === 12) {
      setMes(1);
      setAno((prev) => prev + 1);
    } else {
      setMes((prev) => prev + 1);
    }
  };

  const handleCurrentMonth = () => {
    const now = new Date();
    setMes(now.getMonth() + 1);
    setAno(now.getFullYear());
  };

  const isCurrentMonth = () => {
    const now = new Date();
    return mes === (now.getMonth() + 1) && ano === now.getFullYear();
  };

  const nomeMes = MESES[mes - 1] || '';

  return (
    <div className="inline-flex items-center gap-1.5 bg-white border border-slate-200/90 shadow-sm rounded-xl p-1 text-xs font-semibold text-slate-700">
      <button
        type="button"
        onClick={handlePrevMonth}
        title="Mês Anterior"
        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors active:scale-95"
      >
        <svg className="w-4 h-4 fill-none stroke-current stroke-[2]" viewBox="0 0 24 24">
          <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div className="px-2 min-w-[110px] text-center font-bold text-slate-800 select-none">
        {nomeMes} {ano}
      </div>

      <button
        type="button"
        onClick={handleNextMonth}
        title="Próximo Mês"
        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors active:scale-95"
      >
        <svg className="w-4 h-4 fill-none stroke-current stroke-[2]" viewBox="0 0 24 24">
          <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {!isCurrentMonth() && (
        <button
          type="button"
          onClick={handleCurrentMonth}
          className="ml-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold transition-all text-[11px] active:scale-95"
        >
          Mês Atual
        </button>
      )}
    </div>
  );
}

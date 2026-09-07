import React from 'react';

/**
 * Componente padronizado de Botão de Ação para o ERP (FlowERP)
 * Garante consistência visual, legibilidade e acessibilidade.
 */
export default function ActionButton({
  label,
  icon,
  onClick,
  variant = 'secondary',
  size = 'sm',
  type = 'button',
  disabled = false,
  className = '',
  title,
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none select-none';

  const sizeStyles = {
    xs: 'px-2 py-1 text-[11px] gap-1',
    sm: 'px-3 py-1.5 text-xs gap-1.5 min-h-[32px]',
    md: 'px-4 py-2 text-xs gap-2 min-h-[40px]',
    lg: 'px-5 py-2.5 text-sm gap-2 min-h-[44px]',
  };

  const variantStyles = {
    primary: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-600/20 border border-transparent',
    secondary: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-sm dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 border border-transparent',
    successSubtle: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 border border-transparent',
    dangerSubtle: 'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/50',
    outline: 'border border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800',
    subtle: 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300',
    ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100',
  };

  const chosenSize = sizeStyles[size] || sizeStyles.sm;
  const chosenVariant = variantStyles[variant] || variantStyles.secondary;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title || label}
      className={`${baseStyles} ${chosenSize} ${chosenVariant} ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {label && <span>{label}</span>}
    </button>
  );
}

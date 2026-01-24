import React from 'react';
import { clsx } from 'clsx';

export const Button = ({ children, variant = 'primary', className, ...props }) => {
  const baseStyles = "h-11 w-full rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98]";
  
  const variants = {
    primary: "bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-900 shadow-sm",
    outline: "border border-slate-200 text-slate-800 bg-white hover:bg-slate-50 active:bg-slate-100",
    danger: "bg-rose-50 text-rose-600 hover:bg-rose-100",
    ghost: "text-slate-700 hover:text-slate-900",
  };

  return (
    <button className={clsx(baseStyles, variants[variant], className)} {...props}>
      {children}
    </button>
  );
};
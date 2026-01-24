import React from 'react';

export const Input = ({ icon: Icon, ...props }) => {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:bg-white focus-within:ring-2 focus-within:ring-slate-900/10 transition-all">
      {Icon && <Icon className="text-slate-400" size={20} />}
      <input
        className="w-full bg-transparent outline-none text-sm text-slate-900 placeholder:text-slate-400"
        {...props}
      />
    </div>
  );
};
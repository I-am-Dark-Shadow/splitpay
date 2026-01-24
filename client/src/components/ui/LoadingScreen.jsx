import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white">
      
      {/* Lottie Animation Container */}
      <div className="w-48 h-48 mb-2">
        <DotLottieReact
          src="/Sandy Loading.lottie"
          loop
          autoplay
        />
      </div>
      
      {/* Loading Text */}
      <div className="text-slate-500 text-sm font-semibold animate-pulse">
        Loading...
      </div>
    </div>
  );
}
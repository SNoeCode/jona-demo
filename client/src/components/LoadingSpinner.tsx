export default function LoadingSpinner() {
  return (
    <div className="relative w-20 h-20 mx-auto">
      {/* Outer Ring */}
      <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 animate-spin shadow-[0_0_12px_#3b82f6]" />

      {/* Middle Ring */}
      <div className="absolute top-2 left-2 w-16 h-16 rounded-full border-4 border-t-blue-400 animate-spin shadow-[0_0_8px_#60a5fa] animate-[spin_1.5s_linear_infinite]" />

      {/* Inner Ring */}
      <div className="absolute top-4 left-4 w-12 h-12 rounded-full border-4 border-t-blue-300 animate-spin shadow-[0_0_4px_#93c5fd] animate-[spin_2s_linear_infinite]" />

      {/* Core Dot */}
      <div className="absolute top-8 left-8 w-4 h-4 bg-blue-500 rounded-full shadow-[0_0_10px_#3b82f6]" />
    </div>
  );
}
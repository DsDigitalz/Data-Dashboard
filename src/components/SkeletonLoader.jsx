import React from "react";

// Threat List Row Skeletons (Cybersecurity Dashboard)
export function ThreatSkeleton({ count = 6 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-zinc-900/40 border border-zinc-800/40 rounded-xl p-5 flex items-center gap-4 animate-pulse"
          style={{ opacity: 1 - i * 0.12 }}
        >
          <div className="w-2 h-10 rounded-full bg-zinc-850" />
          <div className="flex-1 space-y-2">
            <div className="flex gap-2">
              <div className="h-4 w-32 bg-zinc-850 rounded" />
              <div className="h-4 w-16 bg-zinc-850 rounded-full" />
              <div className="h-4 w-20 bg-zinc-850 rounded" />
            </div>
            <div className="h-3 w-4/5 bg-zinc-850/70 rounded" />
            <div className="h-3 w-3/5 bg-zinc-850/50 rounded" />
          </div>
          <div className="h-8 w-24 bg-zinc-850 rounded-xl flex-shrink-0" />
        </div>
      ))}
    </div>
  );
}

// Weather Climate Cards & Diagnostics Skeletons
export function WeatherSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
      {/* Left Column Card Skeletons */}
      <div className="space-y-6 lg:col-span-1">
        <div className="bg-zinc-900/40 border border-zinc-850 rounded-2xl p-6 min-h-[17.5rem] flex flex-col justify-between">
          <div className="flex justify-between">
            <div className="h-3 w-28 bg-zinc-850 rounded" />
            <div className="h-4 w-16 bg-zinc-850 rounded" />
          </div>
          <div className="my-6 flex items-center gap-4">
            <div className="w-14 h-14 bg-zinc-850 rounded-2xl" />
            <div className="space-y-2 flex-1">
              <div className="h-6 w-32 bg-zinc-850 rounded" />
              <div className="h-3.5 w-20 bg-zinc-850 rounded" />
            </div>
          </div>
          <div className="flex justify-between items-end">
            <div>
              <div className="h-10 w-24 bg-zinc-850 rounded" />
              <div className="h-3 w-32 bg-zinc-850 rounded mt-2" />
            </div>
            <div className="w-16 h-8 bg-zinc-850 rounded" />
          </div>
        </div>

        {/* 4 diagnostic cards */}
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="border border-zinc-850 bg-zinc-900/30 rounded-2xl p-4 min-h-[95px] flex flex-col justify-between">
              <div className="flex justify-between">
                <div className="h-3 w-16 bg-zinc-850 rounded" />
                <div className="w-4 h-4 bg-zinc-850 rounded-full" />
              </div>
              <div>
                <div className="h-5 w-20 bg-zinc-850 rounded" />
                <div className="h-2.5 w-12 bg-zinc-850/60 rounded mt-1.5" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Column Charts & Forecasts Skeletons */}
      <div className="space-y-6 lg:col-span-2">
        <div className="bg-zinc-900/40 border border-zinc-850 rounded-2xl p-6 min-h-[190px] flex flex-col justify-between">
          <div className="h-4 w-44 bg-zinc-850 rounded" />
          <div className="h-24 bg-zinc-900/20 border border-dashed border-zinc-800 rounded-xl flex items-center justify-center">
            <div className="h-2 w-1/3 bg-zinc-850 rounded" />
          </div>
          <div className="h-3.5 w-32 bg-zinc-850 rounded" />
        </div>

        {/* 7-day outlook list */}
        <div className="bg-zinc-900/40 border border-zinc-850 rounded-2xl p-6 space-y-4">
          <div className="h-4 w-36 bg-zinc-850 rounded" />
          <div className="space-y-3.5 pt-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-zinc-850/40">
                <div className="h-3.5 w-14 bg-zinc-850 rounded" />
                <div className="h-6 w-24 bg-zinc-850 rounded-lg" />
                <div className="h-3.5 w-10 bg-zinc-850 rounded" />
                <div className="h-4 w-12 bg-zinc-850 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Tech News Card Grid Skeletons
export function NewsSkeleton({ count = 12 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-zinc-900/40 border border-zinc-850 rounded-2xl p-4 flex flex-col min-h-[350px] justify-between"
          style={{ opacity: 1 - (i % 4) * 0.15 }}
        >
          {/* Image placeholder */}
          <div className="aspect-video w-full bg-zinc-850 rounded-xl mb-3" />
          
          <div className="space-y-3 flex-1 flex flex-col justify-start">
            {/* Meta */}
            <div className="flex gap-2">
              <div className="h-3.5 w-16 bg-zinc-850 rounded" />
              <div className="h-3.5 w-10 bg-zinc-850 rounded" />
            </div>
            
            {/* Title */}
            <div className="space-y-1.5 mt-1">
              <div className="h-4 w-full bg-zinc-850 rounded" />
              <div className="h-4 w-11/12 bg-zinc-850 rounded" />
            </div>

            {/* Description lines */}
            <div className="space-y-1 mt-2">
              <div className="h-3 w-full bg-zinc-850/60 rounded" />
              <div className="h-3 w-4/5 bg-zinc-850/50 rounded" />
              <div className="h-3 w-3/4 bg-zinc-850/40 rounded" />
            </div>
          </div>
          
          {/* Action Footer */}
          <div className="border-t border-zinc-850/60 pt-3 mt-4 flex items-center justify-between">
            <div className="h-3.5 w-20 bg-zinc-850/70 rounded" />
            <div className="w-4 h-4 bg-zinc-850 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

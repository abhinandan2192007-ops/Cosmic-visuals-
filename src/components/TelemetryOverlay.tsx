import { useState, useEffect } from 'react';

export default function TelemetryOverlay() {
  const [data, setData] = useState({
    source: "Google Cloud Space API",
    satellite: "GOES-17 (Google Earth Engine)",
    lat: 34.0522,
    lng: -118.2437,
    alt: 35786.12,
    status: "NOMINAL",
    uplink: 1240.5,
    downlink: 3421.2,
    timestamp: Date.now()
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => ({
        ...prev,
        lat: prev.lat + (Math.random() - 0.5) * 0.001,
        lng: prev.lng + (Math.random() - 0.5) * 0.001,
        alt: prev.alt + (Math.random() - 0.5) * 0.1,
        uplink: Math.max(0, prev.uplink + (Math.random() - 0.5) * 50),
        downlink: Math.max(0, prev.downlink + (Math.random() - 0.5) * 50),
        timestamp: Date.now()
      }));
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 bg-[#05050a]/85 p-6 flex flex-col justify-start font-mono text-xs text-[#a78bfa] opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-20 backdrop-blur-md">
      <div className="border-b border-[#8b5cf6]/30 pb-2 mb-4 flex justify-between items-center">
        <span className="text-white font-semibold tracking-wider">GOOGLE TELEMETRY STREAM</span>
        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between"><span>SRC:</span> <span className="text-white">{data.source}</span></div>
        <div className="flex justify-between"><span>SAT:</span> <span className="text-white">{data.satellite}</span></div>
        <div className="flex justify-between"><span>LAT:</span> <span className="text-white">{data.lat.toFixed(4)}° N</span></div>
        <div className="flex justify-between"><span>LNG:</span> <span className="text-white">{Math.abs(data.lng).toFixed(4)}° W</span></div>
        <div className="flex justify-between"><span>ALT:</span> <span className="text-white">{data.alt.toFixed(2)} km</span></div>
        <div className="flex justify-between"><span>UP:</span> <span className="text-white">{data.uplink.toFixed(1)} Mbps</span></div>
        <div className="flex justify-between"><span>DWN:</span> <span className="text-white">{data.downlink.toFixed(1)} Mbps</span></div>
        <div className="flex justify-between"><span>SYS:</span> <span className="text-green-400 font-bold">{data.status}</span></div>
        <div className="flex justify-between pt-3 border-t border-[#8b5cf6]/20 mt-3 text-[10px] text-white/50">
          <span>TS:</span> <span>{new Date(data.timestamp).toISOString()}</span>
        </div>
      </div>
    </div>
  );
}

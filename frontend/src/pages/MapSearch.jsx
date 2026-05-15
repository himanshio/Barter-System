import { useState } from 'react';
import { motion } from 'framer-motion';
import { Map, Search, SlidersHorizontal, User } from 'lucide-react';

const MapSearch = () => {
    const [radius, setRadius] = useState(10); // in km

    return (
        <div className="h-[calc(100vh-120px)] flex gap-6 relative">

            {/* Sidebar Filters */}
            <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="w-80 glass-dark rounded-3xl p-6 flex flex-col z-10 shadow-2xl shrink-0"
            >
                <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
                    <Map className="w-6 h-6 text-primary" /> Map View
                </h2>

                <div className="space-y-6">
                    <div>
                        <label className="text-sm text-slate-200 font-semibold uppercase tracking-wider mb-3 block">Search Skill</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                            <input type="text" placeholder="e.g. Yoga, React..." className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:border-primary/50 outline-none" />
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <label className="text-sm text-slate-200 font-semibold uppercase tracking-wider">Search Radius</label>
                            <span className="text-primary font-bold">{radius} km</span>
                        </div>
                        <input
                            type="range"
                            min="1" max="50"
                            value={radius}
                            onChange={(e) => setRadius(e.target.value)}
                            className="w-full accent-primary"
                        />
                    </div>

                    <div>
                        <label className="text-sm text-slate-200 font-semibold uppercase tracking-wider mb-3 block">Filters</label>
                        <div className="flex gap-2">
                            <button className="flex-1 py-2 bg-primary/20 text-primary border border-primary/30 rounded-lg text-sm font-bold">Barter</button>
                            <button className="flex-1 py-2 bg-white/5 text-slate-200 border border-white/10 rounded-lg text-sm font-bold">Paid</button>
                        </div>
                    </div>

                    <button className="w-full py-4 mt-auto rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-bold flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] transition-transform">
                        <SlidersHorizontal className="w-5 h-5" /> Apply Filters
                    </button>
                </div>
            </motion.div>

            {/* Main Map Area (God Level UI Mockup for Map container) */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="flex-1 rounded-3xl bg-slate-900 border border-white/10 relative overflow-hidden"
            >
                {/* Placeholder for Google Map API Integration */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 via-transparent to-primary/10"></div>

                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-xl border border-white/10 text-white px-6 py-3 rounded-full text-sm font-semibold shadow-2xl flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    Searching for Barter buddies near you...
                </div>

            </motion.div>

        </div>
    );
};

export default MapSearch;

import { Link } from 'react-router-dom';
import { Twitter, Instagram, Github, Mail, Heart } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="w-full relative overflow-hidden mt-20 border-t border-white/10 glass-dark">
            {/* Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            <div className="absolute -bottom-40 opacity-30 left-1/2 -translate-x-1/2 w-full max-w-4xl h-64 bg-primary/20 blur-[120px] rounded-full pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">

                    {/* Brand Section */}
                    <div className="col-span-1 md:col-span-2 space-y-4">
                        <Link to="/" className="flex items-center gap-2 group w-max">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/30 group-hover:scale-105 transition-transform">
                                S
                            </div>
                            <span className="font-extrabold text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                                SkillSwap
                            </span>
                        </Link>
                        <p className="text-slate-400 leading-relaxed max-w-sm">
                            The hyper-local matching engine for skills. Trade your expertise, earn credits, and democratize education within your community.
                        </p>
                        <div className="flex items-center gap-4 pt-4">
                            <a href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-all hover:scale-110">
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-all hover:scale-110">
                                <Instagram className="w-5 h-5" />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-all hover:scale-110">
                                <Github className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Links */}
                    <div className="space-y-4">
                        <h4 className="font-bold text-white text-lg">Platform</h4>
                        <ul className="space-y-2">
                            <li><Link to="/explore" className="text-slate-400 hover:text-primary transition-colors text-sm">Explore Skills</Link></li>
                            <li><Link to="/map" className="text-slate-400 hover:text-primary transition-colors text-sm">Community Map</Link></li>
                            <li><Link to="/wallet" className="text-slate-400 hover:text-primary transition-colors text-sm">Credit Wallet</Link></li>
                            <li><Link to="/register" className="text-slate-400 hover:text-primary transition-colors text-sm">Join Network</Link></li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div className="space-y-4">
                        <h4 className="font-bold text-white text-lg">Legal</h4>
                        <ul className="space-y-2">
                            <li><a href="#" className="text-slate-400 hover:text-primary transition-colors text-sm">Privacy Policy</a></li>
                            <li><a href="#" className="text-slate-400 hover:text-primary transition-colors text-sm">Terms of Service</a></li>
                            <li><a href="#" className="text-slate-400 hover:text-primary transition-colors text-sm">Trust & Safety</a></li>
                            <li><a href="#" className="text-slate-400 hover:text-primary transition-colors text-sm">Contact Us</a></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-slate-500 text-sm">
                        &copy; {new Date().getFullYear()} SkillSwap Inc. All rights reserved.
                    </p>
                    <p className="text-slate-500 text-sm flex items-center gap-1">
                        Built with <Heart className="w-4 h-4 text-red-500 fill-red-500 mx-1" /> for the community
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;

import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Compass, Zap, Shield, Users } from 'lucide-react';
import { useSelector } from 'react-redux';
import Footer from '../components/Footer';

const Home = () => {
    const { userInfo } = useSelector((state) => state.auth);
    return (
        <div className="min-h-screen relative flex flex-col items-center pt-20">

            {/* Background Gradients */}
            <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/30 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] bg-secondary/20 blur-[120px] rounded-full pointer-events-none" />

            {/* Hero Section */}
            <div className="flex flex-col lg:flex-row items-center justify-between z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-12 gap-12 lg:gap-20">

                {/* Text Content */}
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.7, delay: 0.2 }}
                    className="flex-1 text-left"
                >
                    <span className="px-4 py-1.5 rounded-full border border-white/20 bg-white/10 text-sm font-semibold tracking-wide shadow-xl shadow-primary/10 inline-block mb-6 backdrop-blur-md">
                        ✨ Hyperlocal AI Skill Matching
                    </span>

                    <h1 className="text-5xl lg:text-7xl font-black tracking-tighter mb-6 leading-[1.1]">
                        Trade Skills. <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-br from-primary via-purple-400 to-secondary">
                            Not Dollars.
                        </span>
                    </h1>

                    <p className="text-lg text-slate-300 mb-10 max-w-lg font-light leading-relaxed">
                        Connect with talented people near you. Teach what you know, learn what you don't.
                        Barter your expertise or use community credits in a secure, trusted environment.
                    </p>

                    <div className="flex flex-col sm:flex-row items-start gap-4">
                        {userInfo ? (
                            <Link to="/explore" className="w-full sm:w-auto px-8 py-4 bg-white text-black font-bold rounded-full hover:scale-105 transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)] text-lg text-center flex items-center justify-center gap-2">
                                <Compass className="w-5 h-5" /> Continue Exploring
                            </Link>
                        ) : (
                            <>
                                <Link to="/register" className="w-full sm:w-auto px-8 py-4 bg-white text-black font-bold rounded-full hover:scale-105 transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)] text-lg text-center">
                                    Join the Network
                                </Link>
                                <Link to="/explore" className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/20 text-white font-bold rounded-full hover:bg-white/10 transition-all backdrop-blur-sm text-lg flex items-center justify-center gap-2">
                                    <Compass className="w-5 h-5" /> Explore Skills
                                </Link>
                            </>
                        )}
                    </div>
                </motion.div>

                {/* Hero Image / Illustration */}
                <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.7, delay: 0.4 }}
                    className="flex-1 w-full max-w-lg lg:max-w-none relative"
                >
                    <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-3xl blur-3xl transform rotate-6 scale-105" />
                    <div className="glass-dark border border-white/10 rounded-[2.5rem] p-4 relative z-10 shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-500 overflow-hidden group">
                        <img
                            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
                            alt="People trading skills"
                            className="w-full h-[400px] object-cover rounded-3xl group-hover:scale-105 transition-transform duration-700 opacity-90"
                        />
                        <div className="absolute bottom-10 left-10 right-10 p-6 glass border border-white/20 rounded-2xl shadow-2xl">
                            <div className="flex items-center gap-4">
                                <div className="flex -space-x-4">
                                    <img className="w-12 h-12 rounded-full border-2 border-background-dark" src="https://i.pravatar.cc/100?img=1" alt="User" />
                                    <img className="w-12 h-12 rounded-full border-2 border-background-dark" src="https://i.pravatar.cc/100?img=2" alt="User" />
                                </div>
                                <div>
                                    <p className="text-white font-bold">Guitar for React.js</p>
                                    <p className="text-emerald-400 text-sm font-semibold">Match found 2km away</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-32 z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
                {[
                    { icon: Zap, title: "AI Skill Matching", desc: "Our algorithm finds the perfect skill-trade partner near you instantly.", color: "text-yellow-400" },
                    { icon: Shield, title: "Verified Trust", desc: "Escrow credits and community ratings ensure every interaction is safe.", color: "text-emerald-400" },
                    { icon: Users, title: "Hyperlocal Map", desc: "Discover talent within your 20km radius using our interactive map.", color: "text-blue-400" }
                ].map((feat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 + (i * 0.1) }}
                        className="p-8 rounded-3xl glass-dark hover:border-white/20 transition-all group"
                    >
                        <div className={`w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-6 border border-white/5 group-hover:scale-110 transition-transform ${feat.color}`}>
                            <feat.icon className="w-7 h-7" />
                        </div>
                        <h3 className="text-xl font-bold mb-3">{feat.title}</h3>
                        <p className="text-slate-200 font-light leading-relaxed">{feat.desc}</p>
                    </motion.div>
                ))}
            </div>

            <Footer />
        </div>
    );
};

export default Home;

import { motion } from 'framer-motion';
import { Users, AlertTriangle, TrendingUp, Activity, MoreHorizontal, CheckCircle, XCircle } from 'lucide-react';

const Admin = () => {
    return (
        <div className="space-y-8 pb-12">

            <div className="flex justify-between items-center bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md">
                <div>
                    <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Admin Command Center</h2>
                    <p className="text-slate-200 font-medium">Platform analytics & risk management</p>
                </div>
                <div className="px-5 py-2 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30 flex items-center gap-2 shadow-lg shadow-emerald-500/10">
                    <Activity className="w-5 h-5 animate-pulse" /> System Healthy
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { icon: Users, label: 'Total Users', val: '12,482', change: '+14%', color: 'from-blue-500 to-cyan-400' },
                    { icon: TrendingUp, label: 'Active Barters', val: '3,841', change: '+22%', color: 'from-emerald-500 to-teal-400' },
                    { icon: Activity, label: 'Daily Credits', val: '84k cR', change: '+5%', color: 'from-primary to-indigo-500' },
                    { icon: AlertTriangle, label: 'Reported Users', val: '12', change: '-2', color: 'from-red-500 to-orange-400' }
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="glass-dark p-6 rounded-3xl border border-white/10 relative overflow-hidden group"
                    >
                        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.color} blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity`} />
                        <div className="relative z-10">
                            <stat.icon className="w-8 h-8 text-white mb-4 opacity-80" />
                            <h4 className="text-3xl font-black mb-1">{stat.val}</h4>
                            <p className="text-sm font-semibold text-slate-200 tracking-wide uppercase">{stat.label}</p>
                            <div className="mt-4 text-sm font-bold text-emerald-400 flex items-center gap-1">
                                {stat.change} <span className="text-slate-300 font-medium">this week</span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Flagged Users Table */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="glass rounded-3xl p-8 border border-white/10"
            >
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <AlertTriangle className="text-red-400" /> Flagged For Review
                </h3>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/10 text-slate-200 text-sm uppercase tracking-wider">
                                <th className="pb-4 font-semibold">User</th>
                                <th className="pb-4 font-semibold">Trust Score</th>
                                <th className="pb-4 font-semibold">Report Reason</th>
                                <th className="pb-4 font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                { name: 'John Doe', trust: 42, reason: 'Failed to show up for barter', avatar: '1' },
                                { name: 'Alice Smith', trust: 30, reason: 'Inappropriate messages', avatar: '2' },
                                { name: 'Mike Ross', trust: 55, reason: 'Fake skill listed', avatar: '3' },
                            ].map((user, i) => (
                                <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                                    <td className="py-4 flex items-center gap-3">
                                        <img src={`https://i.pravatar.cc/150?img=${user.avatar}`} className="w-10 h-10 rounded-full" />
                                        <span className="font-bold">{user.name}</span>
                                    </td>
                                    <td className="py-4">
                                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${user.trust < 40 ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'}`}>
                                            {user.trust}%
                                        </span>
                                    </td>
                                    <td className="py-4 text-slate-300 text-sm">{user.reason}</td>
                                    <td className="py-4">
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-2 text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition-colors" title="Resolve"><CheckCircle className="w-5 h-5" /></button>
                                            <button className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors" title="Ban"><XCircle className="w-5 h-5" /></button>
                                            <button className="p-2 text-slate-200 hover:bg-white/10 rounded-lg transition-colors" title="More"><MoreHorizontal className="w-5 h-5" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>

        </div>
    );
};

export default Admin;

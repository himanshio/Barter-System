import { useState } from "react";
import { motion } from "framer-motion";
import {
  Wallet as WalletIcon,
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  ShieldCheck,
  History,
  Zap,
} from "lucide-react";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";

const Wallet = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const [amount, setAmount] = useState(50);

  const transactions = [];

  // Real Stripe payment handler
  const handleBuyCredits = (amount, price) => {
    const stripeUrl = "https://buy.stripe.com/test_8wM5mj0yoeJe2be8ww";

    // Debug logging
    console.log("Amount:", amount);
    console.log("Price:", price);
    console.log("Amount in cents:", amount * 100);

    // Try multiple URL formats
    const urls = [
      `${stripeUrl}?amount=${amount * 100}`,
      `${stripeUrl}/?amount=${amount * 100}`,
      `${stripeUrl}?checkout_amount=${amount * 100}`,
      `${stripeUrl}?payment_amount=${amount * 100}`,
    ];

    console.log("Trying URLs:", urls);

    // Method 1: Direct window.open
    try {
      const newWindow = window.open(urls[0], "_blank", "width=800,height=600");
      if (newWindow) {
        console.log("Window opened successfully");
        toast.success(`Purchasing ${amount} SkillSwap Credits...`);
        return;
      }
    } catch (error) {
      console.error("Method 1 failed:", error);
    }

    // Method 2: Direct location change
    try {
      console.log("Trying direct redirect...");
      window.location.href = urls[0];
    } catch (error) {
      console.error("Method 2 failed:", error);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Credit Display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 glass-dark rounded-3xl p-8 relative overflow-hidden border border-white/10"
        >
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-500/20 blur-[80px] rounded-full pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                <WalletIcon className="w-6 h-6 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold">Total Balance</h2>
            </div>

            <div className="flex items-end gap-3 mb-8">
              <span className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-emerald-400 to-teal-200">
                250
              </span>
              <span className="text-xl text-slate-200 font-semibold mb-2">
                Credits
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                <div className="text-slate-200 text-sm mb-1 flex items-center gap-1">
                  <ArrowUpRight className="w-4 h-4 text-emerald-400" /> Earned
                </div>
                <div className="text-xl font-bold">
                  1,240 <span className="text-sm text-slate-300">cR</span>
                </div>
              </div>
              <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                <div className="text-slate-200 text-sm mb-1 flex items-center gap-1">
                  <ArrowDownLeft className="w-4 h-4 text-red-400" /> Spent
                </div>
                <div className="text-xl font-bold">
                  990 <span className="text-sm text-slate-300">cR</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Add Credits (Stripe) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full md:w-96 glass-dark rounded-3xl p-8 border border-white/10"
        >
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" /> Buy SkillSwap
            Credits
          </h3>

          <div className="space-y-6">
            <div>
              <label className="text-sm text-slate-200 font-semibold mb-2 block">
                Select Credits (1 Credit = $1)
              </label>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[20, 50, 100].map((val) => (
                  <button
                    key={val}
                    onClick={() => setAmount(val)}
                    className={`py-2 rounded-xl border text-sm font-bold transition-all ${amount === val ? "bg-primary/20 border-primary text-primary-light" : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"}`}
                  >
                    {val} cR
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-4 px-4 text-2xl font-black text-center focus:outline-none focus:border-primary/50 text-white"
              />
            </div>

            <button
              onClick={() => handleBuyCredits(amount, 1)}
              className="w-full py-4 rounded-xl bg-white text-black font-bold text-lg hover:bg-slate-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center justify-center gap-2"
            >
              Purchase {amount} SkillSwap Credits{" "}
              <ShieldCheck className="w-5 h-5" />
            </button>
            <p className="text-center text-xs text-slate-300">
              Secured via Stripe for SkillSwap
            </p>
          </div>
        </motion.div>
      </div>

      {/* Transaction History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-3xl p-8 border border-white/10"
      >
        <h3 className="text-xl font-bold mb-6">Recent Transactions</h3>

        <div className="space-y-4">
          {transactions.length === 0 ? (
            <div className="text-center text-slate-400 py-6 bg-white/5 rounded-2xl border border-white/5">
              <p>No recent transactions</p>
            </div>
          ) : (
            transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors border border-white/5"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === "earned" ? "bg-emerald-500/20 text-emerald-400" : tx.type === "bought" ? "bg-primary/20 text-primary-light" : "bg-red-500/20 text-red-400"}`}
                  >
                    {tx.type === "earned" || tx.type === "bought" ? (
                      <ArrowUpRight className="w-5 h-5" />
                    ) : (
                      <ArrowDownLeft className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold">{tx.desc}</h4>
                    <p className="text-sm text-slate-200">{tx.date}</p>
                  </div>
                </div>
                <div
                  className={`text-xl font-bold ${tx.type === "earned" || tx.type === "bought" ? "text-emerald-400" : "text-slate-300"}`}
                >
                  {tx.type === "earned" || tx.type === "bought" ? "+" : "-"}
                  {tx.amount} cR
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Wallet;

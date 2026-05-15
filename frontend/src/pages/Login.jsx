import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { useDispatch } from "react-redux";
import { setCredentials } from "../redux/authSlice";
import api from "../utils/axios.js";
import toast from "react-hot-toast";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // In real app, this goes to backend:
      const res = await api.post("/api/auth/login", {
        email,
        password,
      });
      dispatch(setCredentials(res.data));
      localStorage.setItem("token", res.data.token);
      toast.success("Welcome back!", { icon: "👋" });
      navigate("/explore");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center relative">
      <div className="absolute inset-0 bg-primary/10 blur-[150px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md p-8 sm:p-10 glass-dark rounded-3xl shadow-2xl border border-white/10 z-10"
      >
        <div className="text-center mb-8">
          <h2 className="text-4xl font-black mb-2 tracking-tight">
            Welcome Back
          </h2>
          <p className="text-slate-200 font-light">
            Sign in to continue your journey
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-200 group-focus-within:text-primary transition-colors" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-slate-300"
            />
          </div>

          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-200 group-focus-within:text-primary transition-colors" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-slate-300"
            />
          </div>

          <div className="flex justify-end">
            <a
              href="#"
              className="text-sm text-primary hover:text-white transition-colors"
            >
              Forgot Password?
            </a>
          </div>

          <button
            disabled={loading}
            type="submit"
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-secondary text-white font-bold text-lg hover:scale-[1.02] transition-transform shadow-lg shadow-primary/25 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:hover:scale-100"
          >
            {loading ? "Signing in..." : "Sign In"}
            {!loading && (
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            )}
          </button>
        </form>

        <p className="text-center text-slate-200 mt-8 text-sm">
          Don't have an account?{" "}
          <Link to="/register" className="text-white font-bold hover:underline">
            Join now
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;

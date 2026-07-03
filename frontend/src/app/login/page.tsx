"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight } from "lucide-react";
import { motion } from "motion/react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const router = useRouter();
  const { login: loginStore, initialize } = useAuthStore();

  React.useEffect(() => {
    initialize();
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    
    if (token && role) {
      if (role.toLowerCase() === 'worker') {
        router.push("/workforce");
      } else {
        router.push("/");
      }
    } else {
      setCheckingAuth(false);
    }
  }, [initialize, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error("Please enter both username and password");
      return;
    }

    setLoading(true);
    try {
      const data = await authApi.login(username, password);
      loginStore(data.access_token, data.refresh_token, data.username, data.role);
      toast.success("Successfully logged in");
      if (data.role?.toLowerCase() === 'worker') {
        router.push("/workforce");
      } else {
        router.push("/");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Invalid credentials. Try admin / admin123");
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-xl font-display font-bold text-foreground">FOXFLOW</h2>
        <p className="text-sm text-muted-foreground animate-pulse">Restoring session...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full flex bg-background overflow-hidden font-body">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px] mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-secondary/20 blur-[120px] mix-blend-screen pointer-events-none" />

      {/* Left side: Branding / Illustration */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-card/30 glass-effect border-r border-border/50 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-primary-foreground" stroke="currentColor" strokeWidth={2}>
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="font-display font-black text-2xl tracking-tighter text-foreground">FOXFLOW</span>
          </div>

          <h1 className="text-5xl font-display font-bold leading-tight tracking-tight mt-10">
            Intelligent <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
              Manufacturing
            </span> <br />
            Command Center
          </h1>
          <p className="text-lg text-muted-foreground mt-6 max-w-md leading-relaxed">
            Unify your factory floor, streamline production workflows, and execute dispatch operations with pinpoint precision.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-sm text-muted-foreground/60"
        >
          &copy; {new Date().getFullYear()} FoxFlow ERP v1.0. All rights reserved.
        </motion.div>
      </div>

      {/* Right side: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative z-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="w-full max-w-[420px]"
        >
          {/* Mobile Header (Hidden on Desktop) */}
          <div className="flex lg:hidden items-center justify-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-primary-foreground" stroke="currentColor" strokeWidth={2}>
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="font-display font-black text-2xl tracking-tighter text-foreground">FOXFLOW</span>
          </div>

          <div className="bg-card/60 glass-effect border border-border/50 rounded-2xl p-8 shadow-elevated">
            <h2 className="text-2xl font-display font-bold mb-2">Welcome Back</h2>
            <p className="text-muted-foreground text-sm mb-8">Enter your operator credentials to access the system.</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Username</label>
                <div className="relative">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. admin"
                    className="w-full bg-background border border-border rounded-xl px-4 py-3.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-smooth"
                    suppressHydrationWarning
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Password</label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-background border border-border rounded-xl px-4 py-3.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-smooth"
                    suppressHydrationWarning
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button 
                  type="submit" 
                  className="w-full h-12 rounded-xl text-base font-semibold group transition-all duration-300 hover:shadow-lg hover:shadow-primary/25" 
                  disabled={loading}
                  suppressHydrationWarning
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Authenticating
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </div>
            </form>

            <div className="mt-8 pt-6 border-t border-border/50">
              <div className="rounded-lg bg-primary/5 border border-primary/10 p-4">
                <p className="text-xs text-muted-foreground leading-relaxed text-center">
                  Seed accounts for demo: <br/>
                  <strong className="text-foreground">admin / admin123</strong> or <strong className="text-foreground">operator / operator123</strong>
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

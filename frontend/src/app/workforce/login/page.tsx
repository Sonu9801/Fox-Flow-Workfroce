"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Factory, Lock, Phone, UserCircle2, HardHat } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

export default function WorkerKioskLogin() {
  const router = useRouter();
  
  // Form State
  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobileNumber || !password) {
      toast.error("Please enter your credentials.");
      return;
    }

    setLoading(true);
    try {
      const formData = new URLSearchParams();
      formData.append("username", mobileNumber);
      formData.append("password", password);

      const endpoint = "/api/auth/worker-login";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Invalid credentials");
      }

      const data = await res.json();
      
      // Store tokens appropriately
      localStorage.setItem("worker_token", data.access_token);
      localStorage.setItem("worker_refreshToken", data.refresh_token);
      localStorage.setItem("worker_info", JSON.stringify(data));
      toast.success(`Welcome back to the floor, ${data.name || 'Worker'}!`);
      router.push("/workforce");
    } catch (err) {
      toast.error(`Invalid worker credentials. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-zinc-950 dark:to-zinc-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 dark:bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-sm space-y-8 relative z-10"
      >
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-md border border-gray-100 dark:border-zinc-700">
            <Factory size={32} />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">FoxFlow PWA</h1>
          <p className="text-muted-foreground text-sm font-medium">Workforce Management Portal</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-gray-200/60 dark:border-zinc-800 shadow-xl shadow-gray-200/50 dark:shadow-black/20">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mobile" className="text-gray-700 dark:text-gray-300 font-semibold">
                  Employee Mobile Number
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3.5 text-gray-400" size={18} />
                  <Input 
                    id="mobile"
                    type="tel"
                    placeholder="Enter 10-digit number" 
                    className="pl-11 h-14 text-base rounded-2xl bg-gray-50/50 dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 focus-visible:ring-indigo-500"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="pin" className="text-gray-700 dark:text-gray-300 font-semibold">
                  Secure PIN
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 text-gray-400" size={18} />
                  <Input 
                    id="pin"
                    type="password" 
                    placeholder="Enter 4-digit PIN" 
                    className="pl-11 h-14 text-base rounded-2xl bg-gray-50/50 dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 focus-visible:ring-indigo-500"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-14 text-lg font-bold rounded-2xl shadow-md transition-all active:scale-95 bg-blue-600 hover:bg-blue-700 text-white"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center">
                  <span className="animate-spin mr-2 border-2 border-white/20 border-t-white rounded-full w-4 h-4"></span>
                  Authenticating...
                </span>
              ) : (
                "Punch In"
              )}
            </Button>
          </form>
        </div>
        
        <div className="flex flex-col items-center justify-center space-y-4">
          <p className="text-center text-xs text-gray-500 dark:text-gray-400 font-medium">
            Secured by FoxFlow Enterprise Security
          </p>
          <button 
            onClick={() => router.push('/login')}
            className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-2"
          >
            <UserCircle2 size={16} />
            Supervisor / Manager Login
          </button>
        </div>
      </motion.div>
    </div>
  );
}

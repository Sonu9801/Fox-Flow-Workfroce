"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Factory, Lock, Phone } from "lucide-react";
import { toast } from "sonner";
import { motion } from "motion/react";

export default function WorkerLogin() {
  const router = useRouter();
  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobileNumber || !password) {
      toast.error("Please enter mobile number and password/PIN.");
      return;
    }

    setLoading(true);
    try {
      const formData = new URLSearchParams();
      formData.append("username", mobileNumber);
      formData.append("password", password);

      const res = await fetch("/api/auth/worker-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Invalid credentials");
      }

      const data = await res.json();
      localStorage.setItem("worker_token", data.access_token);
      localStorage.setItem("worker_refreshToken", data.refresh_token);
      localStorage.setItem("worker_info", JSON.stringify(data));
      
      toast.success(`Welcome back, ${data.name}`);
      router.push("/workforce");
    } catch (err) {
      toast.error("Login failed. Check your mobile number and PIN.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-8"
      >
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
            <Factory size={32} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">FoxFlow PWA</h1>
          <p className="text-muted-foreground text-sm">Worker Attendance Portal</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6 bg-card p-6 rounded-3xl border border-border shadow-lg">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 text-muted-foreground" size={18} />
                <Input 
                  id="mobile"
                  type="tel"
                  maxLength={10}
                  pattern="\d{10}"
                  title="Enter a 10-digit mobile number"
                  placeholder="Enter 10-digit number" 
                  className="pl-10 h-12 text-lg rounded-xl"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="pin">Password / PIN</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-muted-foreground" size={18} />
                <Input 
                  id="pin"
                  type="password" 
                  placeholder="Enter PIN (Default: 1234)" 
                  className="pl-10 h-12 text-lg rounded-xl"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full h-14 text-lg font-bold rounded-xl shadow-md"
            disabled={loading}
          >
            {loading ? "Verifying..." : "Login to Workforce"}
          </Button>
        </form>
        
        <p className="text-center text-xs text-muted-foreground">
          Contact your supervisor if you cannot login.
        </p>
      </motion.div>
    </div>
  );
}

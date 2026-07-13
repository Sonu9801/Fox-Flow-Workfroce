"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, Mail, ShieldCheck, UserPlus, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

type AuthStep = "email" | "otp" | "register";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regRole, setRegRole] = useState("operator");
  const [regDealerName, setRegDealerName] = useState("");

  const [step, setStep] = useState<AuthStep>("email");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [otpSentEmail, setOtpSentEmail] = useState("");

  const router = useRouter();
  const { login: loginStore, initialize } = useAuthStore();

  const otpRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  React.useEffect(() => {
    initialize();
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (token && role) {
      if (role.toLowerCase() === "worker") {
        router.push("/workforce");
      } else if (role.toLowerCase() === "supervisor") {
        router.push("/workforce/supervisor");
      } else {
        router.push("/");
      }
    } else {
      setCheckingAuth(false);
    }
  }, [initialize, router]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      otpRefs.current[5]?.focus();
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      await authApi.requestOtp(email);
      setOtpSentEmail(email);
      setStep("otp");
      toast.success("OTP sent to your email!");
    } catch (err: any) {
      console.error(err);
      const detail = err.response?.data?.detail || "Failed to send OTP";
      toast.error(detail);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      toast.error("Please enter the complete 6-digit OTP");
      return;
    }

    setLoading(true);
    try {
      const data = await authApi.verifyOtp(otpSentEmail, otpCode);
      loginStore(data.access_token, data.refresh_token, data.email, data.name, data.role);
      toast.success("Successfully signed in!");
      if (data.role?.toLowerCase() === "worker") {
        router.push("/workforce");
      } else if (data.role?.toLowerCase() === "supervisor") {
        router.push("/workforce/supervisor");
      } else {
        router.push("/");
      }
    } catch (err: any) {
      console.error(err);
      const detail = err.response?.data?.detail || "Invalid OTP";
      toast.error(detail);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regEmail || !regName) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      await authApi.register(regEmail, regName, regRole, regRole === "oem" ? regDealerName : undefined);
      toast.success("Account created! You can now sign in.");
      setEmail(regEmail);
      setStep("email");
    } catch (err: any) {
      console.error(err);
      const detail = err.response?.data?.detail || "Registration failed";
      toast.error(detail);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    try {
      await authApi.requestOtp(otpSentEmail);
      setOtp(["", "", "", "", "", ""]);
      toast.success("New OTP sent!");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to resend OTP");
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

      {/* Right side: Auth Form */}
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
            <AnimatePresence mode="wait">
              {/* ─── STEP 1: Email Input ─── */}
              {step === "email" && (
                <motion.div
                  key="email-step"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-display font-bold">Welcome Back</h2>
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm mb-8">Enter your email to receive a one-time verification code.</p>

                  <form onSubmit={handleRequestOtp} className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Email Address</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@company.com"
                        className="w-full bg-background border border-border rounded-xl px-4 py-3.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-smooth"
                        autoFocus
                        suppressHydrationWarning
                      />
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
                            Sending OTP
                          </>
                        ) : (
                          <>
                            Send Verification Code
                            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                          </>
                        )}
                      </Button>
                    </div>
                  </form>

                  <div className="mt-6 pt-6 border-t border-border/50 text-center flex flex-col gap-3">
                    <p className="text-sm text-muted-foreground">
                      Don&apos;t have an account?{" "}
                      <button
                        onClick={() => setStep("register")}
                        className="text-primary font-semibold hover:underline underline-offset-4 transition-colors"
                      >
                        Create one
                      </button>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Are you a worker?{" "}
                      <button
                        onClick={() => router.push("/workforce/login")}
                        className="text-primary font-semibold hover:underline underline-offset-4 transition-colors"
                      >
                        Log in here
                      </button>
                    </p>
                  </div>
                </motion.div>
              )}

              {/* ─── STEP 2: OTP Verification ─── */}
              {step === "otp" && (
                <motion.div
                  key="otp-step"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                >
                  <button
                    onClick={() => { setStep("email"); setOtp(["", "", "", "", "", ""]); }}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>

                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-display font-bold">Verify OTP</h2>
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm mb-8">
                    We sent a 6-digit code to{" "}
                    <strong className="text-foreground">{otpSentEmail}</strong>
                  </p>

                  <form onSubmit={handleVerifyOtp} className="space-y-6">
                    <div className="flex justify-center gap-1.5 sm:gap-2.5" onPaste={handleOtpPaste}>
                      {otp.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={(el) => { otpRefs.current[idx] = el; }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(idx, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                          className="w-10 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-bold bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-smooth"
                          suppressHydrationWarning
                        />
                      ))}
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-12 rounded-xl text-base font-semibold group transition-all duration-300 hover:shadow-lg hover:shadow-primary/25"
                      disabled={loading || otp.join("").length !== 6}
                      suppressHydrationWarning
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Verifying
                        </>
                      ) : (
                        <>
                          Verify & Sign In
                          <ShieldCheck className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </form>

                  <div className="mt-6 text-center">
                    <p className="text-sm text-muted-foreground">
                      Didn&apos;t receive the code?{" "}
                      <button
                        onClick={handleResendOtp}
                        disabled={loading}
                        className="text-primary font-semibold hover:underline underline-offset-4 transition-colors disabled:opacity-50"
                      >
                        Resend OTP
                      </button>
                    </p>
                  </div>
                </motion.div>
              )}

              {/* ─── REGISTER ─── */}
              {step === "register" && (
                <motion.div
                  key="register-step"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                >
                  <button
                    onClick={() => setStep("email")}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Sign In
                  </button>

                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <UserPlus className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-display font-bold">Create Account</h2>
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm mb-8">Register to get started with FoxFlow.</p>

                  <form onSubmit={handleRegister} className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Full Name</label>
                      <input
                        type="text"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full bg-background border border-border rounded-xl px-4 py-3.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-smooth"
                        autoFocus
                        suppressHydrationWarning
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Email Address</label>
                      <input
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="you@company.com"
                        className="w-full bg-background border border-border rounded-xl px-4 py-3.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-smooth"
                        suppressHydrationWarning
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Role</label>
                      <select
                        value={regRole}
                        onChange={(e) => setRegRole(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-4 py-3.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-smooth appearance-none"
                        suppressHydrationWarning
                      >
                        <option value="admin">Admin</option>
                        <option value="operator">Operator</option>
                        <option value="supervisor">Supervisor</option>
                        <option value="oem">OEM / Client</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    </div>

                    <AnimatePresence>
                      {regRole === "oem" && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-2 overflow-hidden"
                        >
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Dealer / Company Name</label>
                          <input
                            type="text"
                            value={regDealerName}
                            onChange={(e) => setRegDealerName(e.target.value)}
                            placeholder="e.g. Tata Motors"
                            required={regRole === "oem"}
                            className="w-full bg-background border border-border rounded-xl px-4 py-3.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-smooth"
                            suppressHydrationWarning
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>

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
                            Creating Account
                          </>
                        ) : (
                          <>
                            Create Account
                            <UserPlus className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

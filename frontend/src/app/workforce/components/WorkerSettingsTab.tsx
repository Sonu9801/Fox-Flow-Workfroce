import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bell, Fingerprint, Globe, Moon, ChevronRight, Loader2, X, Settings, MapPin } from "lucide-react";
import { toast } from "sonner";
import { getTranslation } from "../i18n";
import { useTheme } from "next-themes";

export function WorkerSettingsTab() {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  
  const languages = ["English (US)", "Hindi (हिन्दी)", "Marathi (मराठी)", "Gujarati (ગુજરાતી)", "Bengali (বাংলা)", "Tamil (தமிழ்)", "Telugu (తెలుగు)", "Kannada (ಕನ್ನಡ)"];
  const [langIndex, setLangIndex] = useState(0);
  const [showLangModal, setShowLangModal] = useState(false);

  // Load settings on mount
  useEffect(() => {
    const savedPush = localStorage.getItem("setting_push");
    if (savedPush !== null) setPushEnabled(savedPush === "true");
    
    const savedBio = localStorage.getItem("setting_bio");
    if (savedBio !== null) setBiometricEnabled(savedBio === "true");

    const savedLang = localStorage.getItem("setting_lang");
    if (savedLang !== null) setLangIndex(Number(savedLang));
  }, []);

  const togglePush = async () => {
    const newVal = !pushEnabled;
    if (newVal && "Notification" in window) {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          toast.error("Please allow notifications in your browser settings to use this feature.");
          return;
        }
      } catch (err) {
        toast.error("Notifications are not supported on this device.");
        return;
      }
    }
    setPushEnabled(newVal);
    localStorage.setItem("setting_push", String(newVal));
    toast.success(newVal ? "Push notifications enabled" : "Push notifications disabled");
  };

  const [bioLoading, setBioLoading] = useState(false);
  const toggleBio = async () => {
    setBioLoading(true);
    const newVal = !biometricEnabled;
    
    if (newVal) {
      // Trying to enable Biometrics using actual WebAuthn
      if (window.PublicKeyCredential) {
        try {
          const publicKey: PublicKeyCredentialCreationOptions = {
            challenge: new Uint8Array(32),
            rp: { name: "FoxFlow App", id: window.location.hostname },
            user: {
              id: new Uint8Array(16),
              name: "worker@foxflow.com",
              displayName: "FoxFlow Worker"
            },
            pubKeyCredParams: [{ type: "public-key", alg: -7 }],
            authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required" },
            timeout: 60000,
          };
          await navigator.credentials.create({ publicKey });
          setBiometricEnabled(true);
          localStorage.setItem("setting_bio", "true");
          toast.success("Biometric login successfully connected to your device!");
        } catch (err: any) {
          toast.error("Biometric setup failed or was canceled.");
          console.error(err);
        }
      } else {
        toast.error("Biometrics not supported on this device.");
      }
    } else {
      // Disabling
      setBiometricEnabled(false);
      localStorage.setItem("setting_bio", "false");
      toast.success("Biometric login disabled");
    }
    setBioLoading(false);
  };

  const { theme, setTheme } = useTheme();

  const toggleDark = () => {
    const isDark = theme === "dark";
    setTheme(isDark ? "light" : "dark");
    toast.success(!isDark ? "Dark mode activated!" : "Light mode activated!");
  };

  const selectLanguage = (idx: number) => {
    setLangIndex(idx);
    localStorage.setItem("setting_lang", String(idx));
    setShowLangModal(false);
    toast.success(`Language changed to ${languages[idx]}`);
    window.dispatchEvent(new Event("languageChanged"));
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="p-5 pb-32 max-w-md mx-auto relative transition-colors"
    >
      <div className="mb-6">
        <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{getTranslation(langIndex, "App Settings")}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-1">Manage your app preferences</p>
      </div>

      {/* Premium Gradient Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl p-5 mb-6 text-white shadow-[0_8px_30px_rgba(99,102,241,0.3)]">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-white/20 rounded-2xl backdrop-blur-sm">
            <Settings size={24} className="text-white" />
          </div>
          <h3 className="font-bold text-lg">Your Preferences</h3>
        </div>
        <p className="text-indigo-100 text-sm">Customize FoxFlow to work best for you. Settings are saved locally.</p>
      </div>

      <div className="space-y-6">
        {/* General Settings */}
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-300 mb-3 px-1 uppercase tracking-wider">General</h3>
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden transition-colors">
            
            <div onClick={() => setShowLangModal(true)} className="flex items-center justify-between p-4 border-b border-gray-50 dark:border-zinc-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Globe size={20} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">Language</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{languages[langIndex]}</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-300 dark:text-gray-600" />
            </div>

            <div className="flex items-center justify-between p-4 border-b border-gray-50 dark:border-zinc-800 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Bell size={20} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">Push Notifications</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Job alerts & updates</p>
                </div>
              </div>
              <button 
                onClick={togglePush}
                className={`w-12 h-6 rounded-full transition-colors relative flex items-center ${pushEnabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-zinc-700'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full absolute shadow-sm transition-transform ${pushEnabled ? 'translate-x-[26px]' : 'translate-x-0.5'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 flex items-center justify-center">
                  <Moon size={20} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">Dark Mode</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Eye-friendly dark theme</p>
                </div>
              </div>
              <button 
                onClick={toggleDark}
                className={`w-12 h-6 rounded-full p-1 transition-colors ${theme === 'dark' ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-zinc-700'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>

          </div>
        </div>

        {/* Security Settings */}
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-300 mb-3 px-1 uppercase tracking-wider">Security</h3>
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden transition-colors">
            <div className="flex items-center justify-between p-4 border-b border-gray-50 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center">
                  <Fingerprint size={20} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">Biometric Login</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Face ID / Fingerprint</p>
                </div>
              </div>
              <button 
                onClick={toggleBio}
                disabled={bioLoading}
                className={`w-12 h-6 rounded-full transition-colors relative flex items-center justify-center ${biometricEnabled ? 'bg-green-600' : 'bg-gray-200 dark:bg-zinc-700'}`}
              >
                {bioLoading ? (
                  <Loader2 size={14} className="animate-spin text-white absolute" />
                ) : (
                  <div className={`w-5 h-5 bg-white rounded-full absolute shadow-sm transition-transform left-0 ${biometricEnabled ? 'translate-x-[26px]' : 'translate-x-0.5'}`} />
                )}
              </button>
            </div>

            <div 
              onClick={() => {
                if (!navigator.geolocation) {
                  toast.error("Geolocation not supported by this browser.");
                  return;
                }
                navigator.geolocation.getCurrentPosition(
                  () => toast.success("Location access is granted! You can punch in successfully."),
                  (err) => {
                    if (err.code === err.PERMISSION_DENIED) {
                      toast.error("Location blocked! Click the lock icon 🔒 in the URL bar to allow it.", { duration: 5000 });
                    } else {
                      toast.error("Could not fetch location right now.");
                    }
                  }
                );
              }}
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center">
                  <MapPin size={20} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">Location Access</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Check GPS permission</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-300 dark:text-gray-600" />
            </div>
          </div>
        </div>

        <div className="text-center pt-4">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-600">FoxFlow App Version 1.0.5</p>
        </div>
      </div>

      {/* Language Selection Modal */}
      <AnimatePresence>
        {showLangModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
          >
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-3xl p-6 shadow-2xl border dark:border-zinc-800"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Select Language</h3>
                <button onClick={() => setShowLangModal(false)} className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-full text-gray-500 dark:text-gray-400">
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex flex-col gap-3">
                {languages.map((lang, idx) => (
                  <button 
                    key={idx}
                    onClick={() => selectLanguage(idx)}
                    className={`w-full text-left px-5 py-4 rounded-2xl transition-colors font-semibold ${idx === langIndex ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800' : 'bg-gray-50 dark:bg-zinc-800/50 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800'}`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}

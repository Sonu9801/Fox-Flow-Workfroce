'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Briefcase, Fingerprint, CalendarDays, User } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils'; // Assuming this exists for tailwind classes

const NAV_ITEMS = [
  { href: '/worker', icon: Home, label: 'Home' },
  { href: '/worker/jobs', icon: Briefcase, label: 'My Jobs' },
  { href: '/worker/punch', icon: Fingerprint, label: 'Punch' },
  { href: '/worker/attendance', icon: CalendarDays, label: 'Attendance' },
  { href: '/worker/profile', icon: User, label: 'Profile' },
];

export default function WorkerLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-zinc-950 overflow-hidden">
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-20">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="h-full"
        >
          {children}
        </motion.div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-t border-gray-200 dark:border-zinc-800 safe-area-bottom">
        <div className="flex justify-around items-center h-16 max-w-md mx-auto px-4">
          {NAV_ITEMS.map((item) => {
            // Precise active matching
            const isActive = item.href === '/worker' 
              ? pathname === '/worker'
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors duration-200",
                  isActive ? "text-primary font-semibold" : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="worker-nav-indicator"
                    className="absolute top-0 w-8 h-1 bg-primary rounded-b-full"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <item.icon className={cn("w-5 h-5", isActive ? "stroke-[2.5]" : "stroke-2")} />
                <span className="text-[10px] tracking-wide">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

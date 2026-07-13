'use client';

import { useWorkerDashboard } from './api';
import { 
  Bell, UserCircle, Calendar, Clock, 
  Briefcase, AlertCircle, FileText, LayoutGrid, ArrowRight 
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function WorkerHome() {
  const { data: stats, isLoading } = useWorkerDashboard();

  const QUICK_ACTIONS = [
    { icon: Calendar, label: 'Attendance', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { icon: Clock, label: 'Overtime', color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
    { icon: Calendar, label: 'Sunday Work', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { icon: FileText, label: 'Leave', color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
    { icon: AlertCircle, label: 'Notice Board', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
    { icon: LayoutGrid, label: 'More', color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-zinc-800' },
  ];

  return (
    <div className="p-4 space-y-6 max-w-md mx-auto">
      {/* Hero Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between bg-primary text-primary-foreground rounded-2xl p-5 shadow-lg shadow-primary/20"
      >
        <div className="flex gap-4 items-center">
          <UserCircle className="w-14 h-14 opacity-80" />
          <div>
            <h1 className="text-xl font-semibold tracking-tight">John Doe</h1>
            <p className="text-primary-foreground/70 text-sm">EMP-20394 | General Shift</p>
            <p className="text-primary-foreground/90 text-xs mt-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>
        <button className="relative p-2 bg-primary-foreground/10 rounded-full hover:bg-primary-foreground/20 transition-colors">
          <Bell className="w-6 h-6" />
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-primary" />
        </button>
      </motion.div>

      {/* Quick Actions */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Quick Actions</h2>
        <div className="grid grid-cols-3 gap-3">
          {QUICK_ACTIONS.map((action, i) => (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white dark:bg-zinc-900 border shadow-sm hover:shadow-md transition-shadow active:scale-95"
            >
              <div className={`p-2.5 rounded-full ${action.bg}`}>
                <action.icon className={`w-5 h-5 ${action.color}`} />
              </div>
              <span className="text-[11px] font-medium text-center leading-tight">{action.label}</span>
            </motion.button>
          ))}
        </div>
      </section>

      {/* Today's Summary */}
      <section>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-indigo-50 to-white dark:from-zinc-900 dark:to-zinc-950 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-indigo-900 dark:text-indigo-200">Today's Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Punch In</p>
                <p className="text-lg font-semibold">09:02 AM</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Working Hours</p>
                <p className="text-lg font-semibold">03:45 <span className="text-sm font-normal text-muted-foreground">hrs</span></p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Today's OT</p>
                <p className="text-lg font-semibold text-orange-600">00:00 <span className="text-sm font-normal text-muted-foreground">hrs</span></p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Break Time</p>
                <p className="text-lg font-semibold text-blue-600">00:45 <span className="text-sm font-normal text-muted-foreground">hrs</span></p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Assigned Work Summary */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Assigned Work</h2>
          <Button variant="ghost" size="sm" className="h-8 text-xs" asChild>
            <Link href="/worker/jobs">
              View All <ArrowRight className="ml-1 w-3 h-3" />
            </Link>
          </Button>
        </div>
        <Card className="border shadow-sm">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-5 grid grid-cols-2 gap-4"><Skeleton className="h-10 w-full"/><Skeleton className="h-10 w-full"/></div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 border-b">
                <div className="p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats?.total_assigned_jobs || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">Total</p>
                </div>
                <div className="p-4 text-center">
                  <p className="text-2xl font-bold text-yellow-600">{stats?.pending_jobs || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">Pending</p>
                </div>
                <div className="p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">{stats?.in_progress_jobs || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">Running</p>
                </div>
                <div className="p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">{stats?.completed_today || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">Completed</p>
                </div>
              </div>
            )}
            <div className="p-3 bg-gray-50 dark:bg-zinc-900/50">
              <Button className="w-full shadow-sm" asChild>
                <Link href="/worker/jobs">Open Production Workflow</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Monthly Summary */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Monthly Stats</h2>
        <Card className="border shadow-sm">
          <CardContent className="p-4">
             {isLoading ? (
                <Skeleton className="h-16 w-full" />
             ) : (
                <div className="flex justify-between items-center text-center">
                  <div>
                    <p className="text-xl font-semibold text-green-600">{stats?.present_days || 0}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-1">Present</p>
                  </div>
                  <div>
                    <p className="text-xl font-semibold text-red-600">{stats?.absent_days || 0}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-1">Absent</p>
                  </div>
                  <div>
                    <p className="text-xl font-semibold text-orange-500">{stats?.leave_days || 0}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-1">Leave</p>
                  </div>
                  <div>
                    <p className="text-xl font-semibold text-blue-600">{stats?.ot_hours || 0}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-1">OT Hrs</p>
                  </div>
                </div>
             )}
          </CardContent>
        </Card>
      </section>
      
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useWorkerJobs, WorkerJob } from '../api';
import { motion, AnimatePresence } from 'motion/react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  MapPin, Calendar, Clock, ChevronRight, User, 
  RefreshCw, Briefcase, AlertTriangle, AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function WorkerJobsPage() {
  const [activeTab, setActiveTab] = useState('All');
  
  const { data: jobs, isLoading, isError, refetch, isRefetching } = useWorkerJobs(activeTab);

  const handleRefresh = async () => {
    try {
      await refetch();
      toast.success('Jobs refreshed successfully');
    } catch {
      toast.error('Failed to refresh jobs');
    }
  };

  if (isError) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] text-center max-w-md mx-auto">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Connection Error</h2>
        <p className="text-muted-foreground text-sm mb-6">We couldn't connect to the server to fetch your jobs. Please check your network and try again.</p>
        <Button onClick={handleRefresh} className="px-6 rounded-full" disabled={isRefetching}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} /> 
          Retry Now
        </Button>
      </div>
    );
  }

  // Calculate summaries from all jobs (if tab is 'All')
  const pendingCount = jobs?.filter(j => j.status === 'assigned' || j.status === 'not_started').length || 0;
  const runningCount = jobs?.filter(j => j.status === 'in_progress').length || 0;
  const completedCount = jobs?.filter(j => j.status === 'completed').length || 0;
  const highPriorityCount = jobs?.filter(j => j.priority?.toLowerCase() === 'high' || j.priority?.toLowerCase() === 'urgent').length || 0;

  return (
    <div className="p-4 space-y-5 max-w-md mx-auto min-h-screen bg-gray-50/50 dark:bg-zinc-950 pb-24">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">My Jobs</h1>
          <p className="text-muted-foreground text-xs mt-0.5">Manage your production workflow</p>
        </div>
        <Button variant="outline" size="icon" className="rounded-full shadow-sm bg-white" onClick={handleRefresh} disabled={isRefetching}>
          <RefreshCw className={`w-4 h-4 text-gray-600 ${isRefetching ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Hero Summary Card */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-600 to-indigo-700 text-white overflow-hidden rounded-2xl">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-blue-50">Today's Workload</h2>
            <Briefcase className="w-5 h-5 text-blue-200 opacity-80" />
          </div>
          <div className="grid grid-cols-4 gap-2 divide-x divide-blue-500/50">
            <div className="text-center">
              <p className="text-2xl font-bold">{isLoading ? '-' : pendingCount}</p>
              <p className="text-[10px] text-blue-200 mt-1 uppercase tracking-wide">Pending</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-100">{isLoading ? '-' : runningCount}</p>
              <p className="text-[10px] text-blue-200 mt-1 uppercase tracking-wide">Running</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-100">{isLoading ? '-' : completedCount}</p>
              <p className="text-[10px] text-blue-200 mt-1 uppercase tracking-wide">Done</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-300">{isLoading ? '-' : highPriorityCount}</p>
              <p className="text-[10px] text-blue-200 mt-1 uppercase tracking-wide">Priority</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="All" onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-4 bg-gray-200/60 dark:bg-zinc-800/60 p-1 rounded-xl">
          <TabsTrigger value="All" className="text-xs rounded-lg data-[state=active]:shadow-sm">All</TabsTrigger>
          <TabsTrigger value="Pending" className="text-xs rounded-lg data-[state=active]:shadow-sm">Pending</TabsTrigger>
          <TabsTrigger value="In_Progress" className="text-xs rounded-lg data-[state=active]:shadow-sm">Running</TabsTrigger>
          <TabsTrigger value="Completed" className="text-xs rounded-lg data-[state=active]:shadow-sm">Done</TabsTrigger>
        </TabsList>
        
        <div className="mt-5">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-48 w-full rounded-2xl" />
              <Skeleton className="h-48 w-full rounded-2xl" />
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {jobs && jobs.length > 0 ? (
                <motion.div className="space-y-4">
                  {jobs.map((job, idx) => (
                    <motion.div
                      key={job.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: idx * 0.05 }}
                      layout
                    >
                      <JobCard job={job} />
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <EmptyState onRefresh={handleRefresh} />
              )}
            </AnimatePresence>
          )}
        </div>
      </Tabs>
    </div>
  );
}

function EmptyState({ onRefresh }: { onRefresh: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }} 
      animate={{ opacity: 1, scale: 1 }} 
      className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white dark:bg-zinc-900 rounded-3xl border shadow-sm mt-4"
    >
      <div className="w-24 h-24 mb-6 relative">
        <div className="absolute inset-0 bg-blue-100 dark:bg-blue-900/30 rounded-full animate-ping opacity-20"></div>
        <div className="relative bg-blue-50 dark:bg-blue-900/20 w-full h-full rounded-full flex items-center justify-center">
          <Briefcase className="w-10 h-10 text-blue-500" />
        </div>
      </div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">No Jobs Assigned</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 max-w-[250px] leading-relaxed">
        Your supervisor hasn't assigned any work to you yet. Assigned jobs will automatically appear here.
      </p>
      <Button onClick={onRefresh} className="px-8 rounded-full bg-gray-900 hover:bg-gray-800 text-white shadow-md">
        <RefreshCw className="w-4 h-4 mr-2" /> Check for updates
      </Button>
    </motion.div>
  );
}

function JobCard({ job }: { job: WorkerJob }) {
  const getStatusStyle = (status: string) => {
    switch(status?.toLowerCase()) {
      case 'in_progress': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'completed': return 'bg-green-50 text-green-700 border-green-200';
      case 'paused': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'assigned': 
      case 'not_started': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getPriorityBadge = (priority: string) => {
    if (!priority) return null;
    const p = priority.toLowerCase();
    if (p === 'urgent') return <Badge className="bg-red-500 text-white text-[10px] hover:bg-red-600 shadow-sm"><AlertTriangle className="w-3 h-3 mr-1"/> Urgent</Badge>;
    if (p === 'high') return <Badge className="bg-orange-500 text-white text-[10px] hover:bg-orange-600 shadow-sm">High</Badge>;
    return <Badge variant="secondary" className="text-[10px]">{priority}</Badge>;
  };

  return (
    <Card className="overflow-hidden border-gray-200/80 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl bg-white dark:bg-zinc-900 group">
      <CardContent className="p-0">
        <div className="p-5 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="font-extrabold text-lg tracking-tight text-gray-900 dark:text-gray-100">
                  {job.job_number || `JOB-${job.id}`}
                </span>
                <Badge variant="outline" className={`px-2 py-0.5 shadow-sm text-[10px] uppercase font-bold ${getStatusStyle(job.status)}`}>
                  {job.status?.replace('_', ' ')}
                </Badge>
              </div>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                {job.customer || 'Internal'} <span className="text-gray-300 mx-1">•</span> {job.stage || 'Production'}
              </p>
            </div>
            {getPriorityBadge(job.priority || '')}
          </div>

          <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-zinc-800/50 p-3 rounded-xl border border-gray-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-white dark:bg-zinc-700 rounded shadow-sm"><MapPin className="w-3.5 h-3.5 text-blue-500" /></div>
              <span className="truncate font-medium">{job.site || 'Main Factory'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-1 bg-white dark:bg-zinc-700 rounded shadow-sm"><Calendar className="w-3.5 h-3.5 text-purple-500" /></div>
              <span className="font-medium">{job.assigned_date ? new Date(job.assigned_date).toLocaleDateString(undefined, {month: 'short', day: 'numeric'}) : 'Today'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-1 bg-white dark:bg-zinc-700 rounded shadow-sm"><User className="w-3.5 h-3.5 text-green-500" /></div>
              <span className="font-medium truncate">Supervisor: Admin</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-1 bg-white dark:bg-zinc-700 rounded shadow-sm"><Clock className="w-3.5 h-3.5 text-orange-500" /></div>
              <span className="font-medium">Est: 4 Hrs</span>
            </div>
          </div>
          
          <div className="space-y-2 pt-1">
            <div className="flex justify-between text-xs font-semibold text-gray-600 dark:text-gray-300">
              <span>Progress</span>
              <span>{job.progress_percent || 0}%</span>
            </div>
            <div className="h-2 w-full bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden shadow-inner">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${job.progress_percent || 0}%` }}
                transition={{ duration: 1, delay: 0.2 }}
                className="h-full bg-blue-600 rounded-full"
              />
            </div>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-zinc-800/50 p-3.5 flex gap-2.5 border-t border-gray-100 dark:border-zinc-800">
          <Button variant="outline" className="flex-1 bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-700 hover:bg-gray-50 shadow-sm font-semibold rounded-xl" asChild>
            <Link href={`/worker/jobs/${job.id}`}>
              Details
            </Link>
          </Button>
          {(job.status === 'not_started' || job.status === 'assigned') && (
            <Button className="flex-1 shadow-sm font-semibold rounded-xl bg-gray-900 hover:bg-gray-800 text-white" asChild>
              <Link href={`/worker/jobs/${job.id}`}>Start Work</Link>
            </Button>
          )}
          {job.status === 'paused' && (
            <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-semibold rounded-xl" asChild>
              <Link href={`/worker/jobs/${job.id}`}>Resume</Link>
            </Button>
          )}
          {job.status === 'in_progress' && (
            <Button className="flex-1 bg-gray-900 hover:bg-gray-800 text-white shadow-sm font-semibold rounded-xl" asChild>
              <Link href={`/worker/jobs/${job.id}`}>
                Continue <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

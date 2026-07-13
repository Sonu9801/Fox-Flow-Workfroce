'use client';

import { useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  useJobDetails, useStartJob, usePauseJob, 
  useResumeJob, useCompleteJob, useUploadProgressPhoto, useUploadCompletionPhoto 
} from '../../api';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft, Play, Pause, CheckCircle2, 
  Camera, Upload, MapPin, Calendar, Clock, 
  FileText, Users, Wrench, ShieldCheck, ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';

export default function JobDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const { data: job, isLoading } = useJobDetails(id);
  const startJob = useStartJob();
  const pauseJob = usePauseJob();
  const resumeJob = useResumeJob();
  const completeJob = useCompleteJob();
  
  const uploadProgress = useUploadProgressPhoto();
  const uploadCompletion = useUploadCompletionPhoto();

  const [expandedSection, setExpandedSection] = useState<string | null>('instructions');
  const [photoType, setPhotoType] = useState<'progress'|'completion' | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleSection = (section: string) => {
    setExpandedSection(prev => prev === section ? null : section);
  };

  const handleStatusChange = async (action: 'start' | 'pause' | 'resume' | 'complete') => {
    try {
      if (action === 'start') await startJob.mutateAsync(Number(id));
      if (action === 'pause') await pauseJob.mutateAsync(Number(id));
      if (action === 'resume') await resumeJob.mutateAsync(Number(id));
      if (action === 'complete') await completeJob.mutateAsync(Number(id));
      toast.success(`Job ${action}ed successfully`);
    } catch (err) {
      toast.error(`Failed to ${action} job`);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !photoType) return;
    const file = e.target.files[0];
    
    // In a real PWA, we'd use navigator.geolocation here
    // For now, we mock GPS coordinates
    const formData = new FormData();
    formData.append('photo', file);
    formData.append('remarks', `Uploaded ${photoType} photo`);
    formData.append('gps_lat', '12.9716');
    formData.append('gps_lng', '77.5946');

    toast.promise(
      photoType === 'progress' 
        ? uploadProgress.mutateAsync({ id: Number(id), formData })
        : uploadCompletion.mutateAsync({ id: Number(id), formData }),
      {
        loading: 'Uploading photo...',
        success: 'Photo uploaded successfully',
        error: 'Failed to upload photo',
      }
    );
    setPhotoType(null);
  };

  if (isLoading) {
    return <div className="p-4 space-y-4 max-w-md mx-auto"><Skeleton className="h-64 w-full" /><Skeleton className="h-48 w-full" /></div>;
  }

  if (!job) return <div className="p-8 text-center text-muted-foreground">Job not found</div>;

  return (
    <div className="pb-24 max-w-md mx-auto bg-gray-50 min-h-screen dark:bg-zinc-950">
      {/* App Bar */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b px-4 py-3 flex items-center justify-between">
        <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex flex-col items-center">
          <span className="font-bold text-lg">{job.job_number || `JOB-${job.id}`}</span>
          <span className="text-xs text-muted-foreground">Details & Workflow</span>
        </div>
        <div className="w-9" /> {/* Spacer */}
      </div>

      <div className="p-4 space-y-4">
        {/* Header Card */}
        <Card className="border-0 shadow-md bg-white dark:bg-zinc-900 overflow-hidden">
          <div className="h-2 w-full bg-primary" />
          <CardContent className="p-5 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold">{job.customer || 'Internal Work'}</h2>
                <p className="text-muted-foreground text-sm flex items-center mt-1">
                  <MapPin className="w-3.5 h-3.5 mr-1" /> {job.site || 'Main Factory Site'}
                </p>
              </div>
              <Badge variant="outline" className={`
                ${job.status === 'in_progress' ? 'bg-blue-100 text-blue-700 border-blue-200' : ''}
                ${job.status === 'completed' ? 'bg-green-100 text-green-700 border-green-200' : ''}
              `}>
                {job.status?.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Priority</p>
                <p className="text-sm font-medium">{job.priority || 'Normal'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Timeline</p>
                <p className="text-sm font-medium">
                  {job.expected_completion ? new Date(job.expected_completion).toLocaleDateString() : 'TBD'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Collapsible Sections */}
        <div className="space-y-2">
          <SectionItem 
            title="Instructions & Scope" 
            icon={FileText} 
            isExpanded={expandedSection === 'instructions'}
            onToggle={() => toggleSection('instructions')}
          >
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {job.instructions || 'No specific instructions provided for this job. Follow standard operating procedures.'}
            </p>
          </SectionItem>

          <SectionItem 
            title="Required Materials" 
            icon={Wrench} 
            isExpanded={expandedSection === 'materials'}
            onToggle={() => toggleSection('materials')}
          >
            <ul className="list-disc pl-4 text-sm text-gray-700 dark:text-gray-300 space-y-1">
               {job.required_material?.split(',').map((m, i) => <li key={i}>{m.trim()}</li>) || <li>Standard Toolkit</li>}
            </ul>
          </SectionItem>

          <SectionItem 
            title="Machine Required" 
            icon={Wrench} 
            isExpanded={expandedSection === 'machine'}
            onToggle={() => toggleSection('machine')}
          >
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {job.machine_required || 'No specific machine requested.'}
            </p>
          </SectionItem>

          <SectionItem 
            title="QC Checklist" 
            icon={ShieldCheck} 
            isExpanded={expandedSection === 'qc'}
            onToggle={() => toggleSection('qc')}
          >
            <Button variant="outline" className="w-full text-sm" asChild>
              <a href={job.qc_checklist_url || '#'} target="_blank">View QC Document</a>
            </Button>
          </SectionItem>
        </div>
      </div>

      {/* Workflow Action Bar */}
      <div className="fixed bottom-16 left-0 right-0 bg-white dark:bg-zinc-900 border-t p-4 pb-safe z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="max-w-md mx-auto space-y-3">
          
          {/* Photo Actions */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1 bg-gray-50"
              onClick={() => { setPhotoType('progress'); fileInputRef.current?.click(); }}
            >
              <Camera className="w-4 h-4 mr-2" />
              Progress
            </Button>
            <Button 
              variant="outline" 
              className="flex-1 bg-gray-50"
              onClick={() => { setPhotoType('completion'); fileInputRef.current?.click(); }}
            >
              <Upload className="w-4 h-4 mr-2" />
              Completion
            </Button>
            <input 
              type="file" 
              accept="image/*" 
              capture="environment" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handlePhotoUpload}
            />
          </div>

          {/* Primary Action Buttons */}
          <div className="flex gap-2">
            {(job.status === 'not_started' || job.status === 'assigned') && (
              <Button 
                size="lg" 
                className="w-full text-base font-semibold"
                onClick={() => handleStatusChange('start')}
                disabled={startJob.isPending}
              >
                <Play className="w-5 h-5 mr-2" /> Start Work
              </Button>
            )}

            {job.status === 'in_progress' && (
              <>
                <Button 
                  size="lg" 
                  variant="secondary" 
                  className="flex-1 text-base font-semibold"
                  onClick={() => handleStatusChange('pause')}
                  disabled={pauseJob.isPending}
                >
                  <Pause className="w-5 h-5 mr-2" /> Pause
                </Button>
                <Button 
                  size="lg" 
                  className="flex-1 text-base font-semibold bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => handleStatusChange('complete')}
                  disabled={completeJob.isPending}
                >
                  <CheckCircle2 className="w-5 h-5 mr-2" /> Complete
                </Button>
              </>
            )}

            {job.status === 'paused' && (
              <Button 
                size="lg" 
                className="w-full text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => handleStatusChange('resume')}
                disabled={resumeJob.isPending}
              >
                <Play className="w-5 h-5 mr-2 fill-current" /> Resume Work
              </Button>
            )}

            {job.status === 'completed' && (
              <Button size="lg" className="w-full text-base font-semibold" disabled variant="outline">
                <CheckCircle2 className="w-5 h-5 mr-2 text-green-500" /> Job Completed
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionItem({ title, icon: Icon, children, isExpanded, onToggle }: any) {
  return (
    <Card className="border shadow-sm overflow-hidden bg-white dark:bg-zinc-900">
      <button 
        className="w-full flex items-center justify-between p-4 text-left transition-colors hover:bg-gray-50 dark:hover:bg-zinc-800/50"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-primary/10 rounded-md">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <span className="font-semibold text-sm">{title}</span>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </motion.div>
      </button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t"
          >
            <div className="p-4 bg-gray-50/50 dark:bg-zinc-900/20">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

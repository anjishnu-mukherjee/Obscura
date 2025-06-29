"use client";

import { motion } from 'framer-motion';
import { 
  MapPin, 
  Users, 
  Clock,
  Lock,
  ChevronLeft,
  FileText,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/navbar';
import { useEffect, useState, use } from 'react';
import { useCase } from '@/hooks/useCases';
import { canVisitLocation, canInterrogateSuspect, getCurrentISTDate, InvestigationProgress } from '@/lib/investigationUtils';
import { LocationNode, Suspect } from '@/functions/types';
import FloatingNotepad from '@/components/FloatingNotepad';
import FloatingWatson from '@/components/FloatingWatson';
import InvestigationFindings from '@/components/InvestigationFindings';
import Image from 'next/image';

interface InvestigatePageProps {
  params: Promise<{
    caseId: string;
  }>;
}

export default function InvestigatePage({ params }: InvestigatePageProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const resolvedParams = use(params);
  const { caseData, loading: isLoading, error } = useCase(resolvedParams.caseId);
  const [selectedTab, setSelectedTab] = useState<'locations' | 'suspects'>('locations');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl mb-6">
            <FileText className="w-8 h-8 text-teal-400 animate-pulse" />
          </div>
          <h2 className="text-2xl font-light text-white mb-2">Loading Investigation</h2>
          <p className="text-gray-400">Preparing field operations...</p>
        </motion.div>
      </div>
    );
  }

  if (!user || error || !caseData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900">
        <Navbar />
        <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          <div className="text-center mt-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 backdrop-blur-xl border border-red-400/30 rounded-2xl mb-6">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Investigation Unavailable</h2>
            <p className="text-gray-400 mb-6">{error || 'Unable to access investigation data.'}</p>
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 px-6 py-3 bg-teal-500 hover:bg-teal-600 rounded-lg text-white font-medium transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Go Back
            </button>
          </div>
        </main>
      </div>
    );
  }

  const progress: InvestigationProgress = caseData.investigationProgress || {
    visitedLocations: {},
    interrogatedSuspects: {},
    discoveredClues: [],
    currentDay: 1
  };

  const handleVisitLocation = async (locationId: string, locationName: string) => {
    // Check if location was already visited today
    const hasVisitedToday = progress.visitedLocations[locationId]?.lastVisitDate === getCurrentISTDate();
    
    if (hasVisitedToday) {
      // Already visited today - navigate directly without API call (no new progress recorded)
      router.push(`/dashboard/investigate/${resolvedParams.caseId}/location/${locationId}`);
    } else {
      // First visit today - call API to record progress, then navigate
      try {
        const response = await fetch('/api/investigation/visit-location', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ caseId: resolvedParams.caseId, locationId })
        });

        if (response.ok) {
          const result = await response.json();
          router.push(result.redirectTo || `/dashboard/investigate/${resolvedParams.caseId}/location/${locationId}`);
        } else {
          // If API fails, still allow navigation but no progress recorded
          router.push(`/dashboard/investigate/${resolvedParams.caseId}/location/${locationId}`);
        }
      } catch (error) {
        // If network error, still allow navigation but no progress recorded
        console.error('Error visiting location:', error);
        router.push(`/dashboard/investigate/${resolvedParams.caseId}/location/${locationId}`);
      }
    }
  };

  const handleInterrogateSuspect = (suspectName: string) => {
    router.push(`/dashboard/investigate/${resolvedParams.caseId}/interrogate/${encodeURIComponent(suspectName)}`);
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  // Check if any location was visited today
  const hasVisitedLocationToday = Object.values(progress.visitedLocations).some(
    visit => visit.lastVisitDate === getCurrentISTDate()
  );

  // Check if any suspect was interrogated today
  const hasInterrogatedSuspectToday = Object.values(progress.interrogatedSuspects).some(
    interrogation => interrogation.lastInterrogationDate === getCurrentISTDate()
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="space-y-8"
        >
          {/* Header */}
          <motion.div variants={fadeInUp} className="mt-16">
                         <button
               onClick={() => router.push(`/dashboard/case/${resolvedParams.caseId}`)}
               className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
             >
              <ChevronLeft className="w-4 h-4" />
              Back to Case File
            </button>
            
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">Active Investigation</h1>
                  <p className="text-gray-400">{caseData.title}</p>
                </div>
                
                {/* Final Verdict Button */}
                <button
                  onClick={() => router.push(`/dashboard/investigate/${resolvedParams.caseId}/final-verdict`)}
                  className="group relative px-6 py-3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-semibold rounded-lg transition-all duration-300 hover:shadow-xl hover:shadow-red-500/25 border border-red-400/30"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
                  <div className="relative flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5" />
                    <span>Final Verdict</span>
                  </div>
                  <div className="absolute inset-0 ring-2 ring-red-400/50 rounded-lg group-hover:ring-red-300 transition-colors" />
                </button>
              </div>
              
              {/* Daily Status */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className={`p-4 rounded-lg border ${
                  hasVisitedLocationToday 
                    ? 'bg-red-500/10 border-red-400/20' 
                    : 'bg-green-500/10 border-green-400/20'
                }`}>
                  <div className="flex items-center gap-2">
                    {hasVisitedLocationToday ? (
                      <Lock className="w-5 h-5 text-red-400" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    )}
                    <p className={`font-medium ${
                      hasVisitedLocationToday ? 'text-red-400' : 'text-green-400'
                    }`}>
                      Location Visit: {hasVisitedLocationToday ? 'Used Today' : 'Available'}
                    </p>
                  </div>
                </div>
                
                <div className={`p-4 rounded-lg border ${
                  hasInterrogatedSuspectToday 
                    ? 'bg-red-500/10 border-red-400/20' 
                    : 'bg-green-500/10 border-green-400/20'
                }`}>
                  <div className="flex items-center gap-2">
                    {hasInterrogatedSuspectToday ? (
                      <Lock className="w-5 h-5 text-red-400" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    )}
                    <p className={`font-medium ${
                      hasInterrogatedSuspectToday ? 'text-red-400' : 'text-green-400'
                    }`}>
                      Interrogation: {hasInterrogatedSuspectToday ? 'Used Today' : 'Available'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Tab Navigation */}
          <motion.div variants={fadeInUp} className="flex space-x-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-1">
            <button
              onClick={() => setSelectedTab('locations')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                selectedTab === 'locations'
                  ? 'bg-teal-500 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <MapPin className="w-5 h-5" />
              Locations ({caseData.map.nodes.length})
            </button>
            <button
              onClick={() => setSelectedTab('suspects')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                selectedTab === 'suspects'
                  ? 'bg-teal-500 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Users className="w-5 h-5" />
              Suspects ({caseData.story.suspects.length})
            </button>
          </motion.div>

          {/* Investigation Findings */}
          <motion.div variants={fadeInUp}>
            <InvestigationFindings caseId={resolvedParams.caseId} />
          </motion.div>

          {/* Content */}
          <motion.div variants={fadeInUp}>
            {selectedTab === 'locations' ? (
              <div className="space-y-4">
                {caseData.map.nodes.map((location: LocationNode, index: number) => {
                  const isVisited = progress.visitedLocations[location.id];
                  const visitedToday = isVisited?.lastVisitDate === getCurrentISTDate();
                  
                  return (
                    <motion.div
                      key={location.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl transition-all duration-300 hover:bg-white/10 cursor-pointer hover:border-teal-400/50"
                      onClick={() => handleVisitLocation(location.id, location.fullName)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                            visitedToday
                              ? 'bg-gradient-to-br from-amber-500 to-amber-400' 
                              : isVisited 
                                ? 'bg-gradient-to-br from-green-500 to-green-400' 
                                : 'bg-gradient-to-br from-teal-500 to-teal-400'
                          }`}>
                            {visitedToday ? (
                              <Clock className="w-6 h-6 text-white" />
                            ) : isVisited ? (
                              <CheckCircle className="w-6 h-6 text-white" />
                            ) : (
                              <MapPin className="w-6 h-6 text-white" />
                            )}
                          </div>
                          <div>
                            <h3 className="text-white font-semibold">{location.fullName}</h3>
                            <p className="text-gray-400 text-sm">
                              {visitedToday 
                                ? 'Visited today - Review mode'
                                : isVisited 
                                  ? `Last visited: ${new Date(isVisited.visitedAt.seconds * 1000).toLocaleDateString()}`
                                  : 'Available for investigation'
                              }
                            </p>
                          </div>
                        </div>
                        
                        {visitedToday && (
                          <div className="flex items-center gap-2 text-amber-400">
                            <span className="text-sm font-medium">Already visited today</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-4">
                {caseData.story.suspects.map((suspect: Suspect, index: number) => {
                  const isInterrogated = progress.interrogatedSuspects[suspect.name];
                  const canInterrogate = canInterrogateSuspect(progress, suspect.name);
                  
                  return (
                    <motion.div
                      key={suspect.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl transition-all duration-300 hover:bg-white/10 cursor-pointer hover:border-teal-400/50"
                      onClick={() => handleInterrogateSuspect(suspect.name)}
                    >
                     <div className="flex items-center gap-6">
                        {/* Suspect Portrait - Case File Style */}
                        <div className="flex-shrink-0">
                          <div className="relative">
                            {/* Case file photo frame */}
                            <div className="w-24 h-32 bg-gray-800 border-2 border-gray-300 rounded-sm shadow-lg relative overflow-hidden">
                              {suspect.portrait ? (
                                <Image
                                  src={suspect.portrait}
                                  alt={`${suspect.name} - Suspect`}
                                  fill
                                  className="object-cover filter sepia-[0.2] contrast-[1.05] saturate-[0.9]"
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                                  <Users className="w-8 h-8 text-gray-500" />
                                </div>
                              )}
                              {/* Photo corner clips */}
                              <div className="absolute -top-0.5 -left-0.5 w-2 h-2 bg-gray-400 rotate-45 transform origin-center"></div>
                              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-gray-400 rotate-45 transform origin-center"></div>
                              <div className="absolute -bottom-0.5 -left-0.5 w-2 h-2 bg-gray-400 rotate-45 transform origin-center"></div>
                              <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-gray-400 rotate-45 transform origin-center"></div>
                            </div>
                            {/* Case file label */}
                            <div className="absolute -bottom-5 left-0 right-0 text-center">
                              <div className="inline-block bg-yellow-900/80 text-yellow-200 text-xs px-2 py-1 rounded border border-yellow-700">
                                SUSPECT
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Suspect Information */}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h3 className="text-white font-semibold text-lg">{suspect.name}</h3>
                              <p className="text-gray-400 text-sm mb-1">{suspect.role}</p>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                                isInterrogated 
                                  ? 'bg-gradient-to-br from-green-500 to-green-400' 
                                  : 'bg-gradient-to-br from-purple-500 to-purple-400'
                              }`}>
                                {isInterrogated ? (
                                  <CheckCircle className="w-6 h-6 text-white" />
                                ) : (
                                  <Users className="w-6 h-6 text-white" />
                                )}
                              </div>
                              
                              {!canInterrogate && (
                                <div className="flex items-center gap-2 text-gray-400">
                                  <span className="text-sm">Already interrogated today</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Personality</p>
                              <p className="text-gray-300 text-sm line-clamp-2">{suspect.personality}</p>
                            </div>
                            <div>
                              <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Status</p>
                              <div className="flex items-center gap-2">
                                {isInterrogated && (
                                  <p className="text-green-400 text-xs">
                                    Last interrogated: {new Date(isInterrogated.interrogatedAt.seconds * 1000).toLocaleDateString()}
                                  </p>
                                )}
                                {!isInterrogated && (
                                  <p className="text-yellow-400 text-xs">Not yet interrogated</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </motion.div>
      </main>
      
      {/* Floating Components */}
      <FloatingNotepad caseId={resolvedParams.caseId} />
      <FloatingWatson caseId={resolvedParams.caseId} />
    </div>
  );
} 
"use client";

import { motion } from 'framer-motion';
import { 
  Shield, 
  FileText, 
  MapPin,
  Clock,
  User,
  Camera,
  ChevronLeft,
  Calendar,
  Target,
  AlertTriangle,
  BookOpen,
  Map as MapIcon
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/navbar';
import { useEffect, use } from 'react';
import { useCase } from '@/hooks/useCases';
import Image from 'next/image';
import { LocationNode } from '@/functions/types';

interface CaseFilePageProps {
  params: Promise<{
    caseId: string;
  }>;
}

export default function CaseFilePage({ params }: CaseFilePageProps) {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const resolvedParams = use(params);
  const { caseData, loading: isLoading, error } = useCase(resolvedParams.caseId);

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
          <h2 className="text-2xl font-light text-white mb-2">Loading Case File</h2>
          <p className="text-gray-400">Accessing classified information...</p>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (error || !caseData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900">
        <Navbar />
        <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          <div className="text-center mt-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 backdrop-blur-xl border border-red-400/30 rounded-2xl mb-6">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Case Not Found</h2>
            <p className="text-gray-400 mb-6">{error || 'The requested case file could not be accessed.'}</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-teal-500 hover:bg-teal-600 rounded-lg text-white font-medium transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
          </div>
        </main>
      </div>
    );
  }

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
          {/* Back Button */}
          <motion.div variants={fadeInUp} className="mt-16">
            <button
              onClick={() => router.push('/dashboard')}
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
          </motion.div>

          {/* Case Header */}
          <motion.div variants={fadeInUp} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-400 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white">{caseData.title}</h1>
                    <p className="text-gray-400">Case ID: {caseData.id}</p>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                  caseData.status === 'active' ? 'bg-teal-500/20 text-teal-400' :
                  caseData.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    caseData.status === 'active' ? 'bg-teal-400' :
                    caseData.status === 'completed' ? 'bg-green-400' :
                    'bg-gray-400'
                  }`} />
                  {caseData.status.charAt(0).toUpperCase() + caseData.status.slice(1)}
                </div>
              </div>
            </div>

            {/* Case Stats */}
            <div className="grid md:grid-cols-4 gap-4">
              <div className="flex items-center gap-3">
                <Target className="w-5 h-5 text-teal-400" />
                <div>
                  <p className="text-gray-400 text-sm">Difficulty</p>
                  <p className="text-white font-medium capitalize">{caseData.difficulty}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-teal-400" />
                <div>
                  <p className="text-gray-400 text-sm">Duration</p>
                  <p className="text-white font-medium">{caseData.estimatedDuration} min</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-teal-400" />
                <div>
                  <p className="text-gray-400 text-sm">Created</p>
                  <p className="text-white font-medium">
                    {caseData.createdAt ? new Date(caseData.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-teal-400" />
                <div>
                  <p className="text-gray-400 text-sm">Victim</p>
                  <p className="text-white font-medium">{caseData.story.victim.name}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Journal Entry */}
          <motion.div variants={fadeInUp} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-400 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Case Notes</h2>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-400/20 rounded-lg p-6">
              <p className="text-yellow-100 leading-relaxed whitespace-pre-line italic">
                {caseData.caseIntro.journalEntry}
              </p>
            </div>
          </motion.div>

          {/* Intro Narrative */}
          <motion.div variants={fadeInUp} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-400 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Mission Briefing</h2>
            </div>
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                {caseData.caseIntro.introNarrative}
              </p>
            </div>
          </motion.div>


          {/* Case Details & Map */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Case Details */}
            <motion.div variants={fadeInUp} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-400 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">Case Summary</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-white font-semibold mb-2">Victim Information</h3>
                  <div className="bg-white/5 rounded-lg p-4 space-y-2">
                    <p className="text-gray-300"><span className="text-gray-400">Name:</span> {caseData.caseIntro.displayData.victimName}</p>
                    <p className="text-gray-300"><span className="text-gray-400">Last Known Location:</span> {caseData.caseIntro.displayData.lastKnownLocation}</p>
                    <p className="text-gray-300"><span className="text-gray-400">Cause of Death:</span> {caseData.caseIntro.displayData.causeOfDeath}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-white font-semibold mb-2">Initial Suspects</h3>
                  <div className="space-y-2">
                    {caseData.caseIntro.displayData.initialSuspects.map((suspect: string, index: number) => (
                      <div key={index} className="bg-white/5 rounded-lg p-3">
                        <p className="text-gray-300">{suspect}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-white font-semibold mb-2">Primary Location</h3>
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-teal-400" />
                      <p className="text-gray-300">{caseData.caseIntro.displayData.mainLocation}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Map */}
            <motion.div variants={fadeInUp} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-400 rounded-lg flex items-center justify-center">
                  <MapIcon className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">Investigation Map</h2>
              </div>
              
              {caseData.mapImageUrl && caseData.mapImageUrl !== "No map image" ? (
                <div className="relative aspect-square bg-gray-800 rounded-lg overflow-hidden">
                  <Image
                    src={caseData.mapImageUrl}
                    alt="Investigation Map"
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-square bg-gray-800 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <MapIcon className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">Map not available</p>
                  </div>
                </div>
              )}

              {/* Location Nodes */}
              <div className="mt-6">
                <h3 className="text-white font-semibold mb-3">Investigation Sites</h3>
                <div className="space-y-2">
                  {caseData.map.nodes.map((node: LocationNode, index: number) => (
                    <div key={node.id} className="bg-white/5 rounded-lg p-3">
                      <p className="text-gray-300">{node.fullName}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Start Investigation Button */}
          <motion.div variants={fadeInUp} className="flex justify-center">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push(`/dashboard/investigate/${resolvedParams.caseId}`)}
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-2xl text-white font-bold tracking-wide shadow-lg hover:shadow-2xl transition-all duration-300"
            >
              <Camera className="w-6 h-6" />
              Begin Investigation
            </motion.button>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
} 
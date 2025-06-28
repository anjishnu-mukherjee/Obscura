"use client";

import { motion } from 'framer-motion';
import { 
  MapPin, 
  Camera, 
  ChevronLeft,
  Eye,
  Search,
  AlertCircle,
  FileText,
  Lightbulb,
  Target,
  Fingerprint,
  Shield,
  Microscope,
  Hash
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/navbar';
import { useEffect, useState, use } from 'react';
import { useCase } from '@/hooks/useCases';
import { LocationNode } from '@/functions/types';
import Image from 'next/image';

interface LocationPageProps {
  params: Promise<{
    caseId: string;
    locationId: string;
  }>;
}

interface LocationFindings {
  id: string;
  finding: string;
  importance: 'critical' | 'important' | 'minor';
  type: 'physical_evidence' | 'environmental_clue' | 'witness_account' | 'digital_trace';
}

export default function LocationPage({ params }: LocationPageProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const resolvedParams = use(params);
  const { caseData, loading: isLoading, error } = useCase(resolvedParams.caseId);
  const [locationFindings, setLocationFindings] = useState<LocationFindings[]>([]);
  const [crimeSceneImage, setCrimeSceneImage] = useState<string | null>(null);

  // Helper function
  const getCurrentLocation = (): LocationNode | null => {
    if (!caseData) return null;
    return caseData.map.nodes.find((node: LocationNode) => node.id === resolvedParams.locationId) || null;
  };

  // Get current date in IST format
  const getCurrentISTDate = () => {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
    const istTime = new Date(now.getTime() + istOffset);
    return istTime.toISOString().split('T')[0]; // YYYY-MM-DD format
  };

//   // Check if location was visited today
//   const isVisitedToday = () => {
//     if (!caseData) return false;
//     const progress = caseData.investigationProgress || { visitedLocations: {}, interrogatedSuspects: {}, discoveredClues: [], currentDay: 0 };
//     const locationVisit = progress.visitedLocations[resolvedParams.locationId];
//     return locationVisit?.lastVisitDate === getCurrentISTDate();
//   };

  // Generate placeholder SVG image
  const generatePlaceholderImage = () => {
    const locationName = getCurrentLocation()?.fullName || "Unknown Location";
    const svg = `
      <svg width="800" height="450" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#1f2937"/>
            <stop offset="100%" style="stop-color:#111827"/>
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#bg)"/>
        <rect x="20" y="20" width="760" height="410" fill="none" stroke="#14b8a6" stroke-width="2" stroke-dasharray="10,5"/>
        <text x="400" y="200" text-anchor="middle" fill="#14b8a6" font-family="Arial, sans-serif" font-size="24" font-weight="bold">
          CRIME SCENE
        </text>
        <text x="400" y="230" text-anchor="middle" fill="#9ca3af" font-family="Arial, sans-serif" font-size="16">
          ${locationName}
        </text>
        <text x="400" y="260" text-anchor="middle" fill="#6b7280" font-family="Arial, sans-serif" font-size="14">
          Investigation in Progress
        </text>
        <circle cx="150" cy="350" r="4" fill="#ef4444"/>
        <text x="160" y="355" fill="#ef4444" font-family="Arial, sans-serif" font-size="10">Evidence A</text>
        <circle cx="300" cy="380" r="4" fill="#ef4444"/>
        <text x="310" y="385" fill="#ef4444" font-family="Arial, sans-serif" font-size="10">Evidence B</text>
        <circle cx="550" cy="360" r="4" fill="#ef4444"/>
        <text x="560" y="365" fill="#ef4444" font-family="Arial, sans-serif" font-size="10">Evidence C</text>
      </svg>
    `;
    
    const base64 = btoa(svg);
    return `data:image/svg+xml;base64,${base64}`;
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Set crime scene image from the location data or use placeholder
  useEffect(() => {
    if (caseData) {
      const currentLocation = getCurrentLocation();
      
      // Set static forensic findings
      setLocationFindings([
        {
          id: '1',
          finding: 'Fresh tire tracks found near the entrance, suggesting recent vehicle activity',
          importance: 'important',
          type: 'physical_evidence'
        },
        {
          id: '2',
          finding: 'Security camera positioned at the northwest corner, potential source of footage',
          importance: 'critical',
          type: 'digital_trace'
        },
        {
          id: '3',
          finding: 'Witnesses report seeing unusual activity around 8:30 PM',
          importance: 'important',
          type: 'witness_account'
        },
        {
          id: '4',
          finding: 'Disturbed soil patterns indicating possible evidence burial',
          importance: 'minor',
          type: 'environmental_clue'
        }
      ]);

      // Use the actual crime scene image if available, otherwise use placeholder
      if (currentLocation?.imageUrl) {
        setCrimeSceneImage(currentLocation.imageUrl);
      } else {
        setCrimeSceneImage(generatePlaceholderImage());
      }
    }
  }, [caseData, resolvedParams.locationId]);

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'critical': return 'text-red-400 bg-red-500/20 border-red-400/30';
      case 'important': return 'text-yellow-400 bg-yellow-500/20 border-yellow-400/30';
      case 'minor': return 'text-blue-400 bg-blue-500/20 border-blue-400/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-400/30';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'physical_evidence': return <Fingerprint className="w-4 h-4" />;
      case 'environmental_clue': return <Eye className="w-4 h-4" />;
      case 'witness_account': return <FileText className="w-4 h-4" />;
      case 'digital_trace': return <Hash className="w-4 h-4" />;
      default: return <Search className="w-4 h-4" />;
    }
  };

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
            <MapPin className="w-8 h-8 text-teal-400 animate-pulse" />
          </div>
          <h2 className="text-2xl font-light text-white mb-2">Loading Location</h2>
          <p className="text-gray-400">Preparing crime scene analysis...</p>
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
            <h2 className="text-2xl font-bold text-white mb-2">Location Unavailable</h2>
            <p className="text-gray-400 mb-6">{error || 'Unable to access location data.'}</p>
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

  const currentLocation = getCurrentLocation();
  if (!currentLocation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900">
        <Navbar />
        <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          <div className="text-center mt-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 backdrop-blur-xl border border-red-400/30 rounded-2xl mb-6">
              <MapPin className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Location Not Found</h2>
            <p className="text-gray-400 mb-6">The requested location could not be found.</p>
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
          {/* Header */}
          <motion.div variants={fadeInUp} className="mt-16">
            <button
              onClick={() => router.push(`/dashboard/investigate/${resolvedParams.caseId}`)}
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Investigation
            </button>
            
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-gradient-to-br from-teal-500 to-teal-400">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-1">
                    Crime Scene Analysis
                  </h1>
                  <p className="text-gray-400">{currentLocation.fullName}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2 text-teal-400">
                  <Eye className="w-4 h-4" />
                  <span>Forensic analysis complete</span>
                </div>
                <div className="flex items-center gap-2 text-yellow-400">
                  <Shield className="w-4 h-4" />
                  <span>Secure evidence chain maintained</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Crime Scene Image */}
          <motion.div variants={fadeInUp} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-400 rounded-lg flex items-center justify-center">
                <Camera className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Crime Scene Photography</h2>
            </div>
            
            <div className="relative rounded-xl overflow-hidden bg-gray-900 border border-white/10">
              {crimeSceneImage ? (
                <div className="relative aspect-video">
                  <Image
                    src={crimeSceneImage}
                    alt={`Crime scene at ${currentLocation.fullName}`}
                    fill
                    className="object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  <div className="absolute bottom-4 left-4 text-white">
                    <p className="text-sm font-medium">Official Crime Scene Documentation</p>
                    <p className="text-xs text-gray-300">Location: {currentLocation.fullName}</p>
                  </div>
                </div>
              ) : (
                <div className="aspect-video flex items-center justify-center">
                  <div className="text-center">
                    <Camera className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">Crime scene image unavailable</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Forensic Findings */}
          <motion.div variants={fadeInUp} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-400 rounded-lg flex items-center justify-center">
                  <Microscope className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">Forensic Analysis</h2>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Lightbulb className="w-4 h-4" />
                <span>{locationFindings.length} findings discovered</span>
              </div>
            </div>

            <div className="space-y-4">
              {locationFindings.map((finding, index) => (
                <motion.div
                  key={finding.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-lg border ${getImportanceColor(finding.importance)}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getTypeIcon(finding.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium capitalize">
                          {finding.type.replace('_', ' ')}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full border ${getImportanceColor(finding.importance)}`}>
                          {finding.importance.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-gray-300 text-sm leading-relaxed">
                        {finding.finding}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Investigation Summary */}
          <motion.div variants={fadeInUp} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-400 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Investigation Summary</h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="text-2xl font-bold text-red-400 mb-1">
                  {locationFindings.filter(f => f.importance === 'critical').length}
                </div>
                <p className="text-sm text-gray-400">Critical Evidence</p>
              </div>
              
              <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="text-2xl font-bold text-yellow-400 mb-1">
                  {locationFindings.filter(f => f.importance === 'important').length}
                </div>
                <p className="text-sm text-gray-400">Important Clues</p>
              </div>
              
              <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="text-2xl font-bold text-blue-400 mb-1">
                  {locationFindings.filter(f => f.importance === 'minor').length}
                </div>
                <p className="text-sm text-gray-400">Supporting Evidence</p>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-teal-500/10 border border-teal-400/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-teal-400" />
                <span className="text-teal-400 font-medium text-sm">Investigation Note</span>
              </div>
              <p className="text-gray-300 text-sm">
                Location analysis complete. All evidence has been properly documented and catalogued. 
                Consider cross-referencing findings with witness testimonies and suspect alibis.
              </p>
            </div>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}

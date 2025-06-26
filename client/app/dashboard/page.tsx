"use client";

import { motion } from 'framer-motion';
import { 
  Shield, 
  FileText, 
  Trophy, 
  Search,
  ChevronRight,
  Eye,
  Lock,
  Brain,
  Briefcase
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import DecryptedText from '@/react-bits/DecryptedText';
import Navbar from '@/components/navbar';
import DifficultyModal from '@/components/DifficultyModal';
import { useCases, CaseData } from '@/hooks/useCases';
import { useEffect, useState } from 'react';
  
export default function DashboardPage() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const [showDifficultyModal, setShowDifficultyModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { cases: recentCases, loading: casesLoading, error: casesError } = useCases(user?.uid, 3);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    console.log('Dashboard - User ID:', user?.uid);
    console.log('Dashboard - Cases loading:', casesLoading);
    console.log('Dashboard - Cases:', recentCases);
    console.log('Dashboard - Cases error:', casesError);
  }, [user?.uid, casesLoading, recentCases, casesError]);



  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl mb-6">
            <Shield className="w-8 h-8 text-teal-400 animate-pulse" />
          </div>
          <h2 className="text-2xl font-light text-white mb-2">Loading Dashboard</h2>
          <p className="text-gray-400">Accessing your mission control...</p>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return null;
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

  const stats = [
    { label: 'Cases Completed', value: userData?.stats?.casesCompleted || 0, icon: Trophy },
    { label: 'Evidence Found', value: userData?.stats?.evidenceFound || 0, icon: Search },
    { label: 'Current Rank', value: userData?.stats?.rank || 'Rookie Agent', icon: Shield },
  ];

  // Calculate progress for each case based on investigation progress
  const calculateCaseProgress = (caseData: CaseData): number => {
    if (caseData.status === 'completed') return 100;
    
    const progress = caseData.investigationProgress;
    if (!progress) return 0;
    
    // Calculate progress based on locations visited, suspects interrogated, and clues discovered
    const totalLocations = Object.keys(caseData.map?.locations || {}).length;
    const totalSuspects = caseData.story?.characters?.suspects?.length || 0;
    const totalClues = Object.keys(caseData.clues?.processed || {}).length;
    
    const visitedLocations = Object.keys(progress.visitedLocations || {}).length;
    const interrogatedSuspects = Object.keys(progress.interrogatedSuspects || {}).length;
    const discoveredClues = progress.discoveredClues?.length || 0;
    
    const locationProgress = totalLocations > 0 ? (visitedLocations / totalLocations) * 40 : 0;
    const suspectProgress = totalSuspects > 0 ? (interrogatedSuspects / totalSuspects) * 40 : 0;
    const clueProgress = totalClues > 0 ? (discoveredClues / totalClues) * 20 : 0;
    
    return Math.min(100, Math.round(locationProgress + suspectProgress + clueProgress));
  };

  // Use real cases from Firestore with calculated progress
  const casesToShow: (CaseData & { progress?: number })[] = recentCases.map(caseData => ({
    ...caseData,
    progress: calculateCaseProgress(caseData)
  }));

  const handleStartNewMission = () => {
    setShowDifficultyModal(true);
  };

  const handleSelectDifficulty = async (difficulty: 'easy' | 'medium' | 'hard') => {
    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/initCase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.uid,
          difficulty,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate case');
      }

      const result = await response.json();
      
      if (result.success && result.caseId) {
        // Navigate to the case file page
        router.push(`/dashboard/case/${result.caseId}`);
      } else {
        throw new Error(result.error || 'Failed to generate case');
      }
    } catch (error) {
      console.error('Error generating case:', error);
      alert('Failed to generate case. Please try again.');
      setIsGenerating(false);
      setShowDifficultyModal(false);
    }
  };

  const handleCloseModal = () => {
    if (!isGenerating) {
      setShowDifficultyModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900">
      {/* Navbar (dashboard mode) */}
      <Navbar />
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="space-y-8"
        >
          {/* Welcome Section */}
          <motion.div variants={fadeInUp} className="text-center mt-16">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              <DecryptedText
                text={`Welcome back, ${userData?.name?.split(' ')[0] || 'Agent'}`}
                animateOn="view"
                speed={80}
                maxIterations={15}
                characters="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
                className="text-white"
                encryptedClassName="text-gray-500"
              />
            </h1>
            <p className="text-xl text-gray-400">Your mission control center awaits</p>
          </motion.div>

          {/* Stats Grid */}
          <motion.div variants={fadeInUp} className="grid md:grid-cols-3 gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                whileHover={{ scale: 1.02, rotateY: 5 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-400 rounded-lg flex items-center justify-center">
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">{stat.value}</h3>
                <p className="text-gray-400 text-sm">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Start a New Case Button */}
          <motion.div
            variants={fadeInUp}
            className="flex justify-center"
          >
            <motion.button
              whileHover={{ scale: 1, boxShadow: '0 0 12px 6px #444444, 0 0 2px 2px #fff2' }}
              whileTap={{ scale: 0.97 }}
              onClick={handleStartNewMission}
              className="relative flex items-center gap-3 px-8 py-4 mt-2 rounded-2xl bg-gradient-to-r from-teal-400 to-cyan-900 shadow-lg shadow-yellow-400/20 border-none border-black/20 text-white font-bold tracking-tighter transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-yellow-400/40 hover:from-teal-400 hover:to-cyan-900 hover:shadow-2xl hover:shadow-pink-500/30"
              style={{ letterSpacing: '0.15em' }}
            >
              <Briefcase className="w-6 h-6 text-white drop-shadow-lg" />
                  <div className = "tracking-normal" >Start a New Mission</div>
            </motion.button>
          </motion.div>

          {/* Recent Cases */}
          <motion.div variants={fadeInUp} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Recent Cases</h2>
              {casesToShow.length > 0 && (
                <button className="text-teal-400 hover:text-teal-300 transition-colors">
                  View All
                </button>
              )}
            </div>
            
            {casesLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="animate-pulse">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gray-700 rounded-lg"></div>
                        <div>
                          <div className="h-4 bg-gray-700 rounded w-24 mb-2"></div>
                          <div className="h-3 bg-gray-700 rounded w-32"></div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="h-3 bg-gray-700 rounded w-16 mb-1"></div>
                          <div className="h-3 bg-gray-700 rounded w-20"></div>
                        </div>
                        <div className="w-16 h-2 bg-gray-700 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : casesError ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-red-300" />
                </div>
                <h3 className="text-white font-semibold mb-2">Error Loading Cases</h3>
                <p className="text-gray-400 text-sm mb-4">{casesError}</p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => window.location.reload()}
                  className="px-6 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200"
                >
                  Retry
                </motion.button>
              </div>
            ) : casesToShow.length > 0 ? (
              <div className="space-y-4">
                {casesToShow.map((case_, index) => (
                  <motion.div
                    key={case_.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => case_.id && router.push(`/dashboard/case/${case_.id}`)}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-400 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">
                          Case #{case_.id ? case_.id.slice(-6).toUpperCase() : case_.id}
                        </h3>
                        <p className="text-gray-400 text-sm">{case_.title}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className={`text-sm font-medium capitalize ${
                          case_.status === 'active' ? 'text-teal-400' :
                          case_.status === 'completed' ? 'text-green-400' :
                          'text-gray-400'
                        }`}>
                          {case_.status}
                        </p>
                        <p className="text-gray-400 text-xs">
                          {case_.progress !== undefined 
                            ? `${case_.progress}% Complete` 
                            : 'Just started'}
                        </p>
                      </div>
                      <div className="w-16 h-2 bg-gray-700 rounded-full">
                        <div 
                          className="h-full bg-gradient-to-r from-teal-500 to-teal-300 rounded-full transition-all duration-300"
                          style={{ width: `${case_.progress || 0}%` }}
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-600 to-gray-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="text-white font-semibold mb-2">No Cases Yet</h3>
                <p className="text-gray-400 text-sm mb-4">Start your first investigation to begin your detective journey</p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleStartNewMission}
                  className="px-6 py-2 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg hover:from-teal-600 hover:to-teal-700 transition-all duration-200"
                >
                  Start Your First Case
                </motion.button>
              </div>
            )}
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={fadeInUp} className="grid md:grid-cols-3 gap-6">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl hover:bg-white/10 transition-all duration-300 text-left"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-400 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-white font-semibold mb-2">New Investigation</h3>
              <p className="text-gray-400 text-sm">Start a new case investigation</p>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl hover:bg-white/10 transition-all duration-300 text-left"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-400 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Lock className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-white font-semibold mb-2">Decrypt Evidence</h3>
              <p className="text-gray-400 text-sm">Analyze encrypted materials</p>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl hover:bg-white/10 transition-all duration-300 text-left"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-400 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-white font-semibold mb-2">AI Analysis</h3>
              <p className="text-gray-400 text-sm">Run pattern recognition</p>
            </motion.button>
          </motion.div>
        </motion.div>
      </main>

      {/* Difficulty Modal */}
      <DifficultyModal
        isOpen={showDifficultyModal}
        onClose={handleCloseModal}
        onSelectDifficulty={handleSelectDifficulty}
        isGenerating={isGenerating}
      />
    </div>
  );
}
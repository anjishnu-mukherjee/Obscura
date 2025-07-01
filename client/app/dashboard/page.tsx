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
  Briefcase,
  MapPin,
  UserCheck,
  Target,
  Clock,
  LogOut,
  FolderOpen
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import DecryptedText from '@/react-bits/DecryptedText';
import GlassIcons from '@/react-bits/GlassIcons';
import Navbar from '@/components/navbar';
import DifficultyModal from '@/components/DifficultyModal';
import { useCases, useUserStats, CaseData } from '@/hooks/useCases';
import { useEffect, useState } from 'react';
import { logOut } from '@/lib/auth';
  
export default function DashboardPage() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const [showDifficultyModal, setShowDifficultyModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingCaseId, setGeneratingCaseId] = useState<string | null>(null);
  const [generationMessage, setGenerationMessage] = useState<string>('');
  const [generationProgress, setGenerationProgress] = useState(0);
  const [showAllCases, setShowAllCases] = useState(false);
  const { cases: recentCases, loading: casesLoading, error: casesError } = useCases(user?.uid, showAllCases ? undefined : 3);
  const { stats: userStats, loading: statsLoading, error: statsError } = useUserStats(user?.uid);

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
    console.log('Dashboard - Stats:', userStats);
    console.log('Dashboard - Stats loading:', statsLoading);
  }, [user?.uid, casesLoading, recentCases, casesError, userStats, statsLoading]);

  // Polling for case generation completion
  useEffect(() => {
    if (!generatingCaseId) return;

    let pollInterval: NodeJS.Timeout;
    let timeoutFallback: NodeJS.Timeout;

    const checkCaseStatus = async () => {
      try {
        const response = await fetch(`/api/case-status/${generatingCaseId}`);
        if (response.ok) {
          const result = await response.json();
          
          if (result.isComplete) {
            setIsGenerating(false);
            setGeneratingCaseId(null);
            setShowDifficultyModal(false);
            clearInterval(pollInterval);
            clearTimeout(timeoutFallback);
            // Navigate to the completed case
            router.push(`/dashboard/case/${generatingCaseId}`);
          } else {
            // Update progress and message
            setGenerationProgress(prev => Math.min(prev + Math.random() * 3 + 1, 95));
            const messages = [
              'Analyzing case details...',
              'Reviewing evidence patterns...',
              'Cross-referencing witness statements...',
              'Mapping crime scene layout...',
              'Processing forensic data...',
              'Compiling investigation notes...',
              'Finalizing case documentation...',
              'Preparing case briefing...'
            ];
            setGenerationMessage(messages[Math.floor(Math.random() * messages.length)]);
          }
        } else {
          console.error('Failed to check case status:', response.status);
        }
      } catch (error) {
        console.error('Error checking case status:', error);
      }
    };

    // Start polling every 3 seconds
    pollInterval = setInterval(checkCaseStatus, 3000);
    
    // Start with immediate check
    checkCaseStatus();

    // Failsafe timeout (5 minutes)
    timeoutFallback = setTimeout(() => {
      console.error('Case generation timeout reached');
      setIsGenerating(false);
      setGeneratingCaseId(null);
      setShowDifficultyModal(false);
      clearInterval(pollInterval);
      alert('Case generation is taking longer than expected. Please try refreshing the page or creating a new case.');
    }, 5 * 60 * 1000); // 5 minutes

    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeoutFallback);
    };
  }, [generatingCaseId, router]);

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

  // Dynamic stats with fallback values and loading states
  const stats = [
    { 
      label: 'Current Rank', 
      value: statsLoading ? '...' : userStats?.rank || 'Rookie Agent', 
      icon: Shield,
      subtext: userStats?.averageProgress ? `${userStats.averageProgress}% avg progress` : 'Build your reputation'
    },
    { 
      label: 'Cases Completed', 
      value: statsLoading ? '...' : userStats?.casesCompleted || 0, 
      icon: Trophy,
      subtext: userStats?.totalCases ? `${userStats.totalCases} total cases` : 'Start your first case'
    },
    { 
      label: 'Evidence Found', 
      value: statsLoading ? '...' : userStats?.evidenceFound || 0, 
      icon: Search,
      subtext: userStats?.locationsVisited ? `${userStats.locationsVisited} locations visited` : 'No evidence yet'
    }
  ];

  // Additional stats for expanded view
  const detailedStats = [
    {
      label: 'Active Cases',
      value: statsLoading ? '...' : userStats?.activeCases || 0,
      icon: FileText,
      color: 'from-blue-500 to-blue-400'
    },
    {
      label: 'Suspects Questioned',
      value: statsLoading ? '...' : userStats?.suspectsInterrogated || 0,
      icon: UserCheck,
      color: 'from-purple-500 to-purple-400'
    },
    {
      label: 'Locations Explored',
      value: statsLoading ? '...' : userStats?.locationsVisited || 0,
      icon: MapPin,
      color: 'from-green-500 to-green-400'
    }
  ];

  // Calculate progress for each case based on investigation progress
  const calculateCaseProgress = (caseData: CaseData): number => {
    if (caseData.status === 'completed') return 100;
    
    const progress = caseData.investigationProgress;
    if (!progress) return 0;
    
    // Calculate progress based on locations visited, suspects interrogated, and clues discovered
    const totalLocations = Object.keys(caseData.map?.locations || {}).length;
    const totalSuspects = caseData.story?.characters?.suspects?.length || caseData.story?.suspects?.length || 0;
    const totalClues = Object.keys(caseData.clues?.processed || caseData.clues || {}).length;
    
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

  const handleOpenRecentCase = () => {
    if (casesToShow.length > 0) {
      const mostRecentCase = casesToShow[0];
      if (mostRecentCase.status === 'completed') {
        // Navigate to the case file page for completed cases
        router.push(`/dashboard/case/${mostRecentCase.id}`);
      } else {
        // Navigate to the investigation page for ongoing cases
        router.push(`/dashboard/investigate/${mostRecentCase.id}`);
      }
    }
  };

  const handleLogOut = async () => {
    try {
      await logOut();
      router.push('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleSelectDifficulty = async (difficulty: 'easy' | 'medium' | 'hard') => {
    setIsGenerating(true);
    setGenerationProgress(10);
    setGenerationMessage('Initializing case generation...');
    
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
        // Case creation started, begin polling
        setGeneratingCaseId(result.caseId);
        setGenerationProgress(20);
        setGenerationMessage('Brewing the perfect mystery...');
      } else {
        throw new Error(result.error || 'Failed to generate case');
      }
    } catch (error) {
      console.error('Error generating case:', error);
      alert('Failed to generate case. Please try again.');
      setIsGenerating(false);
      setGeneratingCaseId(null);
      setShowDifficultyModal(false);
    }
  };

  const handleCloseModal = () => {
    if (!isGenerating) {
      setShowDifficultyModal(false);
    }
  };

  const handleToggleCasesView = () => {
    setShowAllCases(!showAllCases);
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

          {/* Main Stats Grid with Glass Icons */}
          <motion.div variants={fadeInUp} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">Agent Statistics</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  whileHover={{ scale: 1.02 }}
                  className="text-center"
                >
                  <div className="mb-4 flex justify-center">
                    <GlassIcons
                      items={[{
                        icon: <stat.icon className="w-6 h-6 text-white" />,
                        color: index === 0 ? 'orange' : index === 1 ? 'blue' : 'purple',
                        label: stat.label,
                      }]}
                      className="!grid-cols-1 !gap-0 !py-0"
                    />
                  </div>
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all duration-300">
                    <h3 className="text-3xl font-bold text-white mb-2">{stat.value}</h3>
                    <p className="text-gray-300 font-medium mb-1">{stat.label}</p>
                    <p className="text-gray-400 text-sm">{stat.subtext}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Detailed Stats Grid with Glass Icons */}
          <motion.div variants={fadeInUp} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
            <h3 className="text-xl font-bold text-white mb-6 text-center">Performance Metrics</h3>
            <div className="grid md:grid-cols-3 gap-8">
              {detailedStats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  whileHover={{ scale: 1.02 }}
                  className="text-center"
                >
                  <div className="mb-4 flex justify-center">
                    <GlassIcons
                      items={[{
                        icon: <stat.icon className="w-6 h-6 text-white" />,
                        color: index === 0 ? 'blue' : index === 1 ? 'purple' : 'green',
                        label: stat.label,
                      }]}
                      className="!grid-cols-1 !gap-0 !py-0"
                    />
                  </div>
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all duration-300">
                    <h4 className="text-3xl font-bold text-white mb-2">{stat.value}</h4>
                    <p className="text-gray-300 font-medium mb-1">{stat.label}</p>
                    {stat.value !== '...' && stat.value !== 0 && (
                      <div className="mt-2 w-full bg-gray-700/50 rounded-full h-1.5">
                        <div 
                          className={`h-full rounded-full bg-gradient-to-r ${stat.color} transition-all duration-500`}
                          style={{ 
                            width: typeof stat.value === 'number' ? `${Math.min(100, (stat.value / 10) * 100)}%` : '0%' 
                          }}
                        />
                      </div>
                    )}
                    <p className="text-gray-400 text-sm mt-2">
                      {stat.value !== '...' && stat.value !== 0 
                        ? `Active in your investigations` 
                        : 'Start investigating to see progress'}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Start a New Case Button */}
          <motion.div
            variants={fadeInUp}
            className="flex justify-center"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStartNewMission}
              className="px-6 py-2 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg hover:from-teal-600 hover:to-teal-700 transition-all duration-200 flex items-center gap-2"
            >
              <Briefcase className="w-5 h-5 text-white" />
              Start a New Mission
            </motion.button>
          </motion.div>

          {/* Recent Cases */}
          <motion.div variants={fadeInUp} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {showAllCases ? 'All Cases' : 'Recent Cases'}
                </h2>
                {!casesLoading && casesToShow.length > 0 && (
                  <p className="text-gray-400 text-sm mt-1">
                    {showAllCases ? `${casesToShow.length} total cases` : `${casesToShow.length} most recent cases`}
                  </p>
                )}
              </div>
              {casesToShow.length > 0 && (
                <button 
                  onClick={handleToggleCasesView}
                  className="flex items-center gap-2 text-teal-400 hover:text-teal-300 transition-colors"
                  disabled={casesLoading}
                >
                  {casesLoading ? (
                    <div className="w-4 h-4 border-2 border-teal-400 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>{showAllCases ? 'Show Recent' : 'View All'}</span>
                      <ChevronRight className={`w-4 h-4 transition-transform ${showAllCases ? 'rotate-180' : ''}`} />
                    </>
                  )}
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
                    onClick={() => case_.status !== 'generating' && case_.id && router.push(`/dashboard/case/${case_.id}`)}
                    className={`flex items-center justify-between p-4 bg-white/5 rounded-lg transition-colors ${
                      case_.status === 'generating' 
                        ? 'cursor-not-allowed opacity-60' 
                        : 'hover:bg-white/10 cursor-pointer'
                    }`}
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
                          case_.status === 'generating' ? 'text-yellow-400' :
                          'text-gray-400'
                        }`}>
                          {case_.status === 'generating' ? 'Brewing...' : case_.status}
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

          {/* Quick Actions with Glass Icons */}
          <motion.div variants={fadeInUp} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
            <h3 className="text-xl font-bold text-white mb-6 text-center">Quick Actions</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleStartNewMission}
                className="group text-center cursor-pointer"
              >
                <div className="mb-4 flex justify-center">
                  <GlassIcons
                    items={[{
                      icon: <Eye className="w-6 h-6 text-white" />,
                      color: 'blue',
                      label: 'New Investigation',
                    }]}
                    className="!grid-cols-1 !gap-0 !py-0"
                  />
                </div>
                <div className="p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl hover:bg-white/10 transition-all duration-300">
                  <h3 className="text-white font-semibold mb-2">Create New Investigation</h3>
                  <p className="text-gray-400 text-sm">Start a fresh murder mystery case</p>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleOpenRecentCase}
                className={`group text-center ${casesToShow.length > 0 ? 'cursor-pointer' : 'cursor-not-allowed'}`}
              >
                <div className="mb-4 flex justify-center">
                  <GlassIcons
                    items={[{
                      icon: <FolderOpen className="w-6 h-6 text-white" />,
                      color: casesToShow.length > 0 ? 'purple' : 'gray',
                      label: 'Recent Case',
                    }]}
                    className="!grid-cols-1 !gap-0 !py-0"
                  />
                </div>
                <div className={`p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl transition-all duration-300 ${
                  casesToShow.length > 0 ? 'hover:bg-white/10' : 'opacity-60'
                }`}>
                  <h3 className="text-white font-semibold mb-2">Open Recent Case</h3>
                  <p className="text-gray-400 text-sm">
                    {casesToShow.length > 0 
                      ? `Continue "${casesToShow[0]?.story?.title || 'Untitled Case'}"` 
                      : 'No recent cases available'
                    }
                  </p>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLogOut}
                className="group text-center cursor-pointer"
              >
                <div className="mb-4 flex justify-center">
                  <GlassIcons
                    items={[{
                      icon: <LogOut className="w-6 h-6 text-white" />,
                      color: 'red',
                      label: 'Log Out',
                    }]}
                    className="!grid-cols-1 !gap-0 !py-0"
                  />
                </div>
                <div className="p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl hover:bg-white/10 transition-all duration-300">
                  <h3 className="text-white font-semibold mb-2">Log Out</h3>
                  <p className="text-gray-400 text-sm">Sign out of your detective account</p>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Stats Error Display */}
          {statsError && (
            <motion.div variants={fadeInUp} className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <p className="text-red-400 text-sm">Unable to load statistics: {statsError}</p>
            </motion.div>
          )}
        </motion.div>
      </main>

      {/* Difficulty Modal */}
      <DifficultyModal
        isOpen={showDifficultyModal}
        onClose={handleCloseModal}
        onSelectDifficulty={handleSelectDifficulty}
        isGenerating={isGenerating}
        generationMessage={generationMessage}
        generationProgress={generationProgress}
      />
    </div>
  );
}
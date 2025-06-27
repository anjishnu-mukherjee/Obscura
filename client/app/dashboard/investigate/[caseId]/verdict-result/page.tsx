"use client";

import { motion } from 'framer-motion';
import { 
  Trophy, 
  XCircle, 
  CheckCircle, 
  Star,
  RotateCcw,
  Home,
  Eye,
  Award,
  Target,
  Users,
  Gavel
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/navbar';
import { useEffect, useState, Suspense } from 'react';
import Image from 'next/image';

function VerdictResultContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showConfetti, setShowConfetti] = useState(false);
  const [verdictData, setVerdictData] = useState<any>(null);
  
  const correct = searchParams.get('correct') === 'true';
  const score = parseInt(searchParams.get('score') || '0');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    
    // Load verdict data from sessionStorage
    const storedResult = sessionStorage.getItem('verdictResult');
    if (storedResult) {
      try {
        const parsedResult = JSON.parse(storedResult);
        console.log("Parsed Result: ", parsedResult);
        setVerdictData(parsedResult);
      } catch (error) {
        console.error('Error parsing verdict result:', error);
      }
    }
    
    if (correct) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
    
    // Cleanup function to remove sessionStorage data
    return () => {
      sessionStorage.removeItem('verdictResult');
    };
  }, [user, loading, router, correct]);

  const getScoreColor = (score: number) => {
    if (score >= 400) return 'text-yellow-400';
    if (score >= 300) return 'text-green-400';
    if (score >= 200) return 'text-blue-400';
    if (score >= 100) return 'text-purple-400';
    return 'text-red-400';
  };

  const getScoreGrade = (score: number) => {
    if (score >= 400) return 'S+';
    if (score >= 350) return 'S';
    if (score >= 300) return 'A+';
    if (score >= 250) return 'A';
    if (score >= 200) return 'B+';
    if (score >= 150) return 'B';
    if (score >= 100) return 'C';
    return 'D';
  };

  const getPerformanceMessage = (score: number, correct: boolean) => {
    if (correct) {
                    if (score >= 400) return "Outstanding Detective Work! You&apos;ve mastered the art of investigation.";
      if (score >= 300) return "Excellent Investigation! Your attention to detail is impressive.";
      if (score >= 200) return "Good Detective Work! You successfully cracked the case.";
      return "Case Solved! You identified the correct culprit.";
    } else {
      return "Investigation Incomplete. Review the evidence and try to understand what you missed.";
    }
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
        staggerChildren: 0.2
      }
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 relative overflow-hidden">
      <Navbar />
      
      {/* Confetti Effect */}
      {showConfetti && correct && (
        <div className="absolute inset-0 pointer-events-none z-10">
          {[...Array(50)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-yellow-400 rounded-full"
              initial={{
                x: Math.random() * window.innerWidth,
                y: -10,
                rotate: 0,
              }}
              animate={{
                y: window.innerHeight + 10,
                rotate: 360,
              }}
              transition={{
                duration: Math.random() * 3 + 2,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      )}
      
      <main className="max-w-4xl mx-auto px-6 lg:px-8 py-8">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="space-y-8 mt-16"
        >
          {/* Main Result Card */}
          <motion.div 
            variants={fadeInUp}
            className={`bg-white/5 backdrop-blur-xl border rounded-2xl p-8 text-center ${
              correct 
                ? 'border-green-400/30 shadow-2xl shadow-green-500/10' 
                : 'border-red-400/30 shadow-2xl shadow-red-500/10'
            }`}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
              className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center ${
                correct 
                  ? 'bg-gradient-to-br from-green-500 to-green-400' 
                  : 'bg-gradient-to-br from-red-500 to-red-400'
              }`}
            >
              {correct ? (
                <CheckCircle className="w-12 h-12 text-white" />
              ) : (
                <XCircle className="w-12 h-12 text-white" />
              )}
            </motion.div>
            
            <h1 className={`text-4xl font-bold mb-4 ${
              correct ? 'text-green-400' : 'text-red-400'
            }`}>
              {correct ? 'Case Solved!' : 'Case Unsolved'}
            </h1>
            
            <p className="text-gray-300 text-lg mb-6">
              {verdictData?.explanation || getPerformanceMessage(score, correct)}
            </p>
            
            {/* Score Display */}
            <div className="bg-white/10 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-center gap-4 mb-4">
                <Trophy className={`w-8 h-8 ${getScoreColor(score)}`} />
                <span className={`text-5xl font-bold ${getScoreColor(score)}`}>
                  {score}
                </span>
                <div className={`px-4 py-2 rounded-lg font-bold text-xl ${
                  getScoreColor(score)
                } border-2 ${
                  correct ? 'border-current' : 'border-gray-500'
                }`}>
                  {getScoreGrade(score)}
                </div>
              </div>
              <p className="text-gray-400">Investigation Score</p>
            </div>
          </motion.div>

          {/* AI Analysis Results */}
          {verdictData?.aiAnalysis && (
            <motion.div variants={fadeInUp} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Award className="w-6 h-6 text-teal-400" />
                AI Detective Analysis
              </h2>
              
              {/* Individual Score Categories */}
              <div className="space-y-4 mb-8">
                <h3 className="text-xl font-semibold text-white mb-4">Score Breakdown by Category</h3>
                
                {/* Name Accuracy */}
                <div className="bg-white/5 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-400 rounded-lg flex items-center justify-center">
                        <Target className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="text-white font-semibold">Suspect Identification</h4>
                        <p className="text-gray-400 text-sm">Did you identify the correct suspect?</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-red-400">
                        Success!
                      </div>
                      {/* <div className="text-sm text-gray-400">out of 160 pts</div> */}
                    </div>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-red-500 to-red-400 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${verdictData.aiAnalysis.nameCorrect ? 100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* Motive Understanding */}
                <div className="bg-white/5 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-400 rounded-lg flex items-center justify-center">
                        <Eye className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="text-white font-semibold">Motive Understanding</h4>
                        <p className="text-gray-400 text-sm">How well you understood the killer's motives</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-400">
                        {Math.round(verdictData.aiAnalysis.motiveAccuracy)} pts
                      </div>
                      <div className="text-sm text-gray-400">out of 100 pts</div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-blue-400 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${verdictData.aiAnalysis.motiveAccuracy}%` }}
                    />
                  </div>
                </div>

                {/* Evidence Quality */}
                <div className="bg-white/5 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-400 rounded-lg flex items-center justify-center">
                        <Award className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="text-white font-semibold">Evidence Quality</h4>
                        <p className="text-gray-400 text-sm">Strength of your logical deduction</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-purple-400">
                        {Math.round(verdictData.aiAnalysis.evidenceQuality)} pts
                      </div>
                      <div className="text-sm text-gray-400">out of 100 pts</div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-purple-400 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${verdictData.aiAnalysis.evidenceQuality}%` }}
                    />
                  </div>
                </div>

                {/* Detail & Insight */}
                <div className="bg-white/5 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-400 rounded-lg flex items-center justify-center">
                        <Star className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="text-white font-semibold">Detail & Insight</h4>
                        <p className="text-gray-400 text-sm">Thoroughness of your analysis</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-400">
                        {Math.round(verdictData.aiAnalysis.detailScore)} pts
                      </div>
                      <div className="text-sm text-gray-400">out of 100 pts</div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-green-400 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${verdictData.aiAnalysis.detailScore}%` }}
                    />
                  </div>
                </div>

                {/* Total AI Score */}
                <div className="bg-gradient-to-r from-teal-500/20 to-cyan-500/20 border border-teal-400/30 rounded-lg p-6 mt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-400 rounded-lg flex items-center justify-center">
                        <Trophy className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="text-white font-bold text-lg">Overall AI Analysis Score</h4>
                        <p className="text-gray-300 text-sm">Combined performance across all categories</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-teal-400">
                        {Math.round(verdictData.aiAnalysis.totalScore)} pts
                      </div>
                      <div className="text-sm text-gray-400">out of 100 pts</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* AI Feedback */}
              <div className="bg-white/5 rounded-lg p-6 mb-6">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-teal-400" />
                  Detective Assessment
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  {verdictData.aiAnalysis.feedback}
                </p>
              </div>
              
              {/* Key Insights */}
              {verdictData.aiAnalysis.keyInsights && verdictData.aiAnalysis.keyInsights.length > 0 && (
                <div className="bg-white/5 rounded-lg p-6">
                  <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-400" />
                    Key Insights
                  </h3>
                  <ul className="space-y-2">
                    {verdictData.aiAnalysis.keyInsights.map((insight: string, index: number) => (
                      <li key={index} className="text-gray-300 flex items-start gap-2">
                        <span className="text-teal-400 mt-1">•</span>
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          )}

          {/* Case Resolution - Victim and Killer Portraits */}
          {verdictData && (
            <motion.div variants={fadeInUp} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Eye className="w-6 h-6 text-teal-400" />
                Case Resolution
              </h2>
              
              <div className="grid md:grid-cols-2 gap-8">
                {/* Victim Section */}
                <div className="text-center">
                  <h3 className="text-white font-semibold mb-4 text-lg">The Victim</h3>
                  <div className="relative inline-block">
                    {/* Large victim portrait */}
                    <div className="w-48 h-60 bg-gray-800 border-2 border-gray-300 rounded-sm shadow-lg relative overflow-hidden mx-auto">
                      {verdictData.victim?.portrait ? (
                        <Image
                          src={verdictData.victim.portrait}
                          alt={`${verdictData.victim.name} - Victim`}
                          fill
                          className="object-cover filter sepia-[0.3] contrast-[1.1] saturate-[0.8]"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                          <Users className="w-16 h-16 text-gray-500" />
                        </div>
                      )}
                      {/* Photo corner clips */}
                      <div className="absolute -top-1 -left-1 w-3 h-3 bg-gray-400 rotate-45 transform origin-center"></div>
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-gray-400 rotate-45 transform origin-center"></div>
                      <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-gray-400 rotate-45 transform origin-center"></div>
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-gray-400 rotate-45 transform origin-center"></div>
                    </div>
                    {/* Victim file label */}
                    <div className="mt-4">
                      <div className="inline-block bg-red-900/80 text-red-200 text-sm px-4 py-2 rounded border border-red-700">
                        DECEASED
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <p className="text-white font-semibold text-lg">{verdictData.victim?.name}</p>
                    <p className="text-gray-400">{verdictData.victim?.profession}</p>
                    <p className="text-gray-300 text-sm">Cause: {verdictData.victim?.causeOfDeath}</p>
                    <p className="text-gray-300 text-sm">Time: {verdictData.victim?.deathTimeEstimate}</p>
                  </div>
                </div>

                {/* Killer Section */}
                <div className="text-center">
                  <h3 className="text-white font-semibold mb-4 text-lg">The {correct ? 'Convicted' : 'Real'} Killer</h3>
                  <div className="relative inline-block">
                    {/* Large killer portrait */}
                    <div className="w-48 h-60 bg-gray-800 border-2 border-gray-300 rounded-sm shadow-lg relative overflow-hidden mx-auto">
                      {verdictData.realKiller?.portrait ? (
                        <Image
                          src={verdictData.realKiller.portrait}
                          alt={`${verdictData.realKiller.name} - Killer`}
                          fill
                          className="object-cover filter sepia-[0.2] contrast-[1.05] saturate-[0.9]"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                          <Users className="w-16 h-16 text-gray-500" />
                        </div>
                      )}
                      {/* Photo corner clips */}
                      <div className="absolute -top-1 -left-1 w-3 h-3 bg-gray-400 rotate-45 transform origin-center"></div>
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-gray-400 rotate-45 transform origin-center"></div>
                      <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-gray-400 rotate-45 transform origin-center"></div>
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-gray-400 rotate-45 transform origin-center"></div>
                    </div>
                    {/* Killer file label */}
                    <div className="mt-4">
                      <div className={`inline-block text-sm px-4 py-2 rounded border ${
                        correct 
                          ? 'bg-green-900/80 text-green-200 border-green-700'
                          : 'bg-red-900/80 text-red-200 border-red-700'
                      }`}>
                        {correct ? 'CONVICTED' : 'REAL KILLER'}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <p className="text-white font-semibold text-lg">{verdictData.realKiller?.name}</p>
                    <p className="text-gray-400">{verdictData.realKiller?.role}</p>
                    {!correct && (
                      <div className="bg-red-500/10 border border-red-400/20 rounded-lg p-3 mt-3">
                        <p className="text-red-300 text-sm font-medium">True Killer Revealed</p>
                        <p className="text-gray-300 text-xs">You accused: {verdictData.accusedSuspect}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Case Summary */}
              <div className="mt-8 bg-white/5 rounded-lg p-6">
                <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <Gavel className="w-5 h-5 text-yellow-400" />
                  Case Summary
                </h4>
                <p className="text-gray-300 leading-relaxed">
                  {verdictData.caseSummary || `In this case, ${verdictData.victim?.name} was murdered by ${verdictData.realKiller?.name}. ${correct ? 'Your investigation successfully identified the correct perpetrator.' : `You identified ${verdictData.accusedSuspect} as the killer, but the real murderer was ${verdictData.realKiller?.name}.`}`}
                </p>
              </div>
            </motion.div>
          )}

          {/* Score Breakdown */}
          <motion.div variants={fadeInUp} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <Trophy className="w-6 h-6 text-yellow-400" />
              Score Breakdown
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Target className="w-5 h-5 text-blue-400" />
                    <span className="text-gray-300">AI Analysis Score</span>
                  </div>
                  <span className="text-white font-semibold">
                    {verdictData?.aiAnalysis ? Math.round(verdictData.aiAnalysis.totalScore * 4) : (correct ? 280 : 80)} pts
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Eye className="w-5 h-5 text-purple-400" />
                    <span className="text-gray-300">Investigation Bonus</span>
                  </div>
                  <span className="text-white font-semibold">
                    {verdictData?.aiAnalysis ? 
                      Math.max(0, score - Math.round(verdictData.aiAnalysis.totalScore * 4)) : 
                      Math.max(0, score - (correct ? 280 : 80))
                    } pts
                  </span>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 bg-white/5 rounded-lg">
                  <h3 className="text-white font-semibold mb-2">Score Factors</h3>
                  <ul className="text-gray-300 text-sm space-y-1">
                    <li>• Suspect identification accuracy</li>
                    <li>• Motive understanding depth</li>
                    <li>• Evidence quality & logic</li>
                    <li>• Analysis detail & insight</li>
                    <li>• Locations visited</li>
                    <li>• Suspects interrogated</li>
                    <li>• Clues discovered</li>
                    <li>• Time efficiency</li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div variants={fadeInUp} className="flex justify-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 px-6 py-3 bg-teal-500 hover:bg-teal-600 rounded-lg text-white font-medium transition-colors"
            >
              <Home className="w-5 h-5" />
              Dashboard
            </button>
            
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 px-6 py-3 bg-purple-500 hover:bg-purple-600 rounded-lg text-white font-medium transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
              New Case
            </button>
          </motion.div>

          {/* Encouragement Message */}
          <motion.div variants={fadeInUp} className="text-center">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <p className="text-gray-300 text-lg">
                {correct 
                  ? "Congratulations, Detective! Your keen observation skills and methodical approach have successfully brought justice to this case."
                  : "Every great detective learns from their investigations. Review the evidence, understand the patterns, and you'll solve the next case with confidence."
                }
              </p>
            </div>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}

export default function VerdictResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-400/20 border-t-teal-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white">Loading results...</p>
        </div>
      </div>
    }>
      <VerdictResultContent />
    </Suspense>
  );
}

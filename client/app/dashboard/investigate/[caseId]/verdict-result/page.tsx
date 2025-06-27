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
  Target
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/navbar';
import { useEffect, useState, Suspense } from 'react';

function VerdictResultContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showConfetti, setShowConfetti] = useState(false);
  
  const correct = searchParams.get('correct') === 'true';
  const score = parseInt(searchParams.get('score') || '0');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    
    if (correct) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
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
      if (score >= 400) return "Outstanding Detective Work! You've mastered the art of investigation.";
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
              {getPerformanceMessage(score, correct)}
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

          {/* Score Breakdown */}
          <motion.div variants={fadeInUp} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <Award className="w-6 h-6 text-teal-400" />
              Performance Analysis
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Target className="w-5 h-5 text-blue-400" />
                    <span className="text-gray-300">Base Score</span>
                  </div>
                  <span className="text-white font-semibold">
                    {correct ? '100' : '20'} pts
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Eye className="w-5 h-5 text-purple-400" />
                    <span className="text-gray-300">Investigation Bonus</span>
                  </div>
                  <span className="text-white font-semibold">
                    {correct ? Math.max(0, score - 100) : Math.max(0, score - 20)} pts
                  </span>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 bg-white/5 rounded-lg">
                  <h3 className="text-white font-semibold mb-2">Score Factors</h3>
                  <ul className="text-gray-300 text-sm space-y-1">
                    <li>• Correct suspect identification</li>
                    <li>• Locations visited thoroughly</li>
                    <li>• Suspects interrogated</li>
                    <li>• Clues discovered</li>
                    <li>• Quality of reasoning</li>
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

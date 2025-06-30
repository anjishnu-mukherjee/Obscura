"use client";

import { motion } from 'framer-motion';
import { 
  AlertTriangle, 
  Users, 
  ChevronLeft,
  Gavel,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  Trophy,
  BarChart3
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/navbar';
import { useEffect, useState, use } from 'react';
import { useCase } from '@/hooks/useCases';
import { Suspect } from '@/functions/types';
import Image from 'next/image';

interface FinalVerdictPageProps {
  params: Promise<{
    caseId: string;
  }>;
}

export default function FinalVerdictPage({ params }: FinalVerdictPageProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const resolvedParams = use(params);
  const { caseData, loading: isLoading, error } = useCase(resolvedParams.caseId);
  const [selectedSuspect, setSelectedSuspect] = useState<string>('');
  const [reasoning, setReasoning] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Check if case is completed and verdict was already submitted
  const isCompleted = caseData?.status === 'completed' && caseData?.verdictSubmitted;
  const previousVerdict = caseData?.verdict;

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Populate previous verdict data if case is completed
  useEffect(() => {
    if (isCompleted && previousVerdict) {
      setSelectedSuspect(previousVerdict.selectedSuspect);
      setReasoning(previousVerdict.reasoning);
    }
  }, [isCompleted, previousVerdict]);

  const handleSubmitVerdict = async () => {
    if (!selectedSuspect || !reasoning.trim()) {
      alert('Please select a suspect and provide your reasoning.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/investigation/final-verdict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId: resolvedParams.caseId,
          suspectName: selectedSuspect,
          reasoning: reasoning.trim()
        })
      });

      const result = await response.json();

      console.log("Result: ", result);
      
      if (response.ok) {
        // Store the complete result data in sessionStorage for the result page
        sessionStorage.setItem('verdictResult', JSON.stringify(result));
        // Redirect to verdict result page with basic parameters
        router.push(`/dashboard/investigate/${resolvedParams.caseId}/verdict-result?correct=${result.correct}&score=${result.score}`);
      } else {
        alert(result.error || 'Failed to submit verdict');
      }
    } catch (error) {
      console.error('Error submitting verdict:', error);
      alert('Failed to submit verdict');
    } finally {
      setIsSubmitting(false);
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
            <Gavel className="w-8 h-8 text-red-400 animate-pulse" />
          </div>
          <h2 className="text-2xl font-light text-white mb-2">Loading Verdict Panel</h2>
          <p className="text-gray-400">Preparing final assessment...</p>
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
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Verdict Unavailable</h2>
            <p className="text-gray-400 mb-6">{error || 'Unable to access case data.'}</p>
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
      
      <main className="max-w-4xl mx-auto px-6 lg:px-8 py-8">
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
            
            <div className="bg-white/5 backdrop-blur-xl border border-red-400/30 rounded-2xl p-8">
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  isCompleted 
                    ? 'bg-gradient-to-br from-teal-500 to-teal-400' 
                    : 'bg-gradient-to-br from-red-500 to-red-400'
                }`}>
                  {isCompleted ? (
                    <Trophy className="w-6 h-6 text-white" />
                  ) : (
                    <Gavel className="w-6 h-6 text-white" />
                  )}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">
                    {isCompleted ? 'Verdict Submitted' : 'Final Verdict'}
                  </h1>
                  <p className="text-gray-400">{caseData.title}</p>
                </div>
              </div>
              
              <div className={`border rounded-lg p-4 ${
                isCompleted 
                  ? 'bg-teal-500/10 border-teal-400/30' 
                  : 'bg-red-500/10 border-red-400/30'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {isCompleted ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-teal-400" />
                      <p className="text-teal-400 font-semibold">Case Completed</p>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                      <p className="text-red-400 font-semibold">Critical Decision Point</p>
                    </>
                  )}
                </div>
                <p className="text-gray-300 text-sm">
                  {isCompleted 
                    ? `You have already submitted your verdict for this case. ${
                        previousVerdict?.isCorrect 
                          ? 'You correctly identified the culprit!' 
                          : 'The real culprit was someone else.'
                      } Final Score: ${previousVerdict?.score || 0} points.`
                    : 'This is your final chance to identify the culprit. Choose carefully based on your investigation findings. Your decision will determine the outcome of this case.'
                  }
                </p>
              </div>
            </div>
          </motion.div>

          {/* Suspect Selection */}
          <motion.div variants={fadeInUp} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <Users className="w-6 h-6 text-teal-400" />
              {isCompleted ? 'Your Accused Suspect' : 'Select the Culprit'}
            </h2>
            
            {isCompleted && (
              <div className="mb-6 p-4 bg-teal-500/10 border border-teal-400/30 rounded-lg">
                <div className="flex items-center gap-2">
                  {previousVerdict?.isCorrect ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400" />
                  )}
                  <p className={`font-semibold ${
                    previousVerdict?.isCorrect ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {previousVerdict?.isCorrect 
                      ? 'Correct! You identified the real culprit.' 
                      : `Incorrect. The real culprit was ${previousVerdict?.correctSuspect}.`
                    }
                  </p>
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              {caseData.story.suspects.map((suspect: Suspect, index: number) => (
                <motion.div
                  key={suspect.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-6 border rounded-xl transition-all duration-300 ${
                    selectedSuspect === suspect.name
                      ? isCompleted
                        ? previousVerdict?.isCorrect && suspect.name === previousVerdict.correctSuspect
                          ? 'bg-green-500/20 border-green-400/50 shadow-lg shadow-green-500/10'
                          : previousVerdict?.isCorrect === false && suspect.name === selectedSuspect
                          ? 'bg-red-500/20 border-red-400/50 shadow-lg shadow-red-500/10'
                          : 'bg-yellow-500/20 border-yellow-400/50 shadow-lg shadow-yellow-500/10'
                        : 'bg-red-500/20 border-red-400/50 shadow-lg shadow-red-500/10'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-teal-400/50'
                  } ${isCompleted ? 'cursor-default' : 'cursor-pointer'}`}
                  onClick={() => !isCompleted && setSelectedSuspect(suspect.name)}
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
                          <div className={`inline-block text-xs px-2 py-1 rounded border ${
                            isCompleted && selectedSuspect === suspect.name
                              ? previousVerdict?.isCorrect && suspect.name === previousVerdict.correctSuspect
                                ? 'bg-green-900/80 text-green-200 border-green-700'
                                : 'bg-red-900/80 text-red-200 border-red-700'
                              : selectedSuspect === suspect.name
                              ? 'bg-red-900/80 text-red-200 border-red-700'
                              : 'bg-yellow-900/80 text-yellow-200 border-yellow-700'
                          }`}>
                            {isCompleted && selectedSuspect === suspect.name
                              ? previousVerdict?.isCorrect && suspect.name === previousVerdict.correctSuspect
                                ? 'GUILTY'
                                : 'ACCUSED'
                              : selectedSuspect === suspect.name 
                              ? 'ACCUSED' 
                              : 'SUSPECT'
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Suspect Information */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-white font-semibold text-lg">{suspect.name}</h3>
                          <p className="text-gray-400 text-sm mb-2">{suspect.role}</p>
                          <p className="text-gray-300 text-sm line-clamp-2">{suspect.personality}</p>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                            selectedSuspect === suspect.name
                              ? isCompleted && previousVerdict?.isCorrect && suspect.name === previousVerdict.correctSuspect
                                ? 'bg-gradient-to-br from-green-500 to-green-400'
                                : 'bg-gradient-to-br from-red-500 to-red-400'
                              : 'bg-gradient-to-br from-gray-600 to-gray-500'
                          }`}>
                            <Users className="w-6 h-6 text-white" />
                          </div>
                          
                          {selectedSuspect === suspect.name && (
                            <div className="flex items-center gap-2">
                              {isCompleted ? (
                                previousVerdict?.isCorrect && suspect.name === previousVerdict.correctSuspect ? (
                                  <CheckCircle className="w-6 h-6 text-green-400" />
                                ) : (
                                  <XCircle className="w-6 h-6 text-red-400" />
                                )
                              ) : (
                                <CheckCircle className="w-6 h-6 text-red-400" />
                              )}
                            </div>
                          )}
                          
                          {/* Show if this is the real killer (only when case is completed) */}
                          {isCompleted && suspect.name === previousVerdict?.correctSuspect && selectedSuspect !== suspect.name && (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                <Gavel className="w-3 h-3 text-white" />
                              </div>
                              <span className="text-green-400 text-xs font-medium">REAL KILLER</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Reasoning Section */}
          <motion.div variants={fadeInUp} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <Eye className="w-6 h-6 text-teal-400" />
              Your Reasoning
            </h2>
            
            <textarea
              value={reasoning}
              onChange={(e) => !isCompleted && setReasoning(e.target.value)}
              placeholder={isCompleted 
                ? "Your submitted reasoning..." 
                : "Explain your reasoning for selecting this suspect. Include evidence, motives, and any inconsistencies you discovered during your investigation..."
              }
              className={`w-full h-40 border rounded-lg p-4 text-white resize-none transition-colors ${
                isCompleted 
                  ? 'bg-gray-800/50 border-gray-600 cursor-default' 
                  : 'bg-white/5 border-white/10 placeholder-gray-400 focus:outline-none focus:border-teal-400/50'
              }`}
              maxLength={1000}
              readOnly={isCompleted}
            />
            
            <div className="flex justify-between items-center mt-2">
              <p className="text-gray-400 text-sm">
                {isCompleted 
                  ? "Your submitted reasoning for the verdict" 
                  : "Provide detailed reasoning to support your verdict"
                }
              </p>
              <p className="text-gray-400 text-sm">
                {reasoning.length}/1000
              </p>
            </div>
          </motion.div>

          {/* Submit Section or Scoreboard Section */}
          <motion.div variants={fadeInUp} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
            <div className="text-center">
              {isCompleted ? (
                <>
                  <h3 className="text-xl font-bold text-white mb-4">Case Completed</h3>
                  <div className="mb-6">
                    <div className="flex justify-center items-center gap-4 mb-4">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                        previousVerdict?.isCorrect 
                          ? 'bg-gradient-to-br from-green-500 to-green-400' 
                          : 'bg-gradient-to-br from-orange-500 to-orange-400'
                      }`}>
                        {previousVerdict?.isCorrect ? (
                          <Trophy className="w-8 h-8 text-white" />
                        ) : (
                          <BarChart3 className="w-8 h-8 text-white" />
                        )}
                      </div>
                    </div>
                    <p className={`text-lg font-semibold mb-2 ${
                      previousVerdict?.isCorrect ? 'text-green-400' : 'text-orange-400'
                    }`}>
                      Final Score: {previousVerdict?.score || 0} Points
                    </p>
                    <p className="text-gray-400">
                      {previousVerdict?.isCorrect 
                        ? 'Excellent detective work! You solved the case correctly.' 
                        : 'Good investigation effort! Review the case details to improve your detective skills.'
                      }
                    </p>
                  </div>
                  
                  <div className="flex justify-center gap-4">
                    <button
                      onClick={() => router.push(`/dashboard/investigate/${resolvedParams.caseId}`)}
                      className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
                    >
                      Back to Case
                    </button>
                    
                    <button
                      onClick={() => {
                        // Reconstruct the complete verdict result data for the scoreboard
                        if (previousVerdict && caseData) {
                          const verdictResultData = {
                            correct: previousVerdict.isCorrect,
                            score: previousVerdict.score,
                            correctSuspect: previousVerdict.correctSuspect,
                            explanation: previousVerdict.aiAnalysis?.explanation || 'Case completed successfully.',
                            // Add victim information
                            victim: {
                              name: caseData.story?.victim?.name,
                              portrait: caseData.story?.victim?.portrait,
                              profession: caseData.story?.victim?.profession || caseData.story?.victim?.role,
                              causeOfDeath: caseData.story?.victim?.causeOfDeath || "Murder",
                              deathTimeEstimate: caseData.story?.victim?.timeOfDeath || "Unknown"
                            },
                            // Add real killer information
                            realKiller: {
                              name: previousVerdict.correctSuspect,
                              portrait: caseData.story?.suspects?.find((s: Suspect) => 
                                s.name.toLowerCase() === previousVerdict.correctSuspect?.toLowerCase()
                              )?.portrait,
                              role: caseData.story?.suspects?.find((s: Suspect) => 
                                s.name.toLowerCase() === previousVerdict.correctSuspect?.toLowerCase()
                              )?.role
                            },
                            // Add accused suspect
                            accusedSuspect: previousVerdict.selectedSuspect,
                            // Add case summary
                            caseSummary: `In this case, ${caseData.story?.victim?.name} was murdered by ${previousVerdict.correctSuspect}. ${
                              previousVerdict.isCorrect 
                                ? 'Your investigation successfully identified the correct perpetrator.' 
                                : `You identified ${previousVerdict.selectedSuspect} as the killer, but the real murderer was ${previousVerdict.correctSuspect}.`
                            }`,
                            // Include the detailed AI analysis
                            aiAnalysis: previousVerdict.aiAnalysis || {
                              explanation: previousVerdict.isCorrect ? 'Correct suspect identified!' : 'Incorrect suspect identified.',
                              nameCorrect: previousVerdict.isCorrect,
                              motiveAccuracy: previousVerdict.isCorrect ? 80 : 20,
                              evidenceQuality: 60,
                              detailScore: 50,
                              totalScore: previousVerdict.isCorrect ? 70 : 30,
                              feedback: previousVerdict.isCorrect 
                                ? 'Excellent detective work! You correctly identified the perpetrator.' 
                                : 'Good investigation effort, but the real killer was someone else.',
                              keyInsights: []
                            }
                          };
                          
                          // Store the complete result data in sessionStorage
                          sessionStorage.setItem('verdictResult', JSON.stringify(verdictResultData));
                        }
                        
                        // Navigate to verdict result page
                        router.push(`/dashboard/investigate/${resolvedParams.caseId}/verdict-result?correct=${previousVerdict?.isCorrect}&score=${previousVerdict?.score}`);
                      }}
                      className="group relative px-8 py-3 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white font-semibold rounded-lg transition-all duration-300 hover:shadow-xl hover:shadow-teal-500/25"
                    >
                      <div className="relative flex items-center space-x-2">
                        <BarChart3 className="w-5 h-5" />
                        <span>View Detailed Scoreboard</span>
                      </div>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-bold text-white mb-4">Ready to Submit Your Verdict?</h3>
                  <p className="text-gray-400 mb-6">
                    Once submitted, your verdict cannot be changed. Make sure you&apos;re confident in your decision.
                  </p>
                  
                  <div className="flex justify-center gap-4">
                    <button
                      onClick={() => router.back()}
                      className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    
                    <button
                      onClick={handleSubmitVerdict}
                      disabled={!selectedSuspect || !reasoning.trim() || isSubmitting}
                      className="group relative px-8 py-3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-semibold rounded-lg transition-all duration-300 hover:shadow-xl hover:shadow-red-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="relative flex items-center space-x-2">
                        {isSubmitting ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Submitting...</span>
                          </>
                        ) : (
                          <>
                            <Gavel className="w-5 h-5" />
                            <span>Submit Final Verdict</span>
                          </>
                        )}
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}

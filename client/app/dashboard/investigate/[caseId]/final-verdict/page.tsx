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
  XCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/navbar';
import { useEffect, useState, use } from 'react';
import { useCase } from '@/hooks/useCases';
import { Suspect } from '@/functions/types';

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
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

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
      
      if (response.ok) {
        // Redirect to verdict result page with the result
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
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-400 rounded-lg flex items-center justify-center">
                  <Gavel className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Final Verdict</h1>
                  <p className="text-gray-400">{caseData.title}</p>
                </div>
              </div>
              
              <div className="bg-red-500/10 border border-red-400/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <p className="text-red-400 font-semibold">Critical Decision Point</p>
                </div>
                <p className="text-gray-300 text-sm">
                  This is your final chance to identify the culprit. Choose carefully based on your investigation findings.
                  Your decision will determine the outcome of this case.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Suspect Selection */}
          <motion.div variants={fadeInUp} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <Users className="w-6 h-6 text-teal-400" />
              Select the Culprit
            </h2>
            
            <div className="space-y-4">
              {caseData.story.suspects.map((suspect: Suspect, index: number) => (
                <motion.div
                  key={suspect.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-6 border rounded-xl cursor-pointer transition-all duration-300 ${
                    selectedSuspect === suspect.name
                      ? 'bg-red-500/20 border-red-400/50 shadow-lg shadow-red-500/10'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-teal-400/50'
                  }`}
                  onClick={() => setSelectedSuspect(suspect.name)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        selectedSuspect === suspect.name
                          ? 'bg-gradient-to-br from-red-500 to-red-400'
                          : 'bg-gradient-to-br from-gray-600 to-gray-500'
                      }`}>
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold text-lg">{suspect.name}</h3>
                        <p className="text-gray-400 text-sm mb-1">{suspect.role}</p>
                        <p className="text-gray-300 text-sm">{suspect.personality}</p>
                      </div>
                    </div>
                    
                    {selectedSuspect === suspect.name && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-6 h-6 text-red-400" />
                      </div>
                    )}
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
              onChange={(e) => setReasoning(e.target.value)}
              placeholder="Explain your reasoning for selecting this suspect. Include evidence, motives, and any inconsistencies you discovered during your investigation..."
              className="w-full h-40 bg-white/5 border border-white/10 rounded-lg p-4 text-white placeholder-gray-400 resize-none focus:outline-none focus:border-teal-400/50 transition-colors"
              maxLength={1000}
            />
            
            <div className="flex justify-between items-center mt-2">
              <p className="text-gray-400 text-sm">
                Provide detailed reasoning to support your verdict
              </p>
              <p className="text-gray-400 text-sm">
                {reasoning.length}/1000
              </p>
            </div>
          </motion.div>

          {/* Submit Section */}
          <motion.div variants={fadeInUp} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
            <div className="text-center">
              <h3 className="text-xl font-bold text-white mb-4">Ready to Submit Your Verdict?</h3>
              <p className="text-gray-400 mb-6">
                Once submitted, your verdict cannot be changed. Make sure you're confident in your decision.
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
            </div>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}

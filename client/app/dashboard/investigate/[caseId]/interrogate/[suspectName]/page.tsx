"use client";

import { motion } from "framer-motion";
import {
  User,
  Send,
  ChevronLeft,
  FileText,
  AlertCircle,
  MessageCircle,
  Clock,
  CheckCircle,
  Plus,
  Trash2,
  Play,
  Volume2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/navbar";
import { useEffect, useState, use } from "react";
import { useCase } from "@/hooks/useCases";
import { canInterrogateSuspect } from "@/lib/investigationUtils";
import { Suspect } from "@/functions/types";
import FloatingNotepad from "@/components/FloatingNotepad";
import FloatingWatson from "@/components/FloatingWatson";

interface InterrogatePageProps {
  params: Promise<{
    caseId: string;
    suspectName: string;
  }>;
}

export default function InterrogatePage({ params }: InterrogatePageProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const resolvedParams = use(params);
  const {
    caseData,
    loading: isLoading,
    error,
  } = useCase(resolvedParams.caseId);
  const [questions, setQuestions] = useState<string[]>([""]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [interrogationComplete, setInterrogationComplete] = useState(false);
  const [conversation, setConversation] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

  const suspectName = decodeURIComponent(resolvedParams.suspectName);
  const suspect = caseData?.story.suspects.find(
    (s: any) => s.name === suspectName
  );
  const progress = caseData?.investigationProgress;
  const existingInterrogation = progress?.interrogatedSuspects[suspectName];
  const canInterrogate = progress ? canInterrogateSuspect(progress, suspectName) : true;

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);



  const addQuestion = () => {
    if (questions.length < 10) {
      setQuestions([...questions, ""]);
    }
  };

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const updateQuestion = (index: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[index] = value;
    setQuestions(newQuestions);
  };

  const handleStartInterrogation = async () => {
    const validQuestions = questions.filter((q) => q.trim());
    if (validQuestions.length === 0 || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/investigation/interrogate-suspect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId: resolvedParams.caseId,
          suspectName,
          questions: validQuestions,
          name: user?.displayName || "Detective Morgan",
        }),
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        setConversation(result.conversation);
        // Use direct URL method with audioId
        const directAudioUrl = `/api/getAudio?id=${result.audioId}`;
        setAudioUrl(directAudioUrl);
        setShowResults(true);
        console.log("Audio URL:", directAudioUrl);
      } else {
        alert(result.error || "Failed to start interrogation");
      }
    } catch (error) {
      console.error("Error starting interrogation:", error);
      alert("Failed to start interrogation");
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
            <User className="w-8 h-8 text-teal-400 animate-pulse" />
          </div>
          <h2 className="text-2xl font-light text-white mb-2">
            Preparing Interrogation
          </h2>
          <p className="text-gray-400">Setting up secure interview room...</p>
        </motion.div>
      </div>
    );
  }

  if (!user || error || !caseData || !suspect) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900">
        <Navbar />
        <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          <div className="text-center mt-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 backdrop-blur-xl border border-red-400/30 rounded-2xl mb-6">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Interrogation Unavailable
            </h2>
            <p className="text-gray-400 mb-6">
              {error ||
                (!suspect
                  ? "Suspect not found"
                  : "Unable to access interrogation data.")}
            </p>
            <button
              onClick={() =>
                router.push(`/dashboard/investigate/${resolvedParams.caseId}`)
              }
              className="inline-flex items-center gap-2 px-6 py-3 bg-teal-500 hover:bg-teal-600 rounded-lg text-white font-medium transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Investigation
            </button>
          </div>
        </main>
      </div>
    );
  }

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  // Show completion screen first
  if (interrogationComplete) {
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
            <motion.div variants={fadeInUp} className="mt-16 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/20 backdrop-blur-xl border border-green-400/30 rounded-2xl mb-6">
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-4">
                Interrogation Complete
              </h1>
              <p className="text-gray-400 mb-8">
                You have successfully interrogated {suspect.name}.
                <br />
                You can interrogate another suspect tomorrow at 12 AM IST.
              </p>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={() =>
                    router.push(
                      `/dashboard/investigate/${resolvedParams.caseId}`
                    )
                  }
                  className="inline-flex items-center gap-2 px-6 py-3 bg-teal-500 hover:bg-teal-600 rounded-lg text-white font-medium transition-colors"
                >
                  Continue Investigation
                </button>
                <button
                  onClick={() =>
                    router.push(`/dashboard/case/${resolvedParams.caseId}`)
                  }
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium transition-colors"
                >
                  Back to Case File
                </button>
              </div>
            </motion.div>
          </motion.div>
        </main>
        
        {/* Floating Components */}
        <FloatingNotepad caseId={resolvedParams.caseId} />
        <FloatingWatson caseId={resolvedParams.caseId} />
      </div>
    );
  }

  // Show interrogation results
  if (showResults && conversation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900">
        <Navbar />

        <main className="max-w-6xl mx-auto px-6 lg:px-8 py-8">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="space-y-8"
          >
            <motion.div variants={fadeInUp} className="mt-16">
              <button
                onClick={() =>
                  router.push(`/dashboard/investigate/${resolvedParams.caseId}`)
                }
                className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
              >
                <ChevronLeft className="w-4 h-4" />
                Back to Investigation
              </button>

              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-400 rounded-xl flex items-center justify-center">
                      <User className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-white">
                        Interrogation Complete
                      </h1>
                      <p className="text-gray-400">
                        {suspect.name} - {suspect.role}
                      </p>
                    </div>
                  </div>

                  {audioUrl && (
                    <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-green-600/20 to-green-500/20 border border-green-400/30 rounded-xl">
                      <Volume2 className="w-5 h-5 text-green-400" />
                      <span className="text-green-400 font-medium">Audio Ready</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Audio Player Section */}
            {audioUrl && (
              <motion.div
                variants={fadeInUp}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8"
              >
                <div className="flex items-center gap-3 mb-4">
                  <Volume2 className="w-6 h-6 text-green-400" />
                  <h2 className="text-xl font-bold text-white">
                    Audio Recording
                  </h2>
                </div>
                <div className="bg-green-500/10 border border-green-400/20 rounded-lg p-6">
                  <audio controls className="w-full" key={audioUrl}>
                    <source src={audioUrl} type="audio/wav" />
                    Your browser does not support the audio element.
                  </audio>
                  <p className="text-sm text-green-400 mt-3 opacity-75">
                    Interrogation audio recording - Use controls to play, pause, and seek
                  </p>
                </div>
              </motion.div>
            )}

            {/* Conversation Transcript */}
            <motion.div
              variants={fadeInUp}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <MessageCircle className="w-6 h-6 text-teal-400" />
                <h2 className="text-xl font-bold text-white">
                  Interrogation Transcript
                </h2>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-6 max-h-96 overflow-y-auto">
                <pre className="text-gray-300 leading-relaxed whitespace-pre-wrap font-mono text-sm">
                  {conversation}
                </pre>
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div variants={fadeInUp} className="flex justify-center">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  console.log("Complete Interrogation button clicked!");
                  setInterrogationComplete(true);
                }}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-teal-600 to-teal-500 rounded-xl text-white font-bold text-lg transition-all duration-300"
              >
                <CheckCircle className="w-6 h-6" />
                Complete Interrogation
              </motion.button>
            </motion.div>
          </motion.div>
        </main>
        
        {/* Floating Components */}
        <FloatingNotepad caseId={resolvedParams.caseId} />
        <FloatingWatson caseId={resolvedParams.caseId} />
      </div>
    );
  }



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
              onClick={() =>
                router.push(`/dashboard/investigate/${resolvedParams.caseId}`)
              }
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Investigation
            </button>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-400 rounded-xl flex items-center justify-center">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">
                    {suspect.name}
                  </h1>
                  <p className="text-gray-400">{suspect.role}</p>
                </div>
              </div>

              <div className={`${
                canInterrogate 
                  ? 'bg-yellow-500/10 border-yellow-400/20' 
                  : 'bg-red-500/10 border-red-400/20'
              } border rounded-lg p-4 mb-6`}>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className={`w-4 h-4 ${canInterrogate ? 'text-yellow-400' : 'text-red-400'}`} />
                  <span className={`font-medium ${canInterrogate ? 'text-yellow-400' : 'text-red-400'}`}>
                    {canInterrogate ? 'Daily Limit Notice' : 'Already Interrogated Today'}
                  </span>
                </div>
                <p className={`text-sm ${canInterrogate ? 'text-yellow-100' : 'text-red-100'}`}>
                  {canInterrogate 
                    ? 'You can only interrogate one suspect per day. This opportunity resets at 12 AM IST.'
                    : 'You have already interrogated a suspect today. You can interrogate another suspect tomorrow at 12 AM IST.'
                  }
                </p>
              </div>
            </div>
          </motion.div>

          {/* Suspect Information */}
          <motion.div
            variants={fadeInUp}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8"
          >
            <h2 className="text-2xl font-bold text-white mb-6">
              Suspect Profile
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-white font-semibold mb-3">Background</h3>
                <div className="space-y-3">
                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-gray-400 text-sm mb-1">Role</p>
                    <p className="text-white">{suspect.role}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-gray-400 text-sm mb-1">Personality</p>
                    <p className="text-white">{suspect.personality}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-gray-400 text-sm mb-1">Alibi</p>
                    <p className="text-white">{suspect.alibi}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-white font-semibold mb-3">
                  Potential Motives
                </h3>
                <div className="space-y-2">
                  {suspect.motives.map((motive: string, index: number) => (
                    <div key={index} className="bg-white/5 rounded-lg p-3">
                      <p className="text-gray-300 text-sm">{motive}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Previous Questions (if any) */}
          {existingInterrogation &&
            existingInterrogation.questionsAsked.length > 0 && (
              <motion.div
                variants={fadeInUp}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8"
              >
                <h2 className="text-2xl font-bold text-white mb-6">
                  Previous Interrogation History
                </h2>

                <div className="space-y-4">
                  {existingInterrogation.questionsAsked.map(
                    (q: string, index: number) => (
                      <div
                        key={index}
                        className="border-l-4 border-teal-400 pl-4"
                      >
                        <div className="bg-white/5 rounded-lg p-4 mb-2">
                          <div className="flex items-center gap-2 mb-2">
                            <MessageCircle className="w-4 h-4 text-teal-400" />
                            <span className="text-teal-400 font-medium">
                              Your Question:
                            </span>
                          </div>
                          <p className="text-white">{q}</p>
                        </div>
                        {existingInterrogation.responses[index] && (
                          <div className="bg-purple-500/10 border border-purple-400/20 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <User className="w-4 h-4 text-purple-400" />
                              <span className="text-purple-400 font-medium">
                                {suspect.name}'s Response:
                              </span>
                            </div>
                            <p className="text-gray-300">
                              {existingInterrogation.responses[index]}
                            </p>
                          </div>
                        )}
                      </div>
                    )
                  )}
                </div>
              </motion.div>
            )}

          {/* Questions Input */}
          <motion.div
            variants={fadeInUp}
            className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 ${
              !canInterrogate ? 'opacity-60' : ''
            }`}
          >
            <h2 className="text-2xl font-bold text-white mb-6">
              {canInterrogate ? 'Prepare Your Questions' : 'Review Previous Interrogation'}
            </h2>

            <div className="space-y-6">
              {canInterrogate ? (
                <div className="bg-yellow-500/10 border border-yellow-400/20 rounded-lg p-4">
                  <p className="text-yellow-100 text-sm">
                    📝 Plan up to 10 questions for your interrogation. The AI will
                    create a natural conversation flow with intelligent voice
                    assignments based on character names.
                  </p>
                </div>
              ) : (
                <div className="bg-red-500/10 border border-red-400/20 rounded-lg p-4">
                  <p className="text-red-100 text-sm">
                    🚫 You cannot interrogate this suspect today as you have already used your daily interrogation limit. 
                    You can review the previous interrogation history above or return tomorrow at 12 AM IST.
                  </p>
                </div>
              )}

              {canInterrogate && (
                <>
                  <div className="space-y-4">
                    {questions.map((question, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-start gap-3"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-teal-400 font-medium">
                              Question {index + 1}
                            </span>
                            {questions.length > 1 && (
                              <button
                                onClick={() => removeQuestion(index)}
                                className="text-red-400 hover:text-red-300 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          <textarea
                            value={question}
                            onChange={(e) => updateQuestion(index, e.target.value)}
                            placeholder={`What would you like to ask ${suspect.name}?`}
                            className="w-full h-20 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent resize-none"
                            disabled={isSubmitting}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {questions.length < 10 && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={addQuestion}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-300 hover:text-white transition-all duration-300"
                      disabled={isSubmitting}
                    >
                      <Plus className="w-4 h-4" />
                      Add Question ({questions.length}/10)
                    </motion.button>
                  )}

                  <div className="flex justify-between items-center pt-4">
                    <p className="text-gray-400 text-sm">
                      🎯 This is your only interrogation opportunity today - make it
                      count!
                    </p>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleStartInterrogation}
                      disabled={!questions.some((q) => q.trim()) || isSubmitting}
                      className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-500 rounded-xl text-white font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Generating Interrogation...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          Start Interrogation
                        </>
                      )}
                    </motion.button>
                  </div>
                </>
              )}

              {!canInterrogate && (
                <div className="flex justify-center pt-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push(`/dashboard/investigate/${resolvedParams.caseId}`)}
                    className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-gray-600 to-gray-500 rounded-xl text-white font-bold transition-all duration-300"
                  >
                    <ChevronLeft className="w-5 h-5" />
                    Back to Investigation
                  </motion.button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </main>
      
      {/* Floating Components */}
      <FloatingNotepad caseId={resolvedParams.caseId} />
      <FloatingWatson caseId={resolvedParams.caseId} />
    </div>
  );
}

"use client";

import { motion } from 'framer-motion';
import { 
  Camera, 
  Users, 
  Search,
  ChevronLeft,
  FileText,
  AlertCircle,
  CheckCircle,
  Eye,
  MessageCircle,
  Loader2,
  MapPin,
  Play,
  Pause,
  Lightbulb,
  Microscope,
  Shield,
  Clock,
  Target
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/navbar';
import { useEffect, useState, useRef, use } from 'react';
import { useCase } from '@/hooks/useCases';
import { ProcessedClue, Witness } from '@/functions/types';
import FloatingNotepad from '@/components/FloatingNotepad';
import FloatingWatson from '@/components/FloatingWatson';
import Image from 'next/image';

interface LocationPageProps {
  params: Promise<{
    caseId: string;
    locationId: string;
  }>;
}

interface LocationImage {
  url: string;
  description: string;
  clueHints: string[];
}

interface WitnessInterrogation {
  conversation: string;
  audioId?: string;
  revealedClues: ProcessedClue[];
  witness: {
    name: string;
    role: string;
    reliability: string;
  };
}

export default function LocationInvestigationPage({ params }: LocationPageProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const resolvedParams = use(params);
  const { caseData, loading: isLoading, error } = useCase(resolvedParams.caseId);
  
  // State management
  const [activeSection, setActiveSection] = useState<'scene' | 'witnesses' | 'analysis'>('scene');
  const [locationImages, setLocationImages] = useState<LocationImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<LocationImage | null>(null);
  const [userObservation, setUserObservation] = useState('');
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isInterrogating, setIsInterrogating] = useState(false);
  const [witnessQuestions, setWitnessQuestions] = useState<string[]>(['']);
  const [selectedWitness, setSelectedWitness] = useState<Witness | null>(null);
  const [interrogationResult, setInterrogationResult] = useState<WitnessInterrogation | null>(null);
  const [discoveredClues, setDiscoveredClues] = useState<ProcessedClue[]>([]);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Get location data
  const location = caseData?.map.nodes.find((n: any) => n.id === resolvedParams.locationId);
  const locationName = location?.fullName || 'Unknown Location';
  const cluesAtLocation = caseData?.clues[locationName] || [];
  const witnessesAtLocation = caseData?.story.witnesses[locationName] || [];

  // Auto-generate images and load discovered clues when component loads
  useEffect(() => {
    if (caseData && user?.displayName) {
      // Load discovered clues and images from database
      loadLocationData();
    }
  }, [caseData, user?.displayName]);

  // Generate images if none were loaded from database
  useEffect(() => {
    if (caseData && user?.displayName && locationImages.length === 0 && !isGeneratingImages) {
      generateLocationImages();
    }
  }, [caseData, user?.displayName, locationImages.length]);

  const loadLocationData = async () => {
    try {
      const response = await fetch('/api/investigation/get-location-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId: resolvedParams.caseId,
          locationId: resolvedParams.locationId
        })
      });

      const result = await response.json();
      if (result.success) {
        setDiscoveredClues(result.discoveredClues || []);
        
        // Load saved images if they exist
        if (result.savedImages && result.savedImages.length > 0) {
          const savedImages = result.savedImages.map((img: any) => ({
            url: img.url,
            description: img.description,
            clueHints: img.clueHints
          }));
          setLocationImages(savedImages);
          if (savedImages.length > 0) {
            setSelectedImage(savedImages[0]);
          }
        }
      }
    } catch (error) {
      console.error('Error loading discovered clues:', error);
    }
  };

  const generateLocationImages = async () => {
    if (!user?.displayName) return;
    
    setIsGeneratingImages(true);
    try {
      const response = await fetch('/api/investigation/investigate-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId: resolvedParams.caseId,
          locationId: resolvedParams.locationId,
          action: 'generate_images',
          detectiveName: user.displayName
        })
      });

      const result = await response.json();
      if (result.success) {
        setLocationImages(result.images);
        if (result.images.length > 0) {
          setSelectedImage(result.images[0]);
        }
      } else {
        console.error('Failed to generate images:', result.error);
      }
    } catch (error) {
      console.error('Error generating images:', error);
    } finally {
      setIsGeneratingImages(false);
    }
  };

  const analyzeImage = async () => {
    if (!selectedImage || !userObservation.trim()) return;
    
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/investigation/investigate-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId: resolvedParams.caseId,
          locationId: resolvedParams.locationId,
          action: 'analyze_image',
          imageUrl: selectedImage.url,
          userObservation
        })
      });

      const result = await response.json();
      if (result.success) {
        setAnalysisResult(result);
        // Only add new clues that aren't already discovered
        const newClues = result.discoveredClues.filter((newClue: ProcessedClue) => 
          !discoveredClues.some(existing => existing.content === newClue.content)
        );
        setDiscoveredClues(prev => [...prev, ...newClues]);
        setUserObservation('');
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const interrogateWitness = async (witness: Witness) => {
    if (!user?.displayName || witnessQuestions.some(q => !q.trim())) return;
    
    setIsInterrogating(true);
    setSelectedWitness(witness);
    
    try {
      const response = await fetch('/api/investigation/investigate-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId: resolvedParams.caseId,
          locationId: resolvedParams.locationId,
          action: 'interrogate_witness',
          witnessName: witness.name,
          questions: witnessQuestions.filter(q => q.trim()),
          detectiveName: user.displayName
        })
      });

      const result = await response.json();
      if (result.success) {
        setInterrogationResult(result);
        // Only add new clues that aren't already discovered
        const newClues = result.revealedClues.filter((newClue: ProcessedClue) => 
          !discoveredClues.some(existing => existing.content === newClue.content)
        );
        setDiscoveredClues(prev => [...prev, ...newClues]);
        setWitnessQuestions(['']);
      }
    } catch (error) {
      console.error('Error interrogating witness:', error);
    } finally {
      setIsInterrogating(false);
    }
  };

  const playAudio = async (audioId: string) => {
    if (!audioRef.current) return;
    
    try {
      setIsPlayingAudio(true);
      audioRef.current.src = `/temp/output-${audioId}.wav`;
      await audioRef.current.play();
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlayingAudio(false);
    }
  };

  const addQuestion = () => {
    setWitnessQuestions([...witnessQuestions, '']);
  };

  const updateQuestion = (index: number, value: string) => {
    const updated = [...witnessQuestions];
    updated[index] = value;
    setWitnessQuestions(updated);
  };

  const removeQuestion = (index: number) => {
    if (witnessQuestions.length > 1) {
      setWitnessQuestions(witnessQuestions.filter((_, i) => i !== index));
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
        staggerChildren: 0.1
      }
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
            <FileText className="w-8 h-8 text-teal-400 animate-pulse" />
          </div>
          <h2 className="text-2xl font-light text-white mb-2">Loading Crime Scene</h2>
          <p className="text-gray-400">Preparing investigation site...</p>
        </motion.div>
      </div>
    );
  }

  if (!user || error || !caseData || !location) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900">
        <Navbar />
        <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          <div className="text-center mt-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 backdrop-blur-xl border border-red-400/30 rounded-2xl mb-6">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Location Unavailable</h2>
            <p className="text-gray-400 mb-6">Unable to access this investigation site.</p>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900">
      <Navbar />
      <audio ref={audioRef} onEnded={() => setIsPlayingAudio(false)} />
      
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
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-400 rounded-lg flex items-center justify-center">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white mb-1">Crime Scene Investigation</h1>
                    <p className="text-gray-400">{locationName}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-teal-500/20 text-teal-400 mb-2">
                    <div className="w-2 h-2 rounded-full bg-teal-400" />
                    Active Investigation
                  </div>
                  <p className="text-gray-500 text-sm">{caseData.title}</p>
                </div>
              </div>
              
              {/* Investigation Stats */}
              <div className="grid md:grid-cols-4 gap-4">
                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-gray-400 text-sm">Clues Present</p>
                    <p className="text-white font-medium">{cluesAtLocation.length} Hidden</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-purple-400" />
                  <div>
                    <p className="text-gray-400 text-sm">Witnesses</p>
                    <p className="text-white font-medium">{witnessesAtLocation.length} Available</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Microscope className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-gray-400 text-sm">Discovered</p>
                    <p className="text-white font-medium">{discoveredClues.length} Evidence</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Camera className="w-5 h-5 text-amber-400" />
                  <div>
                    <p className="text-gray-400 text-sm">Scene Images</p>
                    <p className="text-white font-medium">{locationImages.length} Generated</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Tab Navigation */}
          <motion.div variants={fadeInUp} className="flex space-x-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-1">
            <button
              onClick={() => setActiveSection('scene')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                activeSection === 'scene'
                  ? 'bg-teal-500 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Camera className="w-5 h-5" />
              Crime Scene
            </button>
            <button
              onClick={() => setActiveSection('witnesses')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                activeSection === 'witnesses'
                  ? 'bg-teal-500 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Users className="w-5 h-5" />
              Witnesses ({witnessesAtLocation.length})
            </button>
            <button
              onClick={() => setActiveSection('analysis')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                activeSection === 'analysis'
                  ? 'bg-teal-500 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Microscope className="w-5 h-5" />
              Evidence Analysis
            </button>
          </motion.div>

          {/* Content Sections */}
          {activeSection === 'scene' && (
            <motion.div variants={fadeInUp}>
              {isGeneratingImages ? (
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-500/20 rounded-2xl mb-6">
                      <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
                    </div>
                    <h3 className="text-white font-semibold mb-2">Getting Crime Scene Photographs</h3>
                    <p className="text-gray-400">Contacting Forensics Team...</p>
                  </div>
                </div>
              ) : locationImages.length === 0 ? (
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
                  <div className="text-center py-12">
                    <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-white font-semibold mb-2">No Images Available</h3>
                    <p className="text-gray-400">Crime scene images could not be generated</p>
                  </div>
                </div>
              ) : (
                <div className="grid lg:grid-cols-3 gap-8">
                  {/* Image Gallery */}
                  <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-400 rounded-lg flex items-center justify-center">
                        <Camera className="w-4 h-4 text-white" />
                      </div>
                      <h3 className="text-white font-semibold">Scene Gallery</h3>
                    </div>
                    
                    <div className="space-y-4">
                      {locationImages.map((img, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`cursor-pointer transition-all duration-200 rounded-lg overflow-hidden ${
                            selectedImage?.url === img.url 
                              ? 'ring-2 ring-teal-400 bg-teal-500/10' 
                              : 'hover:bg-white/5'
                          }`}
                          onClick={() => setSelectedImage(img)}
                        >
                          <div className="relative w-full h-24 bg-gray-800">
                            <Image
                              src={img.url}
                              alt={img.description}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="p-3">
                            <p className="text-white font-medium text-sm">{img.description}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Main Image View */}
                  <div className="lg:col-span-2 space-y-6">
                    {selectedImage && (
                      <>
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-400 rounded-lg flex items-center justify-center">
                                <Eye className="w-4 h-4 text-white" />
                              </div>
                              <h3 className="text-white font-semibold">{selectedImage.description}</h3>
                            </div>
                          </div>
                          
                          <div className="relative w-full h-96 mb-4 rounded-lg overflow-hidden bg-gray-800">
                            <Image
                              src={selectedImage.url}
                              alt={selectedImage.description}
                              fill
                              className="object-cover"
                            />
                          </div>
                          
                          {/* Investigation Hints */}
                          <div className="bg-yellow-500/10 border border-yellow-400/20 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <Lightbulb className="w-4 h-4 text-yellow-400" />
                              <p className="text-yellow-400 font-medium text-sm">Investigation Tips</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-yellow-100 text-sm">• Look carefully for objects, stains, or disturbances</p>
                              <p className="text-yellow-100 text-sm">• Notice environmental details and anomalies</p>
                              <p className="text-yellow-100 text-sm">• Describe exactly what catches your detective eye</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Image Analysis */}
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-400 rounded-lg flex items-center justify-center">
                              <Search className="w-4 h-4 text-white" />
                            </div>
                            <h3 className="text-white font-semibold">Visual Analysis</h3>
                          </div>
                          
                          <div className="space-y-4">
                            <textarea
                              placeholder="What do you observe in this crime scene? Describe any suspicious details, objects, or anomalies that catch your detective eye..."
                              value={userObservation}
                              onChange={(e) => setUserObservation(e.target.value)}
                              className="w-full h-24 bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-teal-400"
                              rows={3}
                            />
                            
                            <button 
                              onClick={analyzeImage}
                              disabled={!userObservation.trim() || isAnalyzing}
                              className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 disabled:from-gray-600 disabled:to-gray-600 text-white font-medium py-3 rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
                            >
                              {isAnalyzing ? (
                                <div className="flex items-center justify-center gap-2">
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Analyzing Scene...
                                </div>
                              ) : (
                                <div className="flex items-center justify-center gap-2">
                                  <Search className="w-4 h-4" />
                                  Analyze Observation
                                </div>
                              )}
                            </button>
                            
                            {/* Analysis Results */}
                            {analysisResult && (
                              <div className="space-y-3">
                                <div className={`p-4 rounded-lg border ${
                                  analysisResult.totalDiscovered > 0 
                                    ? 'bg-green-500/10 border-green-400/30' 
                                    : 'bg-blue-500/10 border-blue-400/30'
                                }`}>
                                  <p className={`text-sm ${
                                    analysisResult.totalDiscovered > 0 ? 'text-green-300' : 'text-blue-300'
                                  }`}>
                                    {analysisResult.analysis}
                                  </p>
                                </div>
                                
                                {analysisResult.totalDiscovered > 0 && (
                                  <div className="bg-green-500/10 border border-green-400/30 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                      <CheckCircle className="w-4 h-4 text-green-400" />
                                      <p className="text-green-400 font-medium text-sm">Evidence Discovered!</p>
                                    </div>
                                    <p className="text-green-300 text-sm">
                                      {analysisResult.totalDiscovered} new piece(s) of evidence added to your investigation notes.
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeSection === 'witnesses' && (
            <motion.div variants={fadeInUp}>
              {witnessesAtLocation.length === 0 ? (
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-white font-semibold mb-2">No Witnesses Present</h3>
                    <p className="text-gray-400">No witnesses are available for interview at this location</p>
                  </div>
                </div>
              ) : (
                <div className="grid lg:grid-cols-2 gap-8">
                  {/* Witness Selection */}
                  <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-400 rounded-lg flex items-center justify-center">
                        <Users className="w-4 h-4 text-white" />
                      </div>
                      <h3 className="text-white font-semibold">Available Witnesses</h3>
                    </div>
                    
                    <div className="space-y-4">
                      {witnessesAtLocation.map((witness: Witness, index: number) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`cursor-pointer transition-all duration-200 rounded-lg p-4 ${
                            selectedWitness?.name === witness.name 
                              ? 'bg-purple-500/20 border border-purple-400/50' 
                              : 'bg-white/5 border border-white/10 hover:bg-white/10'
                          }`}
                          onClick={() => setSelectedWitness(witness)}
                        >
                          <div className="flex items-start gap-3">
                            
                            <div className="flex-1">
                              
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-400 rounded-lg flex items-center justify-center">
                                <Users className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <h4 className="text-white font-medium">{witness.name}</h4>
                                <p className="text-gray-400 text-sm">{witness.role}</p>
                              </div>
                            </div>
                              <div className="inline-flex items-center gap-1 mt-2 px-2 py-1 bg-white/5 rounded text-xs">
                                <span className="text-gray-300">{witness.reliability}</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Witness Interview */}
                  <div className="space-y-6">
                    {selectedWitness && !interrogationResult && (
                      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-amber-400 rounded-lg flex items-center justify-center">
                            <MessageCircle className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <h3 className="text-white font-semibold">Interview {selectedWitness.name}</h3>
                            <p className="text-gray-400 text-sm">Prepare your questions</p>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="space-y-3">
                            {witnessQuestions.map((question, index) => (
                              <div key={index} className="flex gap-2">
                                <input
                                  type="text"
                                  placeholder={`Question ${index + 1}`}
                                  value={question}
                                  onChange={(e) => updateQuestion(index, e.target.value)}
                                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400"
                                />
                                {witnessQuestions.length > 1 && (
                                  <button
                                    onClick={() => removeQuestion(index)}
                                    className="px-3 py-2 bg-red-500/20 border border-red-400/30 rounded-lg text-red-400 hover:bg-red-500/30 transition-colors"
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                          
                          <div className="flex gap-3">
                            <button
                              onClick={addQuestion}
                              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-300 hover:bg-white/10 transition-colors"
                            >
                              Add Question
                            </button>
                            <button
                              onClick={() => interrogateWitness(selectedWitness)}
                              disabled={isInterrogating || witnessQuestions.some(q => !q.trim())}
                              className="flex-1 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 disabled:from-gray-600 disabled:to-gray-600 text-white font-medium py-2 rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
                            >
                              {isInterrogating ? (
                                <div className="flex items-center justify-center gap-2">
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Interviewing...
                                </div>
                              ) : (
                                <div className="flex items-center justify-center gap-2">
                                  <MessageCircle className="w-4 h-4" />
                                  Start Interview
                                </div>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Interview Results */}
                    {interrogationResult && (
                      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-400 rounded-lg flex items-center justify-center">
                              <CheckCircle className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <h3 className="text-white font-semibold">Interview Complete</h3>
                              <p className="text-gray-400 text-sm">{interrogationResult.witness.name}</p>
                            </div>
                          </div>
                          
                          {interrogationResult.audioId && (
                            <button
                              onClick={() => playAudio(interrogationResult.audioId!)}
                              className="flex items-center gap-2 px-3 py-2 bg-blue-500/20 border border-blue-400/30 rounded-lg text-blue-400 hover:bg-blue-500/30 transition-colors"
                            >
                              {isPlayingAudio ? (
                                <Pause className="w-4 h-4" />
                              ) : (
                                <Play className="w-4 h-4" />
                              )}
                              Audio
                            </button>
                          )}
                        </div>
                        
                        <div className="bg-white/5 border border-white/10 rounded-lg p-4 max-h-64 overflow-y-auto mb-4">
                          <pre className="text-gray-300 text-sm whitespace-pre-wrap font-mono">
                            {interrogationResult.conversation}
                          </pre>
                        </div>
                        
                        {interrogationResult.revealedClues.length > 0 && (
                          <div className="bg-green-500/10 border border-green-400/30 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Lightbulb className="w-4 h-4 text-green-400" />
                              <p className="text-green-400 font-medium text-sm">Information Revealed</p>
                            </div>
                            <p className="text-green-300 text-sm">
                              {interrogationResult.revealedClues.length} new piece(s) of information added to your case notes.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeSection === 'analysis' && (
            <motion.div variants={fadeInUp} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-400 rounded-lg flex items-center justify-center">
                  <Microscope className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">Investigation Summary</h2>
              </div>
              
              {discoveredClues.length === 0 ? (
                <div className="text-center py-12">
                  <Microscope className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-white font-semibold mb-2">No Evidence Discovered Yet</h3>
                  <p className="text-gray-400">Use the crime scene investigation and witness interviews to uncover evidence</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Summary Stats */}
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-green-500/10 border border-green-400/20 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-green-400 mb-1">
                        {discoveredClues.filter(c => c.category === 'direct').length}
                      </div>
                      <p className="text-green-300 text-sm">Direct Evidence</p>
                    </div>
                    <div className="bg-yellow-500/10 border border-yellow-400/20 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-yellow-400 mb-1">
                        {discoveredClues.filter(c => c.category === 'indirect').length}
                      </div>
                      <p className="text-yellow-300 text-sm">Circumstantial</p>
                    </div>
                    <div className="bg-red-500/10 border border-red-400/20 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-red-400 mb-1">
                        {discoveredClues.filter(c => c.category === 'red_herring').length}
                      </div>
                      <p className="text-red-300 text-sm">Misleading</p>
                    </div>
                  </div>
                  
                  {/* Evidence List */}
                  <div>
                    <h3 className="text-white font-semibold mb-4">Discovered Evidence ({discoveredClues.length})</h3>
                    <div className="space-y-3">
                      {discoveredClues.map((clue, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-white/5 border border-white/10 rounded-lg p-4"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className={`px-2 py-1 rounded text-xs font-medium ${
                              clue.type === 'Physical Object' ? 'bg-blue-500/20 text-blue-400' :
                              clue.type === 'Witness Testimony' ? 'bg-purple-500/20 text-purple-400' :
                              clue.type === 'Environmental Anomaly' ? 'bg-green-500/20 text-green-400' :
                              'bg-gray-500/20 text-gray-400'
                            }`}>
                              {clue.type}
                            </div>
                            <div className={`px-2 py-1 rounded text-xs font-medium ${
                              clue.category === 'direct' ? 'bg-green-500/20 text-green-400' : 
                              clue.category === 'indirect' ? 'bg-yellow-500/20 text-yellow-400' : 
                              'bg-red-500/20 text-red-400'
                            }`}>
                              {clue.category}
                            </div>
                          </div>
                          <p className="text-gray-300 text-sm leading-relaxed">{clue.content}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      </main>
      
      {/* Floating Components */}
      <FloatingNotepad caseId={resolvedParams.caseId} />
      <FloatingWatson caseId={resolvedParams.caseId} />
    </div>
  );
}

"use client";

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { 
  Search, 
  Brain, 
  Lock, 
  Volume2, 
  VolumeX, 
  Shield, 
  Eye, 
  Zap,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/navbar';
import Aurora from '@/react-bits/Aurora';
import DecryptedText from '@/react-bits/DecryptedText';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showContent, setShowContent] = useState(false);
  const router = useRouter();
  useEffect(() => {
    const timer = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => setShowContent(true), 500);
          return 100;
        }
        return prev + 2;
      });
    }, 50);

    return () => clearInterval(timer);
  }, []);

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

  const features = [
    {
      icon: Search,
      title: "AI-Generated Cases",
      description: "Every murder mystery is unique, crafted by AI with different suspects, motives, and locations"
    },
    {
      icon: Brain,
      title: "Voice-Based Interrogations",
      description: "Listen to AI-generated voice conversations as you interrogate suspects and witnesses"
    },
    {
      icon: Lock,
      title: "Watson AI Assistant",
      description: "Your personal detective AI helps analyze clues and spot inconsistencies you might miss"
    },
    {
      icon: Shield,
      title: "Dynamic Difficulty System",
      description: "From Rookie to Elite - choose your challenge level with adaptive complexity"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 relative overflow-hidden">
      {/* Navbar */}
      <Navbar />

      {/* Aurora Background - Constrained to top section */}
      <div className="absolute top-0 left-0 right-0 h-[100vh] z-0 overflow-hidden">
        <div className="relative w-full h-full">
          <Aurora
            colorStops={["#14b8a6", "#0f172a", "#dc2626"]}
            blend={0.6}
            amplitude={1.2}
            speed={0.4}
          />
          {/* Gradient fade-out at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-950 via-gray-950/80 to-transparent z-10" />
        </div>
      </div>

      {/* Ambient Background Effects */}
      <div className="absolute inset-0 z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-teal-500/5 rounded-full blur-3xl" />
      </div>

      {/* Bolt Branding Logo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: showContent ? 1 : 0, scale: showContent ? 1 : 0.8 }}
        transition={{ delay: 1.2, duration: 0.5 }}
        className="fixed bottom-8 right-8 z-40"
      >
        <Link
          href="https://bolt.new/"
          target="_blank"
          rel="noopener noreferrer"
          className="block group"
        >
          <motion.img
            src="/bolt-white-circle.jpg"
            alt="Built with Bolt"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="w-12 h-12 rounded-full cursor-pointer transition-all duration-300 hover:brightness-125 filter brightness-110"
            style={{ filter: 'brightness(1.2) contrast(1.1)' }}
          />
        </Link>
      </motion.div>

      <div className="relative z-20">
        {/* Loading Screen */}
        {!showContent && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: loadingProgress >= 100 ? 0 : 1 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black"
          >
            <div className="text-center">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5 }}
                className="mb-8"
              >
                <Eye className="w-16 h-16 text-teal-400 mx-auto mb-4" />
                <h2 className="text-2xl font-light text-white mb-2">Initializing Detective Protocol</h2>
                <p className="text-gray-400">Loading case files and AI systems...</p>
              </motion.div>
              
              <div className="w-64 h-1 bg-gray-800 rounded-full mx-auto">
                <motion.div
                  className="h-full bg-gradient-to-r from-teal-500 to-teal-300 rounded-full"
                  style={{ width: `${loadingProgress}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
              <p className="text-teal-400 mt-4 text-sm">{loadingProgress}%</p>
            </div>
          </motion.div>
        )}

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: showContent ? 1 : 0 }}
          transition={{ duration: 1 }}
          className="min-h-screen flex flex-col"
        >
          {/* Hero Section */}
          <motion.section
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="flex-1 flex items-center justify-center px-8 py-16 pt-24 min-h-[80vh]"
          >
            <div className="max-w-6xl mx-auto text-center">
              <motion.div variants={fadeInUp} className="mb-8">
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-4 tracking-tight">
                  <DecryptedText
                    text="Decode the"
                    animateOn="view"
                    speed={60}
                    maxIterations={20}
                    characters="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
                    className="text-white"
                    encryptedClassName="text-gray-500"
                  />
                  <span className="block bg-gradient-to-r from-teal-400 to-teal-200 bg-clip-text text-transparent">
                    <DecryptedText
                      text="Silence"
                      animateOn="view"
                      speed={80}
                      maxIterations={25}
                      characters="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
                      className="bg-gradient-to-r from-teal-400 to-teal-200 bg-clip-text text-transparent"
                      encryptedClassName="text-gray-600"
                    />
                  </span>
                </h1>
                
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2, delay: 0.5 }}
                  className="h-px bg-gradient-to-r from-transparent via-teal-500 to-transparent mx-auto mb-6"
                />
                
                <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl mx-auto font-light leading-relaxed">
                  An AI-powered murder mystery where every case is unique, every suspect has secrets, and only you can uncover the truth.
                </p>
              </motion.div>

              <motion.div variants={fadeInUp} className="mb-8">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="group relative px-12 py-4 bg-gradient-to-r from-teal-600 to-teal-500 text-white font-semibold rounded-full overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-teal-500/25"
                  onClick={() => router.push('/dashboard')}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-teal-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative flex items-center space-x-3">
                    <span className="text-lg">Start Investigation</span>
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <div className="absolute inset-0 ring-2 ring-teal-400/50 rounded-full group-hover:ring-teal-300 transition-colors" />
                </motion.button>
              </motion.div>
            </div>
          </motion.section>

          {/* Case File Preview - Now with solid background */}
          <motion.section
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1 }}
            className="px-8 py-12 bg-gray-950/95 relative"
            id="cases"
          >
            <div className="max-w-4xl mx-auto">
              <motion.div
                animate={{ 
                  y: [0, -10, 0],
                  rotateX: [0, 2, 0]
                }}
                transition={{ 
                  duration: 6, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
                className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl"
              >
                <div className="absolute -top-px left-8 right-8 h-px bg-gradient-to-r from-transparent via-teal-400 to-transparent" />
                <div className="absolute -bottom-px left-8 right-8 h-px bg-gradient-to-r from-transparent via-red-400 to-transparent" />
                
                <div className="grid md:grid-cols-2 gap-6 items-center">
                  <div>
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                      <span className="text-red-400 text-sm font-mono">CLASSIFIED</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">Case File #2156-X</h3>
                    <p className="text-gray-300 mb-4 leading-relaxed text-sm">
                      A high-profile CEO found dead in their locked office. Three suspects, each with motive and opportunity. 
                      Interrogate witnesses, analyze alibis, and piece together the truth before time runs out.
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Investigation Progress</span>
                        <span className="text-teal-400">3/7 Suspects Questioned</span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-2">
                        <div className="bg-gradient-to-r from-teal-500 to-teal-300 h-2 rounded-full w-1/3" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <div className="bg-gray-900/50 backdrop-blur border border-gray-700 rounded-lg p-4 font-mono text-xs">
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        <span className="text-green-400">INTERROGATION_SYSTEM_ONLINE</span>
                      </div>
                      <div className="space-y-2">
                        <div className="text-gray-500">{'>'} interrogating_suspect.exe</div>
                        <div className="text-green-400">{'>'} voice_analysis: DECEPTION_DETECTED</div>
                        <div className="text-yellow-400">{'>'} watson_ai: &quot;Notice the inconsistency...&quot;</div>
                        <motion.div
                          animate={{ opacity: [1, 0, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                          className="text-teal-400"
                        >
                          {'>'} [ANALYZING ALIBI...]
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.section>

          {/* Features Grid - Solid background */}
          <motion.section
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="px-8 py-12 bg-gray-950"
            id="features"
          >
            <div className="max-w-6xl mx-auto">
              <motion.div variants={fadeInUp} className="text-center mb-10">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  <DecryptedText
                    text="Detective Tools & Features"
                    animateOn="view"
                    speed={80}
                    maxIterations={15}
                    sequential={true}
                    revealDirection="center"
                    characters="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
                    className="text-white"
                    encryptedClassName="text-gray-600"
                    key={Math.random()} // Force re-render to trigger animation every time
                  />
                </h2>
                <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                  AI-powered investigation tools that adapt to your detective skills and help solve complex murder mysteries
                </p>
              </motion.div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {features.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    variants={fadeInUp}
                    whileHover={{ 
                      scale: 1.05,
                      rotateY: 5,
                    }}
                    className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all duration-300"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-red-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    <div className="relative">
                      <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-400 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                        <feature.icon className="w-5 h-5 text-white" />
                      </div>
                      
                      <h3 className="text-lg font-semibold text-white mb-2">
                        <DecryptedText
                          text={feature.title}
                          animateOn="hover"
                          speed={120}
                          maxIterations={8}
                          characters={feature.title}
                          className="text-white"
                          encryptedClassName="text-gray-500"
                        />
                      </h3>
                      <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.section>

          {/* Team Section */}
          <motion.section
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="px-8 py-12 bg-gradient-to-b from-gray-950 to-black"
            id="team"
          >
            <div className="max-w-6xl mx-auto">
              <motion.div variants={fadeInUp} className="text-center mb-10">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  <DecryptedText
                    text="Meet the Developers"
                    animateOn="view"
                    speed={80}
                    maxIterations={15}
                    sequential={true}
                    revealDirection="center"
                    characters="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
                    className="text-white"
                    encryptedClassName="text-gray-600"
                    key={Math.random()}
                  />
                </h2>
                <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                  The creative minds who built this AI-powered murder mystery experience from the ground up
                </p>
              </motion.div>

              <div className="grid md:grid-cols-3 gap-6">
                {[
                  {
                    name: "Arnab Sengupta",
                    role: "Chief Detective",
                    description: "Master of digital forensics and encrypted evidence analysis",
                    github: "https://github.com/asengupta07",
                    linkedin: "https://www.linkedin.com/in/asengupta07/"
                  },
                  {
                    name: "Anjishnu Mukherjee",
                    role: "Lead Investigator",
                    description: "Expert in crime scene reconstruction and witness interrogation",
                    github: "https://github.com/anjishnu-mukherjee",
                    linkedin: "https://www.linkedin.com/in/anjishnu-mukherjee-645297322/"
                  },
                  {
                    name: "Sampoorna Pyne",
                    role: "Criminal Analyst",
                    description: "Specialist in behavioral patterns and case profiling",
                    github: "https://github.com/Samk1710",
                    linkedin: "https://www.linkedin.com/in/samk1710/"
                  }
                ].map((member, index) => (
                  <motion.div
                    key={member.name}
                    variants={fadeInUp}
                    whileHover={{ 
                      scale: 1.05,
                      rotateY: 5,
                    }}
                    className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-300"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-red-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    <div className="relative text-center">
                      {/* Avatar placeholder with gradient */}
                      <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-teal-400 rounded-full flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-300">
                        <span className="text-white text-xl font-bold">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-semibold text-white mb-1">
                        <DecryptedText
                          text={member.name}
                          animateOn="hover"
                          speed={120}
                          maxIterations={8}
                          characters={member.name}
                          className="text-white"
                          encryptedClassName="text-gray-500"
                        />
                      </h3>
                      
                      <div className="text-teal-400 text-sm font-mono mb-4">{member.role}</div>
                      
                      <p className="text-gray-400 text-sm leading-relaxed mb-6">
                        {member.description}
                      </p>
                      
                      {/* Social Links */}
                      <div className="flex justify-center space-x-4">
                        <motion.a
                          href={member.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
                        >
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                          </svg>
                        </motion.a>
                        
                        <motion.a
                          href={member.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
                        >
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                          </svg>
                        </motion.a>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.section>

          {/* Footer */}
          <motion.footer
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            className="border-t border-white/10 py-8 bg-black"
          >
            <div className="max-w-6xl mx-auto px-8 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Zap className="w-6 h-6 text-teal-400" />
                <span className="text-white font-semibold text-lg">Obs<span className="text-teal-400">cura</span></span>
              </div>
              
              <p className="text-gray-400 text-sm">
                © 2025 Obscura | AI-Powered Murder Mystery Experience
              </p>
            </div>
          </motion.footer>
        </motion.div>
      </div>
    </div>
  );
}
"use client";

import { motion } from 'framer-motion';
import { Shield, Zap, Flame, X } from 'lucide-react';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface DifficultyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDifficulty: (difficulty: 'easy' | 'medium' | 'hard') => void;
  isGenerating?: boolean;
  generationMessage?: string;
  generationProgress?: number;
}

export default function DifficultyModal({ 
  isOpen, 
  onClose, 
  onSelectDifficulty, 
  isGenerating = false,
  generationMessage = "Generating your mission...",
  generationProgress = 0
}: DifficultyModalProps) {
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard' | null>(null);

  const difficulties = [
    {
      level: 'easy' as const,
      icon: Shield,
      title: 'Rookie Agent',
      description: 'Perfect for beginners. Clear clues and straightforward investigations.',
      duration: '15-25 minutes',
      color: 'from-green-500 to-green-400',
      features: ['Simple clues', 'Direct evidence', 'Helpful hints']
    },
    {
      level: 'medium' as const,
      icon: Zap,
      title: 'Field Agent',
      description: 'Balanced challenge with moderate complexity and red herrings.',
      duration: '25-40 minutes',
      color: 'from-teal-500 to-teal-400',
      features: ['Mixed clues', 'Some red herrings', 'Standard hints']
    },
    {
      level: 'hard' as const,
      icon: Flame,
      title: 'Elite Detective',
      description: 'Complex investigations with cryptic clues and minimal guidance.',
      duration: '40-60 minutes',
      color: 'from-red-500 to-red-400',
      features: ['Cryptic clues', 'Multiple red herrings', 'Minimal hints']
    }
  ];

  const handleSelect = (difficulty: 'easy' | 'medium' | 'hard') => {
    setSelectedDifficulty(difficulty);
    onSelectDifficulty(difficulty);
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => !isGenerating && onClose()}>
      <DialogTitle>Select Mission Difficulty</DialogTitle>
      <DialogDescription>Choose your challenge level to begin the investigation</DialogDescription>
      <DialogContent className="bg-gray-900/95 backdrop-blur-xl border border-white/20 rounded-2xl p-0 max-w-4xl">
        <div className="relative p-8">
          {/* Close button */}
          {!isGenerating && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          )}

          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Select Mission Difficulty</h2>
            <p className="text-gray-400">Choose your challenge level to begin the investigation</p>
          </div>

          {/* Loading state */}
          {isGenerating ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 bg-teal-500/20 backdrop-blur-xl border border-teal-400/30 rounded-2xl mb-6">
                <Shield className="w-10 h-10 text-teal-400" />
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-2">Brewing Your Perfect Mystery</h3>
              
              <motion.p 
                key={generationMessage}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-gray-400 mb-6 h-6"
              >
                {generationMessage}
              </motion.p>
              
              <div className="w-80 max-w-full mx-auto">
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                  <span>Progress</span>
                  <span>{Math.round(generationProgress)}%</span>
                </div>
                <div className="w-full h-3 bg-gray-700/50 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-teal-500 via-teal-400 to-teal-300 rounded-full relative"
                    initial={{ width: "0%" }}
                    animate={{ width: `${generationProgress}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      animate={{ x: ["-100%", "100%"] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    />
                  </motion.div>
                </div>
              </div>
              
              {/* <div className="mt-8 text-xs text-gray-500">
                <p>🔍 Generating storyline and characters</p>
                <p>🗺️ Creating crime scene locations</p>
                <p>🔍 Placing clues and evidence</p>
                <p>📸 Rendering crime scene images</p>
              </div> */}
            </motion.div>
          ) : (
            /* Difficulty selection */
            <div className="grid md:grid-cols-3 gap-6">
              {difficulties.map((difficulty, index) => (
                <motion.button
                  key={difficulty.level}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelect(difficulty.level)}
                  className={`group p-6 bg-white/5 backdrop-blur-xl border rounded-xl hover:bg-white/10 transition-all duration-300 text-left ${
                    selectedDifficulty === difficulty.level 
                      ? 'border-teal-400 bg-teal-500/10' 
                      : 'border-white/10'
                  }`}
                >
                  {/* Icon */}
                  <div className={`w-14 h-14 bg-gradient-to-br ${difficulty.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <difficulty.icon className="w-7 h-7 text-white" />
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-white mb-2">{difficulty.title}</h3>
                  
                  {/* Description */}
                  <p className="text-gray-400 text-sm mb-4">{difficulty.description}</p>
                  
                  {/* Duration */}
                  <div className="flex items-center text-teal-400 text-sm mb-4">
                    <span className="font-medium">⏱️ {difficulty.duration}</span>
                  </div>

                  {/* Features */}
                  <div className="space-y-2">
                    {difficulty.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center text-gray-300 text-xs">
                        <div className="w-1.5 h-1.5 bg-teal-400 rounded-full mr-2" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 
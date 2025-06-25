"use client";

import { motion } from 'framer-motion';
import { useState } from 'react';
import { 
  Mail, 
  Zap, 
  ArrowLeft,
  Shield,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import DecryptedText from '@/react-bits/DecryptedText';
import { resetPassword } from '@/lib/auth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    if (!email.trim()) {
      setError('Please enter your email address');
      setIsLoading(false);
      return;
    }

    try {
      const result = await resetPassword(email);
      
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
      }
    } catch (err) {
      console.error('Password reset error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-500/5 rounded-full blur-3xl" />
      </div>

      {/* Navigation */}
      <motion.nav
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 p-6"
      >
        <Link href="/" className="flex items-center space-x-3 w-fit">
          <div className="relative">
            <Zap className="w-8 h-8 text-teal-400" />
            <div className="absolute inset-0 bg-teal-400/20 blur-lg rounded-full" />
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">
            Obs<span className="text-teal-400">cura</span>
          </span>
        </Link>
      </motion.nav>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-120px)] px-6">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
          className="w-full max-w-md"
        >
          {/* Back Button */}
          <motion.div variants={fadeInUp} className="mb-6">
            <Link href="/login" className="inline-flex items-center space-x-2 text-gray-400 hover:text-teal-400 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Login</span>
            </Link>
          </motion.div>

          {/* Header */}
          <motion.div variants={fadeInUp} className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl mb-6">
              <Shield className="w-8 h-8 text-teal-400" />
            </div>
            
            <h1 className="text-3xl font-bold text-white mb-2">
              <DecryptedText
                text="Reset Access"
                animateOn="view"
                speed={60}
                maxIterations={15}
                characters="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
                className="text-white"
                encryptedClassName="text-gray-500"
              />
            </h1>
            <p className="text-gray-400">Enter your email to receive reset instructions</p>
          </motion.div>

          {/* Reset Form */}
          <motion.div
            variants={fadeInUp}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl"
          >
            <div className="absolute -top-px left-8 right-8 h-px bg-gradient-to-r from-transparent via-teal-400 to-transparent" />
            
            {success ? (
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-6">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">Reset Email Sent</h3>
                <p className="text-gray-400 mb-6">
                  Check your email for password reset instructions. The link will expire in 1 hour.
                </p>
                <Link href="/login">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3 px-4 bg-gradient-to-r from-teal-600 to-teal-500 text-white font-semibold rounded-lg transition-all duration-300 hover:shadow-2xl hover:shadow-teal-500/25"
                  >
                    Return to Login
                  </motion.button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (error) setError('');
                      }}
                      required
                      disabled={isLoading}
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="Enter your email address"
                    />
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center space-x-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3"
                  >
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: isLoading ? 1 : 1.02 }}
                  whileTap={{ scale: isLoading ? 1 : 0.98 }}
                  className="group relative w-full py-3 px-4 bg-gradient-to-r from-teal-600 to-teal-500 text-white font-semibold rounded-lg overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-teal-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-teal-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative flex items-center justify-center space-x-2">
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Sending Reset Email...</span>
                      </>
                    ) : (
                      <span>Send Reset Instructions</span>
                    )}
                  </div>
                </motion.button>
              </form>
            )}
          </motion.div>

          {/* Footer */}
          <motion.p
            variants={fadeInUp}
            className="text-center text-gray-400 text-sm mt-8"
          >
            Remember your password?{' '}
            <Link href="/login" className="text-teal-400 hover:text-teal-300 transition-colors">
              Sign in here
            </Link>
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
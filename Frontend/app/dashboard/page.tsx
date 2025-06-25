"use client";

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { 
  Zap, 
  User, 
  LogOut, 
  Shield, 
  FileText, 
  Trophy, 
  Search,
  Bell,
  Settings,
  ChevronRight,
  Eye,
  Lock,
  Brain
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { logOut } from '@/lib/auth';
import DecryptedText from '@/react-bits/DecryptedText';
import Navbar from '@/components/navbar';

export default function DashboardPage() {
  const { user, userData, loading } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logOut();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  };

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

  const stats = [
    { label: 'Cases Completed', value: userData?.stats?.casesCompleted || 0, icon: Trophy },
    { label: 'Evidence Found', value: userData?.stats?.evidenceFound || 0, icon: Search },
    { label: 'Current Rank', value: userData?.stats?.rank || 'Rookie Agent', icon: Shield },
  ];

  const recentCases = [
    { id: '2156-X', title: 'The Encrypted Messages', status: 'Active', progress: 47 },
    { id: '2157-A', title: 'Digital Phantom', status: 'Completed', progress: 100 },
    { id: '2158-B', title: 'The Silent Network', status: 'Pending', progress: 0 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900">
      {/* Navbar (dashboard mode) */}
      <Navbar variant="dashboard" user={user} userData={userData} onLogout={handleLogout} isLoggingOut={isLoggingOut} />
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

          {/* Stats Grid */}
          <motion.div variants={fadeInUp} className="grid md:grid-cols-3 gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                whileHover={{ scale: 1.02, rotateY: 5 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-400 rounded-lg flex items-center justify-center">
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">{stat.value}</h3>
                <p className="text-gray-400 text-sm">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Recent Cases */}
          <motion.div variants={fadeInUp} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Recent Cases</h2>
              <button className="text-teal-400 hover:text-teal-300 transition-colors">
                View All
              </button>
            </div>
            
            <div className="space-y-4">
              {recentCases.map((case_, index) => (
                <motion.div
                  key={case_.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-400 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">Case #{case_.id}</h3>
                      <p className="text-gray-400 text-sm">{case_.title}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className={`text-sm font-medium ${
                        case_.status === 'Active' ? 'text-teal-400' :
                        case_.status === 'Completed' ? 'text-green-400' :
                        'text-gray-400'
                      }`}>
                        {case_.status}
                      </p>
                      <p className="text-gray-400 text-xs">{case_.progress}% Complete</p>
                    </div>
                    <div className="w-16 h-2 bg-gray-700 rounded-full">
                      <div 
                        className="h-full bg-gradient-to-r from-teal-500 to-teal-300 rounded-full transition-all duration-300"
                        style={{ width: `${case_.progress}%` }}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={fadeInUp} className="grid md:grid-cols-3 gap-6">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl hover:bg-white/10 transition-all duration-300 text-left"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-400 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-white font-semibold mb-2">New Investigation</h3>
              <p className="text-gray-400 text-sm">Start a new case investigation</p>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl hover:bg-white/10 transition-all duration-300 text-left"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-400 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Lock className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-white font-semibold mb-2">Decrypt Evidence</h3>
              <p className="text-gray-400 text-sm">Analyze encrypted materials</p>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl hover:bg-white/10 transition-all duration-300 text-left"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-400 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-white font-semibold mb-2">AI Analysis</h3>
              <p className="text-gray-400 text-sm">Run pattern recognition</p>
            </motion.button>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
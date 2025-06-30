"use client";

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { 
  Zap, 
  Menu, 
  X, 
  Shield, 
  FileText, 
  Users, 
  Brain,
  Eye,
  Bell,
  Settings,
  User,
  LogOut
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { logOut } from '@/lib/auth';
import { useAuth } from '@/hooks/useAuth';


export default function Navbar() {
  const { user, userData } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter()

  const onLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logOut();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  };

  // Smooth scroll function
  const handleSmoothScroll = (targetId: string) => {
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest'
      });
    }
    // Close mobile menu if open
    setIsMenuOpen(false);
  };

  const navItems = [
    { name: 'Case Preview', targetId: 'cases', icon: FileText },
    { name: 'Detective Tools', targetId: 'features', icon: Brain },
    { name: 'Meet the Team', targetId: 'team', icon: Users },
  ];

  if (user && userData) {
    // Dashboard navbar
    return (
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-xl border-b border-white/10"
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center space-x-3 cursor-pointer"
              >
                <div className="relative">
                  <Zap className="w-8 h-8 text-teal-400" />
                  <div className="absolute inset-0 bg-teal-400/20 blur-lg rounded-full" />
                </div>
                <span className="text-2xl font-bold text-white tracking-tight">
                  Obs<span className="text-teal-400">cura</span>
                </span>
              </motion.div>
            </Link>
            {/* Dashboard user menu */}
            <div className="flex items-center space-x-4">
              
              <div className="flex items-center space-x-3 px-4 py-2 bg-white/5 rounded-lg">
                <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-teal-400 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="text-white font-medium">
                  {userData?.name || user?.displayName || 'Agent'}
                </span>
              </div>
              <motion.button
                onClick={onLogout}
                disabled={isLoggingOut}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50"
              >
                <LogOut className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.nav>
    );
  }

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-xl border-b border-white/10"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center space-x-3 cursor-pointer"
            >
              <div className="relative">
                <Zap className="w-8 h-8 text-teal-400" />
                <div className="absolute inset-0 bg-teal-400/20 blur-lg rounded-full" />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">
                Obs<span className="text-teal-400">cura</span>
              </span>
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item, index) => (
              <motion.button
                key={item.name}
                onClick={() => handleSmoothScroll(item.targetId)}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index, duration: 0.5 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors duration-300 cursor-pointer"
              >
                <item.icon className="w-4 h-4" />
                <span className="font-medium">{item.name}</span>
              </motion.button>
            ))}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/login">
              <motion.button
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors duration-300 font-medium"
              >
                Login
              </motion.button>
            </Link>
            
            <Link href="/signup">
              <motion.button
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: "0 0 20px rgba(20, 184, 166, 0.4)"
                }}
                whileTap={{ scale: 0.95 }}
                className="group relative px-6 py-2 bg-white/5 backdrop-blur-md border border-white/20 rounded-full text-white font-medium overflow-hidden transition-all duration-300 hover:bg-white/10 hover:border-teal-400/50"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-teal-600/20 to-teal-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative">Sign Up</span>
              </motion.button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-gray-300 hover:text-white transition-colors"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </motion.button>
        </div>

        {/* Mobile Menu */}
        <motion.div
          initial={false}
          animate={{
            height: isMenuOpen ? 'auto' : 0,
            opacity: isMenuOpen ? 1 : 0
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="md:hidden overflow-hidden bg-black/40 backdrop-blur-xl border-t border-white/10"
        >
          <div className="px-4 py-6 space-y-4">
            {navItems.map((item, index) => (
              <motion.button
                key={item.name}
                onClick={() => handleSmoothScroll(item.targetId)}
                initial={{ opacity: 0, x: -20 }}
                animate={{ 
                  opacity: isMenuOpen ? 1 : 0, 
                  x: isMenuOpen ? 0 : -20 
                }}
                transition={{ delay: 0.1 * index, duration: 0.3 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center space-x-3 text-gray-300 hover:text-white transition-colors duration-300 py-2 w-full text-left"
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </motion.button>
            ))}
            
            <div className="pt-4 border-t border-white/10 space-y-3">
              <Link href="/login">
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ 
                    opacity: isMenuOpen ? 1 : 0, 
                    x: isMenuOpen ? 0 : -20 
                  }}
                  transition={{ delay: 0.5, duration: 0.3 }}
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full text-left px-4 py-2 text-gray-300 hover:text-white transition-colors duration-300 font-medium"
                >
                  Login
                </motion.button>
              </Link>
              
              <Link href="/signup">
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ 
                    opacity: isMenuOpen ? 1 : 0, 
                    x: isMenuOpen ? 0 : -20 
                  }}
                  transition={{ delay: 0.6, duration: 0.3 }}
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full px-4 py-2 bg-white/5 backdrop-blur-md border border-white/20 rounded-lg text-white font-medium hover:bg-white/10 hover:border-teal-400/50 transition-all duration-300"
                >
                  Sign Up
                </motion.button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.nav>
  );
}
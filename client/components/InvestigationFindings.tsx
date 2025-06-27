"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  MapPin,
  Eye,
  ChevronDown,
  ChevronUp,
  Badge
} from 'lucide-react';
import { InvestigationFinding } from '@/functions/types';

interface InvestigationFindingsProps {
  caseId: string;
}

const InvestigationFindings: React.FC<InvestigationFindingsProps> = ({ caseId }) => {
  const [findings, setFindings] = useState<InvestigationFinding[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [filter, setFilter] = useState<'all' | 'critical' | 'important' | 'minor'>('all');

  useEffect(() => {
    console.log('InvestigationFindings: caseId changed to:', caseId);
    if (caseId) {
      fetchFindings();
    }
  }, [caseId]);

  const fetchFindings = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('InvestigationFindings: Fetching findings for caseId:', caseId);
      const response = await fetch(`/api/investigation/findings?caseId=${caseId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('InvestigationFindings: API result:', result);
      
      if (result.success) {
        console.log('InvestigationFindings: Setting findings:', result.findings);
        setFindings(result.findings || []);
      } else {
        throw new Error(result.error || 'Failed to fetch findings');
      }
    } catch (error) {
      console.error('InvestigationFindings: Error fetching findings:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch findings');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredFindings = findings.filter(finding => 
    filter === 'all' || finding.importance === filter
  );

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'critical': return 'text-red-400 bg-red-500/10 border-red-400/20';
      case 'important': return 'text-yellow-400 bg-yellow-500/10 border-yellow-400/20';
      case 'minor': return 'text-blue-400 bg-blue-500/10 border-blue-400/20';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-400/20';
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'interrogation': return <User className="w-4 h-4" />;
      case 'location_visit': return <MapPin className="w-4 h-4" />;
      case 'clue_discovery': return <Search className="w-4 h-4" />;
      default: return <Eye className="w-4 h-4" />;
    }
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const criticalCount = findings.filter(f => f.importance === 'critical').length;
  const importantCount = findings.filter(f => f.importance === 'important').length;
  const minorCount = findings.filter(f => f.importance === 'minor').length;

  if (isLoading) {
    return (
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Search className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">Investigation Findings</h3>
        </div>
        <div className="text-center py-8">
          <div className="w-8 h-8 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-400">Analyzing findings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Search className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">Investigation Findings</h3>
        </div>
        <div className="text-center py-8">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-red-400 mb-2">Error loading findings</p>
          <p className="text-gray-400 text-sm mb-4">{error}</p>
          <button
            onClick={fetchFindings}
            className="px-4 py-2 bg-red-500/20 border border-red-400/30 rounded-lg text-red-400 hover:bg-red-500/30 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (findings.length === 0) {
    return (
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Search className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">Investigation Findings</h3>
        </div>
        <div className="text-center py-8">
          <Search className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-400">No findings yet. Start investigating to discover clues!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
      {/* Header */}
      <div 
        className="p-6 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Investigation Findings</h3>
            {process.env.NODE_ENV === 'development' && (
              <span className="text-xs text-gray-500 font-mono">({caseId?.slice(-6)})</span>
            )}
            <div className="flex items-center gap-2">
              {criticalCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/10 border border-red-400/20 rounded text-red-400 text-xs">
                  <AlertTriangle className="w-3 h-3" />
                  {criticalCount}
                </span>
              )}
              {importantCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-500/10 border border-yellow-400/20 rounded text-yellow-400 text-xs">
                  <Badge className="w-3 h-3" />
                  {importantCount}
                </span>
              )}
              {minorCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/10 border border-blue-400/20 rounded text-blue-400 text-xs">
                  <CheckCircle className="w-3 h-3" />
                  {minorCount}
                </span>
              )}
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </div>

      {/* Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/10">
              {/* Filter Tabs */}
              <div className="p-4 bg-white/5">
                <div className="flex gap-2">
                  {['all', 'critical', 'important', 'minor'].map((filterType) => (
                    <button
                      key={filterType}
                      onClick={() => setFilter(filterType as any)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        filter === filterType
                          ? 'bg-purple-500 text-white'
                          : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                      {filterType !== 'all' && (
                        <span className="ml-1 text-xs">
                          ({filterType === 'critical' ? criticalCount : 
                            filterType === 'important' ? importantCount : minorCount})
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Findings List */}
              <div className="max-h-80 overflow-y-auto">
                {filteredFindings.length > 0 ? (
                  <div className="p-4 space-y-4">
                    {filteredFindings.map((finding, index) => (
                      <motion.div
                        key={`${finding.id}-${index}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`p-4 rounded-lg border ${getImportanceColor(finding.importance)}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            {getSourceIcon(finding.source)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium opacity-75">
                                {finding.sourceDetails}
                              </span>
                              {finding.isNew && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-green-500/20 border border-green-400/30 rounded text-green-400 text-xs">
                                  NEW
                                </span>
                              )}
                            </div>
                            <p className="text-sm leading-relaxed">
                              {finding.finding}
                            </p>
                            <div className="flex items-center gap-2 mt-2 text-xs opacity-60">
                              <Clock className="w-3 h-3" />
                              {formatTimestamp(finding.timestamp)}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-gray-400">No {filter} findings found.</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InvestigationFindings; 
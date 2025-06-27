"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  X, 
  Plus,
  ChevronLeft,
  ChevronRight,
  Save,
  Trash2,
  Calendar,
  StickyNote
} from 'lucide-react';
import { NotepadEntry } from '@/functions/types';
import { useAuth } from '@/hooks/useAuth';

interface FloatingNotepadProps {
  caseId: string;
}

const FloatingNotepad: React.FC<FloatingNotepadProps> = ({ caseId }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [entries, setEntries] = useState<NotepadEntry[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentEntry, setCurrentEntry] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const ENTRIES_PER_PAGE = 5;

  useEffect(() => {
    if (isOpen && caseId) {
      fetchEntries();
    }
  }, [isOpen, caseId]);

  const fetchEntries = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/notepad?caseId=${caseId}`);
      const result = await response.json();
      if (result.success) {
        setEntries(result.entries);
      }
    } catch (error) {
      console.error('Error fetching notepad entries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveEntry = async () => {
    if (!currentEntry.trim() || !user || isSaving) return;

    setIsSaving(true);
    try {
      if (editingEntryId) {
        // Update existing entry
        const response = await fetch('/api/notepad', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            entryId: editingEntryId,
            content: currentEntry
          })
        });
        const result = await response.json();
        if (result.success) {
          setEditingEntryId(null);
          setCurrentEntry('');
          setHasUnsavedChanges(false);
          await fetchEntries();
        }
      } else {
        // Create new entry
        const response = await fetch('/api/notepad', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            caseId,
            content: currentEntry
          })
        });
        const result = await response.json();
        if (result.success) {
          setCurrentEntry('');
          setHasUnsavedChanges(false);
          await fetchEntries();
        }
      }
    } catch (error) {
      console.error('Error saving notepad entry:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditEntry = (entry: NotepadEntry) => {
    setCurrentEntry(entry.content);
    setEditingEntryId(entry.id);
    setHasUnsavedChanges(false);
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      const response = await fetch(`/api/notepad?entryId=${entryId}`, {
        method: 'DELETE'
      });
      const result = await response.json();
      if (result.success) {
        await fetchEntries();
      }
    } catch (error) {
      console.error('Error deleting notepad entry:', error);
    }
  };

  const handleTextChange = (value: string) => {
    setCurrentEntry(value);
    setHasUnsavedChanges(value !== (editingEntryId ? 
      entries.find(e => e.id === editingEntryId)?.content : ''));
  };

  const handleCancelEdit = () => {
    if (hasUnsavedChanges && !confirm('You have unsaved changes. Discard them?')) {
      return;
    }
    setCurrentEntry('');
    setEditingEntryId(null);
    setHasUnsavedChanges(false);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Client-side pagination
  const totalPages = Math.ceil(entries.length / ENTRIES_PER_PAGE);
  const startIndex = (currentPage - 1) * ENTRIES_PER_PAGE;
  const endIndex = startIndex + ENTRIES_PER_PAGE;
  const paginatedEntries = entries.slice(startIndex, endIndex);

  return (
    <>
      {/* Floating Button */}
      <motion.button
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1 }}
        onClick={() => setIsOpen(true)}
        className="fixed right-6 bottom-6 z-40 w-14 h-14 bg-gradient-to-br from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 rounded-full shadow-2xl flex items-center justify-center text-amber-200 transition-all duration-300 hover:scale-110 border-2 border-slate-600"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        style={{
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
        }}
      >
        <BookOpen className="w-6 h-6" />
      </motion.button>

      {/* Notepad Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            />

            {/* Notepad */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 50 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-2xl h-[80vh] z-50"
              style={{
                background: 'linear-gradient(135deg, #f7f3e9 0%, #f0ead6 100%)',
                boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                borderRadius: '8px',
                border: '1px solid #d4c5a9',
                overflow: 'hidden'
              }}
            >
              {/* Paper texture and wrinkled edges */}
              <div 
                className="absolute inset-0 pointer-events-none z-0"
                style={{
                  background: `
                    radial-gradient(circle at 20% 80%, rgba(139, 115, 85, 0.1) 0%, transparent 50%),
                    radial-gradient(circle at 80% 20%, rgba(139, 115, 85, 0.1) 0%, transparent 50%),
                    radial-gradient(circle at 40% 40%, rgba(205, 183, 158, 0.1) 0%, transparent 50%)
                  `,
                  borderRadius: '8px'
                }}
              />
              
              {/* Left spiral binding holes */}
              <div className="absolute left-8 top-0 bottom-0 w-px bg-red-300 opacity-60 z-0" />
              {Array.from({ length: 15 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute left-6 w-4 h-1 bg-slate-700 rounded-full opacity-20 z-0"
                  style={{ top: `${(i + 1) * 6}%` }}
                />
              ))}
              {/* Header */}
              <div 
                className="px-6 py-4 relative z-20"
                style={{
                  background: 'linear-gradient(135deg, #2d3748 0%, #1a202c 100%)',
                  borderBottom: '2px solid #4a5568'
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <StickyNote className="w-6 h-6 text-amber-200" />
                    <h2 className="text-xl font-bold text-amber-100" style={{ fontFamily: 'serif' }}>
                      Investigation Notes
                    </h2>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-8 h-8 rounded-full bg-slate-600 hover:bg-slate-500 flex items-center justify-center transition-colors border border-slate-500"
                  >
                    <X className="w-5 h-5 text-amber-200" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex flex-col h-[calc(100%-5rem)] relative z-10">
                {/* Text Editor */}
                <div className="p-6 border-b border-slate-600 relative z-10">
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-slate-700 font-medium" style={{ fontFamily: 'serif' }}>
                        {editingEntryId ? 'Edit Note' : 'New Note'}
                      </label>
                      {hasUnsavedChanges && (
                        <span className="text-xs text-red-600 italic">Unsaved changes</span>
                      )}
                    </div>
                    <div className="relative">
                      {/* Ruled lines background */}
                      <div 
                        className="absolute inset-0 pointer-events-none z-0"
                        style={{
                          backgroundImage: `
                            linear-gradient(transparent 0, transparent 19px, #d1d5db 19px, #d1d5db 21px, transparent 21px),
                            linear-gradient(90deg, transparent 0, transparent 39px, #fca5a5 39px, #fca5a5 41px, transparent 41px)
                          `,
                          backgroundSize: '100% 21px, 100% 100%',
                          borderRadius: '4px'
                        }}
                      />
                      <textarea
                        value={currentEntry}
                        onChange={(e) => handleTextChange(e.target.value)}
                        placeholder="Write your investigation notes here..."
                        className="w-full h-32 p-3 bg-transparent text-slate-800 placeholder-slate-500 focus:outline-none resize-none relative z-10"
                        style={{
                          lineHeight: '21px',
                          fontFamily: 'monospace',
                          fontSize: '14px',
                          paddingLeft: '48px'
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveEntry}
                      disabled={!currentEntry.trim() || isSaving}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-800 disabled:bg-slate-400 text-amber-100 rounded-lg transition-colors disabled:cursor-not-allowed border border-slate-600"
                      style={{
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                        fontFamily: 'serif'
                      }}
                    >
                      <Save className="w-4 h-4" />
                      {isSaving ? 'Saving...' : (editingEntryId ? 'Update' : 'Save Note')}
                    </button>
                    {editingEntryId && (
                      <button
                        onClick={handleCancelEdit}
                        className="flex items-center gap-2 px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg transition-colors border border-red-600"
                        style={{
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                          fontFamily: 'serif'
                        }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

                {/* Notes List */}
                <div className="flex-1 overflow-y-auto relative z-10">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-slate-600" style={{ fontFamily: 'serif' }}>Loading notes...</div>
                    </div>
                  ) : entries.length > 0 ? (
                    <div className="p-6 space-y-4">
                      {paginatedEntries.map((entry) => (
                        <motion.div
                          key={entry.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="relative border border-slate-300 rounded-lg shadow-lg"
                          style={{
                            background: 'linear-gradient(135deg, #fefcf3 0%, #f5f1e8 100%)',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
                          }}
                        >
                          {/* Ruled lines background for notes */}
                          <div 
                            className="absolute inset-0 pointer-events-none rounded-lg z-0"
                            style={{
                              backgroundImage: `
                                linear-gradient(transparent 0, transparent 19px, #e5e7eb 19px, #e5e7eb 20px, transparent 20px),
                                linear-gradient(90deg, transparent 0, transparent 39px, #fca5a5 39px, #fca5a5 40px, transparent 40px)
                              `,
                              backgroundSize: '100% 20px, 100% 100%',
                              opacity: 0.4
                            }}
                          />
                          
                          <div className="p-4 relative z-10">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2 text-xs text-slate-600" style={{ fontFamily: 'serif' }}>
                                <Calendar className="w-3 h-3" />
                                {formatDate(entry.createdAt)}
                              </div>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleEditEntry(entry)}
                                  className="w-6 h-6 rounded bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-700 transition-colors border border-slate-400"
                                  style={{ boxShadow: '0 1px 2px rgba(0, 0, 0, 0.2)' }}
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => handleDeleteEntry(entry.id)}
                                  className="w-6 h-6 rounded bg-red-200 hover:bg-red-300 flex items-center justify-center text-red-700 transition-colors border border-red-400"
                                  style={{ boxShadow: '0 1px 2px rgba(0, 0, 0, 0.2)' }}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                            <p 
                              className="text-slate-800 text-sm whitespace-pre-wrap"
                              style={{
                                lineHeight: '20px',
                                fontFamily: 'monospace',
                                paddingLeft: '48px'
                              }}
                            >
                              {entry.content}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-600" style={{ fontFamily: 'serif' }}>
                      No notes yet. Start writing your investigation notes above!
                    </div>
                  )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div 
                    className="p-4 border-t border-slate-600 relative z-20"
                    style={{
                      background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)'
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="flex items-center gap-2 px-3 py-1 bg-slate-700 hover:bg-slate-800 disabled:bg-slate-400 text-amber-100 rounded transition-colors disabled:cursor-not-allowed border border-slate-600"
                        style={{
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                          fontFamily: 'serif'
                        }}
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                      </button>
                      <span className="text-slate-700 font-medium" style={{ fontFamily: 'serif' }}>
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="flex items-center gap-2 px-3 py-1 bg-slate-700 hover:bg-slate-800 disabled:bg-slate-400 text-amber-100 rounded transition-colors disabled:cursor-not-allowed border border-slate-600"
                        style={{
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                          fontFamily: 'serif'
                        }}
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default FloatingNotepad; 
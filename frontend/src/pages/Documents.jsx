// Import React hooks, API service client, Lucide icons
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FolderLock, Upload, Trash2, Download, FileText, ImageIcon, FileCode, AlertCircle, FileCheck } from 'lucide-react';

const Documents = () => {
  // Document locker lists states
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form upload input states
  const [title, setTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  // Action feedback states
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  // Fetch all documents uploaded by this employee
  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/documents');
      if (res.data.success) {
        setDocuments(res.data.documents);
      }
    } catch (err) {
      console.error('Failed to load documents locker:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  // Display notification banner
  const triggerFeedback = (type, text) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback({ type: '', text: '' }), 5000);
  };

  // Handle file input selection
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Restrict file size to 5MB on client side
      if (file.size > 5 * 1024 * 1024) {
        triggerFeedback('danger', 'File size exceeds maximum allowed limit of 5MB.');
        return;
      }
      setSelectedFile(file);
    }
  };

  // Handle document upload form submission
  const handleUploadSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      triggerFeedback('danger', 'Please enter a descriptive title for the document.');
      return;
    }

    if (!selectedFile) {
      triggerFeedback('danger', 'Please select a file to upload.');
      return;
    }

    setUploading(true);
    
    // Package parameters in FormData for multipart file uploads
    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('document', selectedFile); // Matches fieldname 'document' in upload route

    try {
      const res = await api.post('/documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (res.data.success) {
        triggerFeedback('success', 'Document uploaded and locked successfully!');
        
        // Reset upload inputs
        setTitle('');
        setSelectedFile(null);
        // Clear file input tag
        document.getElementById('file-picker').value = '';

        // Reload lists
        fetchDocuments();
      }
    } catch (err) {
      triggerFeedback('danger', err.response?.data?.message || 'Failed to upload document file.');
    } finally {
      setUploading(false);
    }
  };

  // Handle document deletion
  const handleDeleteDocument = async (docId) => {
    if (!window.confirm('Are you sure you want to permanently delete this document from the server?')) return;

    try {
      const res = await api.delete(`/documents/${docId}`);
      if (res.data.success) {
        triggerFeedback('success', 'Document deleted and purged from disk.');
        fetchDocuments();
      }
    } catch (err) {
      triggerFeedback('danger', 'Failed to delete document.');
    }
  };

  // Map file MIME types to distinct aesthetic Lucide icons
  const getFileIcon = (fileType) => {
    if (!fileType) return <FileText className="w-6 h-6 text-brand-accent" />;
    
    if (fileType.includes('pdf')) {
      return <FileText className="w-6 h-6 text-rose-400" />;
    } else if (fileType.includes('image')) {
      return <ImageIcon className="w-6 h-6 text-emerald-400" />;
    } else if (fileType.includes('word') || fileType.includes('msword') || fileType.includes('officedocument')) {
      return <FileCheck className="w-6 h-6 text-sky-400" />;
    }
    
    return <FileCode className="w-6 h-6 text-amber-400" />;
  };

  // Format date display
  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading && documents.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-slate-800 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
          Document Locker
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Store, upload, and download credentials, certificates, or IDs securely.
        </p>
      </div>

      {/* Response Alert Banner */}
      {feedback.text && (
        <div className={`flex items-center gap-3 p-4 rounded-2xl border backdrop-blur-md transition-all duration-300 animate-slideDown ${
          feedback.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
            : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
        }`}>
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">{feedback.text}</span>
        </div>
      )}

      {/* Upload Form and Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Upload Form Card Panel */}
        <div className="glass-panel rounded-3xl p-6 bg-slate-900/40 self-start">
          <h3 className="text-lg font-bold text-white mb-6">Upload Document</h3>
          
          <form onSubmit={handleUploadSubmit} className="space-y-5">
            {/* Title Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Document Display Title
              </label>
              <input
                type="text"
                className="glass-input text-sm"
                placeholder="e.g. Aadhaar Card, Degree Certificate"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={uploading}
              />
            </div>

            {/* Custom styled File Upload Picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Select File (PDF, Image, Docx - Max 5MB)
              </label>
              
              <div className="relative border-2 border-dashed border-slate-700/60 hover:border-brand-accent/50 rounded-2xl p-6 text-center cursor-pointer transition-all duration-300 group bg-slate-950/20">
                <input
                  id="file-picker"
                  type="file"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                
                <Upload className="w-8 h-8 text-slate-500 group-hover:text-brand-accent mx-auto mb-2.5 transition-colors" />
                <span className="text-xs font-semibold text-slate-300 block truncate">
                  {selectedFile ? selectedFile.name : 'Choose file or drag & drop'}
                </span>
                <span className="text-[10px] text-slate-500 mt-1 block">Supported: PDF, Images, Word Docs</span>
              </div>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={uploading}
              className="glass-btn w-full mt-2"
            >
              {uploading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Upload & Lock</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Uploaded Documents Grid */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <h3 className="font-bold text-white text-lg">My Locked Credentials</h3>
            <span className="text-xs px-2.5 py-1 rounded-lg bg-white/5 text-slate-400 font-semibold">
              Total: {documents.length} files
            </span>
          </div>

          {documents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {documents.map((doc) => (
                <div 
                  key={doc._id} 
                  className="glass-panel rounded-2xl p-5 bg-slate-900/20 border border-white/5 flex items-start gap-4 hover:scale-[1.01] transition-transform duration-300 group"
                >
                  {/* Extension Icon Mapping */}
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex-shrink-0 flex items-center justify-center border border-white/5">
                    {getFileIcon(doc.fileType)}
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-white truncate" title={doc.title}>
                      {doc.title}
                    </h4>
                    <p className="text-[10px] text-slate-500 mt-1 font-semibold">
                      Uploaded: {formatDate(doc.uploadedAt)}
                    </p>
                    
                    {/* Action Panel */}
                    <div className="flex items-center gap-3.5 mt-4 pt-3 border-t border-white/5">
                      {/* Secure Download Anchor */}
                      <a
                        href={`http://localhost:5000${doc.fileUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        download
                        className="flex items-center gap-1 text-[11px] font-bold text-brand-accent hover:text-indigo-400 cursor-pointer transition-colors"
                        title="Download file"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </a>
                      
                      {/* Purge File Button */}
                      <button
                        onClick={() => handleDeleteDocument(doc._id)}
                        className="flex items-center gap-1 text-[11px] font-bold text-rose-400 hover:text-rose-500 cursor-pointer transition-colors ml-auto active:scale-95"
                        title="Delete document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-panel rounded-3xl p-12 text-center text-slate-500">
              <FolderLock className="w-12 h-12 text-slate-700 mx-auto mb-2 animate-pulse" />
              <p className="text-sm font-medium">No documents uploaded. Locker is currently empty.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Documents;

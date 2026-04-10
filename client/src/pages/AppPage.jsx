import { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, FileText, AlertCircle, Download, Save } from 'lucide-react';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';
import Sidebar from '../components/Sidebar';
import ScrollToTop from '../components/ScrollToTop';
import { aiAPI, documentsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function AppPage() {
  const { user } = useAuth();
  const viewerRef = useRef(null);

  // ─── UI State ─────────────────────────────────────────────────────────────
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // ─── Document State ────────────────────────────────────────────────────────
  const [documents, setDocuments] = useState([]);
  const [activeDoc, setActiveDoc] = useState(null); // { _id, title, htmlContent }
  const [text, setText] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [docTitle, setDocTitle] = useState('');

  // ─── Operation State ──────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // ─── Load document list on mount ──────────────────────────────────────────
  const fetchDocuments = useCallback(async () => {
    try {
      const res = await documentsAPI.list();
      setDocuments(res.data.documents || []);
    } catch (err) {
      console.error('Failed to load documents', err);
    }
  }, []);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

  // Re-run syntax highlighting when HTML loads
  useEffect(() => {
    if (htmlContent && viewerRef.current) hljs.highlightAll();
  }, [htmlContent]);

  // ─── Sidebar actions ──────────────────────────────────────────────────────
  const handleSelectDoc = async (doc) => {
    try {
      const res = await documentsAPI.getOne(doc._id);
      const { htmlContent: content, title } = res.data.data;
      setActiveDoc(res.data.data);
      setHtmlContent(content || '');
      setDocTitle(title);
      setText(''); // clear raw input
      setError('');
      setSuccessMsg('');
    } catch (err) {
      setError('Failed to load document.');
    }
  };

  const handleNewDoc = () => {
    setActiveDoc(null);
    setText('');
    setHtmlContent('');
    setDocTitle('');
    setError('');
    setSuccessMsg('');
  };

  const handleRenameDoc = async (docId, newTitle) => {
    try {
      await documentsAPI.rename(docId, newTitle);
      setDocuments(prev => prev.map(d => d._id === docId ? { ...d, title: newTitle } : d));
      if (activeDoc?._id === docId) setDocTitle(newTitle);
    } catch (err) {
      setError('Failed to rename document.');
    }
  };

  const handleDeleteDoc = async (docId) => {
    try {
      await documentsAPI.delete(docId);
      setDocuments(prev => prev.filter(d => d._id !== docId));
      if (activeDoc?._id === docId) handleNewDoc();
    } catch (err) {
      setError('Failed to delete document.');
    }
  };

  // ─── Format & Save ────────────────────────────────────────────────────────
  const formatAndSave = async () => {
    if (!text.trim()) { setError('Please enter some text to format.'); return; }
    setLoading(true); setError(''); setSuccessMsg('');
    try {
      const title = docTitle.trim() || `Document ${new Date().toLocaleDateString()}`;
      const response = await aiAPI.formatAndSave({
        title,
        text,
        documentType: 'general'
      });

      const newDoc = response.data.document;
      const newHtml = response.data.formatting?.html || '';

      setHtmlContent(newHtml);
      setActiveDoc({ ...newDoc, htmlContent: newHtml });
      setDocTitle(newDoc.title);

      // Add to sidebar list at top
      setDocuments(prev => [newDoc, ...prev.filter(d => d._id !== newDoc._id)]);
      setSuccessMsg('Document saved to your library!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      const msg = err.response?.data?.error || 'An error occurred while formatting.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Save manual changes made to the HTML in contentEditable mode.
   */
  const saveManualChanges = async () => {
    if (!activeDoc || !viewerRef.current) return;
    setSaving(true); setError(''); setSuccessMsg('');
    try {
      const updatedHtml = viewerRef.current.innerHTML;
      await documentsAPI.update(activeDoc._id, {
        title: docTitle,
        htmlContent: updatedHtml
      });
      
      // Update local state to match the manual edits
      setHtmlContent(updatedHtml);
      setActiveDoc(prev => ({ ...prev, htmlContent: updatedHtml, title: docTitle }));
      setDocuments(prev => prev.map(d => d._id === activeDoc._id ? { ...d, title: docTitle } : d));
      
      setSuccessMsg('Changes saved!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError('Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  // ─── Format Only (preview without saving) ─────────────────────────────────
  const formatOnly = async () => {
    if (!text.trim()) { setError('Please enter some text to format.'); return; }
    setLoading(true); setError(''); setSuccessMsg('');
    try {
      const response = await aiAPI.format({ text, documentType: 'general' });
      setHtmlContent(response.data.html);
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred while formatting.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Export ───────────────────────────────────────────────────────────────
  const downloadPdf = () => window.print();

  const downloadWord = () => {
    if (!viewerRef.current) return;
    
    // Professional styles for Word
    const styles = `
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
        h1 { font-size: 24pt; color: #0f172a; border-bottom: 2pt solid #e2e8f0; padding-bottom: 6pt; margin-bottom: 12pt; }
        h2 { font-size: 18pt; color: #1e293b; margin-top: 18pt; margin-bottom: 9pt; }
        h3 { font-size: 14pt; color: #334155; margin-top: 12pt; margin-bottom: 6pt; }
        p { margin-bottom: 10pt; }
        ul, ol { margin-bottom: 10pt; margin-left: 20pt; }
        li { margin-bottom: 4pt; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 15pt; }
        th, td { border: 1pt solid #e2e8f0; padding: 8pt; text-align: left; }
        th { background-color: #f8fafc; font-weight: bold; }
        pre { background-color: #f1f5f9; padding: 10pt; border: 1pt solid #e2e8f0; font-family: 'Courier New', monospace; font-size: 9pt; }
        code { background-color: #f1f5f9; padding: 1pt 3pt; font-family: 'Courier New', monospace; }
      </style>
    `;
    
    const html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset='utf-8'>
          <title>${docTitle || 'DocuMagic'}</title>
          ${styles}
        </head>
        <body>
          ${viewerRef.current.innerHTML}
        </body>
      </html>
    `;
    
    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const link = document.createElement('a');
    link.download = `${docTitle || 'DocuMagic'}.doc`;
    link.href = URL.createObjectURL(blob);
    link.click();
  };

  const isEditingSaved = !!activeDoc;

  return (
    <div className="app-layout">
      <Sidebar
        documents={documents}
        activeDocId={activeDoc?._id}
        onSelectDoc={handleSelectDoc}
        onNewDoc={handleNewDoc}
        onRenameDoc={handleRenameDoc}
        onDeleteDoc={handleDeleteDoc}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(s => !s)}
      />

      {/* Main content */}
      <div className={`app-main ${sidebarCollapsed ? 'app-main-expanded' : ''}`}>
        {/* Top bar */}
        <header className="app-topbar">
          <div className="app-topbar-title">
            {activeDoc ? (
              <div className="topbar-edit-title">
                <input
                  type="text"
                  className="topbar-title-input"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  onBlur={saveManualChanges}
                  placeholder="Document Title"
                />
              </div>
            ) : (
              <span className="topbar-greeting">Hello, {user?.displayName?.split(' ')[0]} 👋</span>
            )}
          </div>
          <div className="app-topbar-actions">
            {isEditingSaved && (
              <button
                onClick={saveManualChanges}
                className="btn btn-save-changes"
                disabled={saving}
                id="save-changes-btn"
              >
                {saving ? <div className="spinner-sm" /> : <Save size={16} />}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            )}
            {htmlContent && (
              <>
                <button onClick={downloadPdf} className="topbar-export-btn" id="export-pdf-btn">
                  <Download size={16} /> PDF
                </button>
                <button onClick={downloadWord} className="topbar-export-btn topbar-export-doc" id="export-doc-btn">
                  <Download size={16} /> DOC
                </button>
              </>
            )}
          </div>
        </header>

        {/* Editor + Viewer grid */}
        <main className={`app-content ${isEditingSaved ? 'app-content-single' : ''}`}>
          {/* Input Panel - Only show when NOT editing a saved doc */}
          {!isEditingSaved && (
            <section className="glass-panel editor-panel">
              <div className="editor-panel-header">
                <h2 className="panel-title">
                  <FileText size={18} /> Raw Input
                </h2>
              </div>

              {/* Doc title input */}
              <input
                type="text"
                className="doc-title-input"
                placeholder="Document title (optional)"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                id="doc-title-input"
              />

              <textarea
                placeholder="Paste your raw, messy text here — notes, brainstorming, Slack exports. DocuMagic will structure it!"
                value={text}
                onChange={(e) => setText(e.target.value)}
                id="main-textarea"
              />

              {/* Errors & success */}
              {error && (
                <div className="alert alert-error" role="alert">
                  <AlertCircle size={16} /> {error}
                </div>
              )}
              {successMsg && (
                <div className="alert alert-success" role="status">
                  <Save size={16} /> {successMsg}
                </div>
              )}

              <div className="editor-actions">
                <button
                  className="btn btn-secondary"
                  disabled={loading}
                  onClick={formatOnly}
                  id="format-only-btn"
                  title="Preview without saving"
                >
                  {loading ? <div className="spinner-sm" /> : <Sparkles size={16} />}
                  Preview
                </button>
                <button
                  className="btn"
                  disabled={loading || saving}
                  onClick={formatAndSave}
                  id="format-save-btn"
                >
                  {loading ? (
                    <><div className="spinner-sm" /> Processing…</>
                  ) : (
                    <><Save size={16} /> Format & Save</>
                  )}
                </button>
              </div>
            </section>
          )}

          {/* Output Panel - Becomes full width if editing a saved doc */}
          <section className="glass-panel viewer-panel">
            <div className="viewer-panel-header">
              <h2 className="panel-title">
                {isEditingSaved ? 'Edit Document' : 'Formatted Result'}
              </h2>
              {isEditingSaved && (
                <span className="edit-hint">Click anywhere below to start editing</span>
              )}
            </div>

            <div className="viewer-wrapper">
              {loading ? (
                <div className="loader-container">
                  <div className="spinner" />
                  <p>Analyzing and formatting with AI…</p>
                </div>
              ) : htmlContent ? (
                <div
                  className="document-viewer editable-document"
                  ref={viewerRef}
                  contentEditable={isEditingSaved}
                  suppressContentEditableWarning={true}
                  dangerouslySetInnerHTML={{ __html: htmlContent }}
                />
              ) : (
                <div className="loader-container">
                  <Sparkles size={40} opacity={0.2} />
                  <p style={{ marginTop: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Your beautifully formatted document will appear here.
                  </p>
                </div>
              )}
            </div>

            {/* Error alerts in viewer when editor is hidden */}
            {isEditingSaved && error && (
              <div className="alert alert-error" style={{ position: 'absolute', bottom: '2rem', right: '2rem' }}>
                <AlertCircle size={16} /> {error}
              </div>
            )}
            {isEditingSaved && successMsg && (
                <div className="alert alert-success" style={{ position: 'absolute', bottom: '2rem', right: '2rem' }}>
                <Save size={16} /> {successMsg}
              </div>
            )}
          </section>
        </main>
      </div>
      <ScrollToTop />
    </div>
  );
}

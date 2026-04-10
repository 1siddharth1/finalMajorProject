import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, FileText, AlertCircle, Download, LogIn, UserPlus } from 'lucide-react';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';
import { aiAPI } from '../services/api';
import ScrollToTop from '../components/ScrollToTop';

/**
 * The original public landing page — unchanged from Checkpoint 1.
 * Uses /api/ai/format (no auth needed). Documents are NOT saved here.
 * Authenticated users can navigate to /app for the full experience.
 */
function LandingPage() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [htmlContent, setHtmlContent] = useState('');
  const [error, setError] = useState('');
  const viewerRef = useRef(null);

  useEffect(() => {
    if (htmlContent && viewerRef.current) hljs.highlightAll();
  }, [htmlContent]);

  const downloadPdf = () => window.print();

  const downloadWord = () => {
    if (!viewerRef.current) return;
    
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
          <title>DocuMagic Document</title>
          ${styles}
        </head>
        <body>
          ${viewerRef.current.innerHTML}
        </body>
      </html>
    `;
    
    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const downloadLink = document.createElement('a');
    downloadLink.download = 'DocuMagic-Professional.doc';
    downloadLink.href = URL.createObjectURL(blob);
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const formatDocument = async () => {
    if (!text.trim()) { setError('Please enter some text to format.'); return; }
    setLoading(true); setError('');
    try {
      const response = await aiAPI.format({ text, documentType: 'general' });
      setHtmlContent(response.data.html);
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred while formatting.');
      if (err.response?.data?.fallback) setHtmlContent(err.response.data.fallback);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      {/* Nav bar with auth buttons */}
      <nav className="landing-nav">
        <div className="landing-nav-logo">
          <Sparkles size={20} />
          DocuMagic AI
        </div>
        <div className="landing-nav-actions">
          <Link to="/login" className="nav-btn nav-btn-ghost" id="nav-login-btn">
            <LogIn size={16} /> Sign In
          </Link>
          <Link to="/signup" className="nav-btn nav-btn-primary" id="nav-signup-btn">
            <UserPlus size={16} /> Get Started Free
          </Link>
        </div>
      </nav>

      <header className="hero">
        <h1 className="hero-title">
          <Sparkles className="inline-block mr-4 text-secondary" size={48} />
          DocuMagic AI
        </h1>
        <p className="hero-subtitle">Transform your raw text into beautifully structured HTML instantly</p>
        <p className="hero-cta-hint">
          ✨ <Link to="/signup" className="auth-link">Sign up free</Link> to save documents to your personal library
        </p>
      </header>

      <main className="app-grid">
        {/* Editor Panel */}
        <section className="glass-panel textarea-container">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FileText size={20} />
              Raw Input
            </h2>
          </div>

          <textarea
            placeholder="Paste your raw, messy text here. Notes, brainstorming, slack exports—throw it all in!"
            value={text}
            onChange={(e) => setText(e.target.value)}
            id="landing-textarea"
          />

          {error && (
            <div style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <button
            className="btn mt-4"
            disabled={loading}
            onClick={formatDocument}
            id="landing-format-btn"
          >
            {loading ? 'Processing with AI...' : 'Structure Document'}
            {!loading && <Sparkles size={18} />}
          </button>
        </section>

        {/* Output Panel */}
        <section className="glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Formatted Result</h2>
            {htmlContent && (
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={downloadPdf} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
                  <Download size={18} /> PDF
                </button>
                <button onClick={downloadWord} style={{ background: 'transparent', border: 'none', color: '#2563eb', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
                  <Download size={18} /> DOC
                </button>
              </div>
            )}
          </div>

          <div style={{ background: 'white', borderRadius: '0.5rem', overflow: 'hidden' }}>
            {loading ? (
              <div className="loader-container">
                <div className="spinner" />
                <p>Analyzing context and formatting...</p>
              </div>
            ) : htmlContent ? (
              <div className="document-viewer" ref={viewerRef} dangerouslySetInnerHTML={{ __html: htmlContent }} />
            ) : (
              <div className="loader-container" style={{ height: '400px' }}>
                <p style={{ textAlign: 'center' }}>Your structured document will appear here.</p>
              </div>
            )}
          </div>
        </section>
      </main>
      <ScrollToTop />
    </div>
  );
}

export default LandingPage;

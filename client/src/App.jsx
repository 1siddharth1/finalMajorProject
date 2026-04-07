import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Sparkles, FileText, AlertCircle, Download } from 'lucide-react';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';

function App() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [htmlContent, setHtmlContent] = useState('');
  const [error, setError] = useState('');
  const viewerRef = useRef(null);

  useEffect(() => {
    if (htmlContent) {
      if (viewerRef.current) hljs.highlightAll();
    }
  }, [htmlContent]);

  const downloadPdf = () => {
    window.print();
  };

  const downloadWord = () => {
    if (!viewerRef.current) return;
    
    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>DocuMagic Document</title></head><body>";
    const footer = "</body></html>";
    const html = header + viewerRef.current.innerHTML + footer;

    const blob = new Blob(['\ufeff', html], {
      type: 'application/msword'
    });
    
    const downloadLink = document.createElement("a");
    downloadLink.download = 'DocuMagic-Professional.doc';
    downloadLink.href = URL.createObjectURL(blob);
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const formatDocument = async () => {
    if (!text.trim()) {
      setError('Please enter some text to format.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post('http://localhost:5000/api/ai/format-and-save', {
        title: 'New Document',
        text: text,
        documentType: 'general'
      });
      
      setHtmlContent(response.data.formatting.html);
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred while formatting.');
      if (err.response?.data?.fallback) {
          setHtmlContent(err.response.data.fallback);
      }
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="container">
      <header className="hero">
        <h1 className="hero-title">
          <Sparkles className="inline-block mr-4 text-secondary" size={48} />
          DocuMagic AI
        </h1>
        <p className="hero-subtitle">Transform your raw text into beautifully structured HTML instantly</p>
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
          ></textarea>
          
          {error && (
            <div style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <button 
            className="btn mt-4"
            disabled={loading}
            onClick={formatDocument}
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
                <button 
                  onClick={downloadPdf}
                  style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}
                >
                  <Download size={18} />
                  PDF
                </button>
                <button 
                  onClick={downloadWord}
                  style={{ background: 'transparent', border: 'none', color: '#2563eb', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}
                >
                  <Download size={18} />
                  DOC
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
              <div 
                className="document-viewer"
                ref={viewerRef}
                dangerouslySetInnerHTML={{ __html: htmlContent }} 
              />
            ) : (
              <div className="loader-container" style={{ height: '400px' }}>
                <p style={{ textAlign: 'center' }}>Your structured document will appear here.</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;

import { useState, useEffect, useRef } from 'react';
import {
  FileText, Plus, Trash2, Edit2, Check, X,
  LogOut, ChevronLeft, ChevronRight, Sparkles, User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { documentsAPI } from '../services/api';

export default function Sidebar({
  documents,
  activeDocId,
  onSelectDoc,
  onNewDoc,
  onDeleteDoc,
  onRenameDoc,
  collapsed,
  onToggle
}) {
  const { user, logout } = useAuth();
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const renameInputRef = useRef(null);

  // Focus input when rename mode activates
  useEffect(() => {
    if (renamingId && renameInputRef.current) renameInputRef.current.focus();
  }, [renamingId]);

  const startRename = (doc, e) => {
    e.stopPropagation();
    setRenamingId(doc._id);
    setRenameValue(doc.title);
  };

  const commitRename = async () => {
    if (!renameValue.trim()) { cancelRename(); return; }
    await onRenameDoc(renamingId, renameValue.trim());
    setRenamingId(null);
  };

  const cancelRename = () => setRenamingId(null);

  const handleRenameKeyDown = (e) => {
    if (e.key === 'Enter') commitRename();
    if (e.key === 'Escape') cancelRename();
  };

  const handleDelete = (docId, e) => {
    e.stopPropagation();
    setDeletingId(docId);
  };

  const confirmDelete = async () => {
    await onDeleteDoc(deletingId);
    setDeletingId(null);
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <>
      {/* Sidebar */}
      <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Header */}
        <div className="sidebar-header">
          {!collapsed && (
            <div className="sidebar-logo">
              <Sparkles size={20} className="sidebar-logo-icon" />
              <span>DocuMagic</span>
            </div>
          )}
          <button
            className="sidebar-toggle-btn"
            onClick={onToggle}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            id="sidebar-toggle"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* New Document button */}
        <button
          className={`sidebar-new-btn ${collapsed ? 'sidebar-new-btn-collapsed' : ''}`}
          onClick={onNewDoc}
          id="new-document-btn"
          title="New Document"
        >
          <Plus size={18} />
          {!collapsed && <span>New Document</span>}
        </button>

        {/* Document list */}
        {!collapsed && (
          <div className="sidebar-list">
            {documents.length === 0 ? (
              <div className="sidebar-empty">
                <FileText size={32} opacity={0.3} />
                <p>No documents yet</p>
                <p className="sidebar-empty-hint">Format some text to get started!</p>
              </div>
            ) : (
              documents.map((doc) => (
                <div
                  key={doc._id}
                  className={`sidebar-item ${activeDocId === doc._id ? 'sidebar-item-active' : ''}`}
                  onClick={() => onSelectDoc(doc)}
                  id={`doc-item-${doc._id}`}
                >
                  <FileText size={15} className="sidebar-item-icon" />

                  {renamingId === doc._id ? (
                    /* Inline rename mode */
                    <div className="sidebar-rename" onClick={e => e.stopPropagation()}>
                      <input
                        ref={renameInputRef}
                        className="sidebar-rename-input"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={handleRenameKeyDown}
                        onBlur={commitRename}
                        maxLength={200}
                      />
                      <button className="sidebar-action-btn sidebar-confirm" onMouseDown={commitRename} title="Save">
                        <Check size={13} />
                      </button>
                      <button className="sidebar-action-btn sidebar-cancel" onMouseDown={cancelRename} title="Cancel">
                        <X size={13} />
                      </button>
                    </div>
                  ) : (
                    /* Normal display mode */
                    <>
                      <div className="sidebar-item-info">
                        <span className="sidebar-item-title">{doc.title}</span>
                        <span className="sidebar-item-date">{formatDate(doc.createdAt)}</span>
                      </div>
                      <div className="sidebar-item-actions">
                        <button
                          className="sidebar-action-btn"
                          onClick={(e) => startRename(doc, e)}
                          title="Rename"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          className="sidebar-action-btn sidebar-delete-btn"
                          onClick={(e) => handleDelete(doc._id, e)}
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* User section at bottom */}
        <div className={`sidebar-footer ${collapsed ? 'sidebar-footer-collapsed' : ''}`}>
          <div className="sidebar-user">
            <div className="sidebar-avatar">
              {user?.displayName?.[0]?.toUpperCase() || <User size={16} />}
            </div>
            {!collapsed && (
              <div className="sidebar-user-info">
                <span className="sidebar-user-name">{user?.displayName}</span>
                <span className="sidebar-user-email">{user?.email}</span>
              </div>
            )}
          </div>
          <button
            className="sidebar-logout-btn"
            onClick={logout}
            title="Sign out"
            id="logout-btn"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Delete confirmation modal */}
      {deletingId && (
        <div className="modal-overlay" onClick={() => setDeletingId(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <Trash2 size={28} style={{ color: '#ef4444', marginBottom: '0.75rem' }} />
            <h3 className="modal-title">Delete document?</h3>
            <p className="modal-body">This action cannot be undone. The file will be permanently deleted.</p>
            <div className="modal-actions">
              <button className="modal-cancel" onClick={() => setDeletingId(null)}>Cancel</button>
              <button className="modal-confirm" id="confirm-delete-btn" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

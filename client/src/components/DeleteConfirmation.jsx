import React, { useState } from 'react';
import './DeleteConfirmation.css';

function DeleteConfirmation({ habitName, onConfirm, onCancel }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onConfirm(password);
      setPassword('');
      onCancel();
    } catch (err) {
      setError(err.message || 'Failed to delete habit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>Delete Habit</h3>
        <p className="warning-text">
          Are you sure you want to delete "<strong>{habitName}</strong>"?
          This action cannot be undone.
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="confirm-password">
              Enter your password to confirm:
            </label>
            <input
              type="password"
              id="confirm-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              required
              autoFocus
            />
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <div className="modal-actions">
            <button 
              type="button" 
              className="cancel-btn" 
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="delete-btn"
              disabled={loading}
            >
              {loading ? 'Deleting...' : 'Delete Habit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DeleteConfirmation;
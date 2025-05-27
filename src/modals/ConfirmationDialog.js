// cái này là thông báo xác nhận

import React from 'react';
import '../styles/ConfirmationDialog.css'; // Import CSS

function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Xác nhận",
  cancelText = "Hủy"
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className={`confirmation-dialog-overlay ${isOpen ? 'active' : ''}`} onMouseDown={onClose}>
      <div className="confirmation-dialog-content" onMouseDown={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="confirmation-dialog-actions">
          <button className="confirmation-dialog-btn cancel" onClick={onClose}>
            {cancelText}
          </button>
          <button className="confirmation-dialog-btn confirm" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmationDialog;
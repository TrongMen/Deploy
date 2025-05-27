import React, { useState, useEffect } from 'react';
import '../styles/RenameGroupModal.css'; // Import CSS
import { FaTimes } from 'react-icons/fa';

function RenameGroupModal({
  isOpen,
  onClose,
  onConfirmRename, // Callback này sẽ nhận (newName, conversationId)
  currentGroupName,
  groupMembers = [],
  // --- THÊM PROPS MỚI ---
  conversationId, 
  currentUserId 
}) {
  const [newGroupName, setNewGroupName] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Thêm state cho trạng thái loading

  useEffect(() => {
    if (isOpen) {
      setNewGroupName(currentGroupName || '');
    }
  }, [isOpen, currentGroupName]);

  if (!isOpen) {
    return null;
  }

  const handleConfirm = async () => {
    if (!newGroupName.trim() || newGroupName.trim() === currentGroupName) {
      onClose(); // Đóng nếu không có thay đổi hoặc tên rỗng
      return;
    }
    if (!conversationId || !currentUserId) {
      alert("Lỗi: Không đủ thông tin để đổi tên nhóm (thiếu ID nhóm hoặc ID người dùng).");
      onClose();
      return;
    }

    setIsLoading(true); // Bắt đầu loading

    try {
      const response = await fetch(`${process.env.REACT_PUBLIC_API_URL}/conversation/changeConversationNameWeb`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: conversationId,
          user_id: currentUserId,
          conversationName: newGroupName.trim()
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message || 'Đổi tên nhóm thành công!');
        if (onConfirmRename) {
          // Truyền tên mới và ID nhóm về cho component cha
          onConfirmRename(newGroupName.trim(), conversationId); 
        }
      } else {
        alert(data.message || 'Đổi tên nhóm thất bại.');
      }
    } catch (error) {
      console.error("Lỗi khi đổi tên nhóm:", error);
      alert("Lỗi kết nối, không thể đổi tên nhóm.");
    } finally {
      setIsLoading(false); // Kết thúc loading
      onClose(); // Đóng modal sau khi xử lý
    }
  };

  const firstThreeMembers = groupMembers.slice(0, 3);

  return (
    <div className={`rename-group-modal-overlay ${isOpen ? 'active' : ''}`} onMouseDown={onClose}>
      <div className="rename-group-modal-content" onMouseDown={(e) => e.stopPropagation()}>
        <div className="rename-group-modal-header">
          <span style={{width: '32px'}}></span>
          <h3>Đổi tên nhóm</h3>
          <button className="rename-group-modal-close-btn" onClick={onClose} disabled={isLoading}>
            <FaTimes />
          </button>
        </div>
        <div className="rename-group-modal-body">
          <div className="rename-group-avatar-preview">
            {firstThreeMembers.length > 0 ? (
              firstThreeMembers.map((member, index) => (
                <div key={member.id || index} className="composite-avatar-item">
                  {member.avatarUrl ? ( // Giả sử member có avatarUrl
                    <img src={member.avatarUrl} alt={member.name} />
                  ) : (
                    <span>{(member.name || '?').charAt(0).toUpperCase()}</span>
                  )}
                </div>
              ))
            ) : (
              <span style={{fontSize: '24px', color: '#8a8d91'}}>
                📷
              </span>
            )}
          </div>
          <p className="rename-group-instruction">
            Bạn có chắc chắn muốn đổi tên nhóm, khi xác nhận tên nhóm mới sẽ hiển thị với tất cả thành viên.
          </p>
          <input
            type="text"
            className="rename-group-input"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="Nhập tên nhóm mới"
            maxLength={100}
            disabled={isLoading}
          />
        </div>
        <div className="rename-group-modal-footer">
          <button className="rename-group-btn cancel" onClick={onClose} disabled={isLoading}>
            Hủy
          </button>
          <button
            className="rename-group-btn confirm"
            onClick={handleConfirm}
            disabled={!newGroupName.trim() || newGroupName.trim() === currentGroupName || isLoading}
          >
            {isLoading ? 'Đang lưu...' : 'Xác nhận'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default RenameGroupModal;
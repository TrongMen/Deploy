import React, { useState, useEffect } from 'react';
import '../styles/TargetAccountInfoModal.css';
import { FaTimes, FaPhone, FaCommentDots } from 'react-icons/fa';

function TargetAccountInfoModal({ isOpen, onClose, userData }) {
  const [avatarLoadError, setAvatarLoadError] = useState(false);

  useEffect(() => {
    // Reset trạng thái lỗi mỗi khi modal mở với dữ liệu người dùng mới
    if (isOpen) {
      setAvatarLoadError(false);
    }
  }, [isOpen]);
  
  if (!isOpen || !userData) {
    return null;
  }

  // === BẮT ĐẦU SỬA LỖI: Chuẩn hóa lại cách lấy dữ liệu ===
  const name = userData.name || "Không có tên";
  const avatarUrl = userData.avatar; // Chỉ sử dụng một biến duy nhất cho avatar từ props
  const coverPhotoUrl = userData.coverPhotoUrl || "https://via.placeholder.com/400x150?text=Ảnh+bìa";
  const gender = userData.gender || "Chưa cập nhật";
  const dob = userData.dob || "Chưa cập nhật";
  const phone = userData.phone || "Chưa cập nhật";

  // Component con để render avatar một cách an toàn
  const SafeAvatar = () => {
    const isValidUrl = typeof avatarUrl === 'string' && (avatarUrl.startsWith('http') || avatarUrl.startsWith('data:image'));

    if (avatarLoadError || !isValidUrl) {
      const initials = name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || name.charAt(0).toUpperCase();
      return <div className="avatar-content">{initials}</div>;
    }

    return <img src={avatarUrl} alt={name} onError={() => setAvatarLoadError(true)} />;
  };
  // === KẾT THÚC SỬA LỖI ===

  return (
    <div className={`target-account-info-overlay ${isOpen ? 'active' : ''}`} onMouseDown={onClose}>
      <div className="target-account-info-modal-content" onMouseDown={(e) => e.stopPropagation()}>
        <div className="target-account-info-header">
          <span style={{width: '32px'}}></span>
          <h3>Thông tin tài khoản</h3>
          <button className="target-account-info-close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="target-profile-section">
          <div className="target-cover-photo">
            <img src={coverPhotoUrl} alt="Ảnh bìa" onError={(e) => e.target.src = "https://via.placeholder.com/400x150?text=Ảnh+bìa"} />
          </div>
          {/* === SỬA LỖI: Thay thế toàn bộ logic cũ bằng SafeAvatar === */}
          <div className="target-profile-avatar-container">
            <SafeAvatar />
          </div>
          {/* === KẾT THÚC SỬA LỖI === */}
        </div>

        <h2 className="target-profile-name">{name}</h2>

        <div className="target-profile-actions">
          <button className="target-profile-action-btn">
            <FaPhone style={{ marginRight: '5px' }} /> Gọi điện
          </button>
          <button className="target-profile-action-btn primary">
            <FaCommentDots style={{ marginRight: '5px' }} /> Nhắn tin
          </button>
        </div>

        <div className="target-details-section">
          <h4>Thông tin cá nhân</h4>
          <div className="target-info-item">
            <strong>Giới tính:</strong>
            <span>{gender}</span>
          </div>
          <div className="target-info-item">
            <strong>Ngày sinh:</strong>
            <span>{dob}</span>
          </div>
          <div className="target-info-item">
            <strong>Điện thoại:</strong>
            <span>{phone}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TargetAccountInfoModal;
import React, { useState } from 'react';
import '../styles/SettingsModal.css';
import {
  FaTimes, FaCog, FaUserShield, FaLock, FaSyncAlt, FaDatabase, FaPalette,
  FaBell, FaCommentDots, FaPhoneAlt, FaPuzzlePiece, FaKey, FaMobileAlt,
  FaUserLock, FaEnvelope, FaEye, FaEyeSlash, FaArrowLeft, FaInfoCircle // Thêm FaInfoCircle cho lưu ý
} from 'react-icons/fa';

function SettingsModal({ isOpen, onClose }) {
  const [activeSetting, setActiveSetting] = useState('general');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  const settingsNav = [
    { id: 'general', label: 'Cài đặt chung', icon: <FaCog /> },
    { id: 'account_main', label: 'Tài khoản và bảo mật', icon: <FaUserShield /> },
    { id: 'privacy', label: 'Quyền riêng tư', icon: <FaLock /> },
    { id: 'sync', label: 'Đồng bộ tin nhắn', icon: <FaSyncAlt /> },
    { id: 'appearance', label: 'Giao diện', icon: <FaPalette />, beta: true },
    { id: 'notifications', label: 'Thông báo', icon: <FaBell /> },
    { id: 'messages', label: 'Tin nhắn', icon: <FaCommentDots /> },
    { id: 'calls', label: 'Cài đặt cuộc gọi', icon: <FaPhoneAlt /> },
    { id: 'utilities', label: 'Tiện ích', icon: <FaPuzzlePiece /> },
  ];

  const handlePasswordChangeSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmNewPassword) {
      alert('Mật khẩu mới không khớp!');
      return;
    }

    const storedUser = JSON.parse(localStorage.getItem('user'));
    const phoneNumber = storedUser?.phoneNumber;

    if (!phoneNumber) {
      alert('Không tìm thấy số điện thoại để đổi mật khẩu!');
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/account/changePasswordWeb`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: phoneNumber,
          password: currentPassword,
          passwordnew: newPassword,
        }),
      });

      const data = await response.json();
      alert(data.message);

      if (data.message === 'Mật khẩu đã được thay đổi thành công') {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        setActiveSetting('account_main');
      }
    } catch (err) {
      console.error('Lỗi khi đổi mật khẩu:', err);
      alert('Đã xảy ra lỗi khi kết nối đến máy chủ!');
    }
  };

  const renderGeneralSettings = () => (
    <div className="setting-content-section">
      <h4>Danh bạ</h4>
      <p className="setting-description">Danh sách bạn bè được hiển thị trong danh bạ</p>
      <div className="setting-option radio-option">
        <label><input type="radio" name="contactDisplay" value="all" /> <span className="radio-custom"></span> Hiển thị tất cả bạn bè</label>
      </div>
      <div className="setting-option radio-option">
        <label><input type="radio" name="contactDisplay" value="zaloOnly" defaultChecked /> <span className="radio-custom"></span> Chỉ hiển thị bạn bè đang sử dụng Zalo</label>
      </div>
      <h4 className="mt-4">Ngôn ngữ</h4>
      <div className="setting-option">
        <label htmlFor="languageSelect" className="setting-label">Thay đổi ngôn ngữ</label>
        <select id="languageSelect" className="setting-select" defaultValue="vi"><option value="vi">Tiếng Việt</option><option value="en">English</option></select>
      </div>
      <h4 className="mt-4">Khởi động & ghi nhớ tài khoản</h4>
      <div className="setting-option toggle-option">
        <span>Khởi động Zalo khi mở máy</span>
        <label className="switch"><input type="checkbox" /><span className="slider round"></span></label>
      </div>
      <div className="setting-option toggle-option">
        <span>Ghi nhớ tài khoản đăng nhập</span>
        <label className="switch"><input type="checkbox" defaultChecked /><span className="slider round"></span></label>
      </div>
    </div>
  );

  const renderAccountSecurity_MainView = () => (
    <div className="setting-content-section">
      <h4>Tài khoản</h4>
      <div className="setting-option action-option">
        <div className="option-label-description">
          <span className="setting-label-main"><FaKey className="option-icon" /> Đổi mật khẩu</span>
          <span className="setting-description-small">Nên đổi mật khẩu định kỳ để bảo vệ tài khoản tốt hơn.</span>
        </div>
        <button className="setting-action-btn" onClick={() => setActiveSetting('account_change_password')}>Đổi</button>
      </div>
      <div className="setting-option action-option">
        <div className="option-label-description">
          <span className="setting-label-main"><FaEnvelope className="option-icon" /> Email khôi phục</span>
          <span className="setting-description-small">Chưa thiết lập. Thêm email để khôi phục tài khoản khi cần.</span>
        </div>
        <button className="setting-action-btn">Thêm</button>
      </div>
      <h4 className="mt-4">Bảo mật</h4>
      <div className="setting-option action-option">
        <div className="option-label-description">
          <span className="setting-label-main"><FaUserLock className="option-icon" /> Xác thực 2 yếu tố</span>
          <span className="setting-description-small">Tăng cường bảo mật cho tài khoản của bạn.</span>
        </div>
        <label className="switch"><input type="checkbox" /><span className="slider round"></span></label>
      </div>
      <div className="setting-option action-option">
        <div className="option-label-description">
          <span className="setting-label-main"><FaMobileAlt className="option-icon" /> Thiết bị đã đăng nhập</span>
          <span className="setting-description-small">Quản lý các thiết bị đang sử dụng tài khoản Zalo của bạn.</span>
        </div>
        <button className="setting-action-btn">Quản lý</button>
      </div>
      <div className="setting-option toggle-option">
        <div className="option-label-description">
          <span className="setting-label-main">Nhận cảnh báo đăng nhập</span>
          <span className="setting-description-small">Thông báo khi có đăng nhập từ thiết bị lạ.</span>
        </div>
        <label className="switch"><input type="checkbox" defaultChecked /><span className="slider round"></span></label>
      </div>
    </div>
  );

  const renderChangePasswordForm = () => (
    <div className="setting-content-section">
      <div className="change-password-header">
        <button className="back-to-settings-btn" onClick={() => setActiveSetting('account_main')}>
          <FaArrowLeft /> Quay lại
        </button>
        <h4>Đổi mật khẩu</h4>
      </div>
      <form onSubmit={handlePasswordChangeSubmit} className="change-password-form">
        <div className="form-field-group">
          <label htmlFor="currentPassword">Mật khẩu hiện tại</label>
          <div className="input-group password-input-change">
            <input
              id="currentPassword"
              type={showCurrentPassword ? 'text' : 'password'}
              className="input-field"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
            <button type="button" className="toggle-password-button" onClick={() => setShowCurrentPassword(!showCurrentPassword)}>
              {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>
        <div className="form-field-group">
          <label htmlFor="newPassword">Mật khẩu mới</label>
          <div className="input-group password-input-change">
            <input
              id="newPassword"
              type={showNewPassword ? 'text' : 'password'}
              className="input-field"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <button type="button" className="toggle-password-button" onClick={() => setShowNewPassword(!showNewPassword)}>
              {showNewPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>
        <div className="form-field-group">
          <label htmlFor="confirmNewPassword">Nhập lại mật khẩu mới</label>
          <div className="input-group password-input-change">
            <input
              id="confirmNewPassword"
              type={showConfirmNewPassword ? 'text' : 'password'}
              className="input-field"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              required
            />
            <button type="button" className="toggle-password-button" onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}>
              {showConfirmNewPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>

        {/* THÊM PHẦN LƯU Ý */}
        <div className="password-notes">
          <p className="notes-title"><FaInfoCircle /> Lưu ý:</p>
          <ul>
            <li>Mật khẩu nên có ít nhất 6 ký tự.</li>
            <li>Nên bao gồm chữ hoa, chữ thường, số.</li>
            <li>Không sử dụng mật khẩu dễ đoán như ngày sinh, tên riêng hoặc các chuỗi ký tự đơn giản.</li>
            <li>Sau khi thay đổi mật khẩu, bạn có thể cần đăng nhập lại trên các thiết bị khác.</li>
          </ul>
        </div>

        <div className="change-password-actions">
          <button type="button" className="setting-action-btn cancel-btn" onClick={() => setActiveSetting('account_main')}>Hủy</button>
          <button type="submit" className="setting-action-btn save-btn">Lưu thay đổi</button>
        </div>
      </form>
    </div>
  );

  const renderSettingContent = () => {
    switch (activeSetting) {
      case 'general':
        return renderGeneralSettings();
      case 'account_main':
        return renderAccountSecurity_MainView();
      case 'account_change_password':
        return renderChangePasswordForm();
      default:
        return <p className="setting-content-placeholder">Chọn một mục cài đặt để xem chi tiết.</p>;
    }
  };

  return (
    <div className={`modal-overlay settings-modal-overlay ${isOpen ? 'active' : ''}`} onClick={onClose}>
      {isOpen && (
        <div className="modal-content settings-modal-content" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close-btn settings-modal-close-btn" onClick={onClose}>
            <FaTimes />
          </button>
          <div className="settings-modal-layout">
            <nav className="settings-modal-nav">
              <h3>Cài đặt</h3>
              <ul>
                {settingsNav.map(item => (
                  <li
                    key={item.id}
                    className={activeSetting === item.id || (activeSetting === 'account_change_password' && item.id === 'account_main') ? 'active' : ''}
                    onClick={() => setActiveSetting(item.id)}
                  >
                    <span className="settings-nav-icon">{item.icon}</span>
                    {item.label}
                    {item.beta && <span className="beta-tag">Beta</span>}
                  </li>
                ))}
              </ul>
            </nav>
            <main className="settings-modal-main-content">
              {renderSettingContent()}
            </main>
          </div>
        </div>
      )}
    </div>
  );
}

export default SettingsModal;
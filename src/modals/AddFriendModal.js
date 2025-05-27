import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import '../styles/AddFriendModal.css';
import { FaChevronDown, FaUserFriends, FaSpinner } from 'react-icons/fa';

const AddFriendModal = ({ isOpen, onClose, currentLoggedInUserId }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [searchResultUser, setSearchResultUser] = useState(null); // Sẽ chứa { ...user, hasPendingSentRequest: boolean }
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [actionMessage, setActionMessage] = useState(''); // Dùng chung cho các thông báo hành động

  if (!isOpen) return null;

  const handleSearch = async () => {
    if (!phoneNumber.trim()) {
      setSearchError('Vui lòng nhập số điện thoại.');
      setSearchResultUser(null);
      return;
    }
    setIsLoading(true);
    setSearchError('');
    setSearchResultUser(null);
    setActionMessage('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/findUserByPhoneWeb`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber: phoneNumber }),
      });

      const data = await response.json();

      if (response.ok && data.user) {
        // Khởi tạo trạng thái lời mời cho người dùng tìm được
        // API findUserByPhoneWeb không trả về trạng thái này, nên ta mặc định là chưa gửi
        setSearchResultUser({ ...data.user, hasPendingSentRequest: false });
      } else {
        setSearchResultUser(null);
        setSearchError(data.message || 'Không tìm thấy người dùng hoặc có lỗi xảy ra.');
      }
    } catch (error) {
      console.error('Lỗi tìm kiếm:', error);
      setSearchError('Lỗi kết nối máy chủ. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendFriendRequest = async (friendId) => {
    if (!currentLoggedInUserId) {
      setActionMessage('Lỗi: Không xác định được người dùng hiện tại để gửi lời mời.');
      console.error('currentLoggedInUserId is missing');
      return;
    }
    setActionMessage('Đang gửi lời mời...');
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/sendFriendRequestWeb`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentLoggedInUserId,
          friend_id: friendId,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setActionMessage(data.message || 'Đã gửi lời mời kết bạn!');
        // Cập nhật trạng thái của người dùng trong kết quả tìm kiếm
        setSearchResultUser(prevUser => prevUser ? { ...prevUser, hasPendingSentRequest: true } : null);
      } else {
        setActionMessage(data.message || 'Không thể gửi lời mời. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Lỗi gửi lời mời kết bạn:', error);
      setActionMessage('Lỗi kết nối khi gửi lời mời.');
    }
  };

  const handleCancelFriendRequest = async (friendId) => {
    if (!currentLoggedInUserId) {
      setActionMessage('Lỗi: Không xác định được người dùng hiện tại.');
      return;
    }
    setActionMessage('Đang hủy lời mời...');
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/cancelFriendRequestWeb`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentLoggedInUserId, // ID người gửi (người hủy)
          friend_id: friendId,          // ID người đã được gửi (nay bị hủy)
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setActionMessage(data.message || 'Đã hủy lời mời kết bạn!');
        setSearchResultUser(prevUser => prevUser ? { ...prevUser, hasPendingSentRequest: false } : null);
      } else {
        setActionMessage(data.message || 'Không thể hủy lời mời. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Lỗi hủy lời mời kết bạn:', error);
      setActionMessage('Lỗi kết nối khi hủy lời mời.');
    }
  };

  const resetModalState = () => {
    setPhoneNumber('');
    setSearchResultUser(null);
    setSearchError('');
    setActionMessage('');
    setIsLoading(false);
  };

  const handleClose = () => {
    resetModalState();
    onClose();
  };

  const modalContent = (
    <div className="add-friend-modal-overlay" onClick={handleClose}>
      <div className="add-friend-modal-content" onClick={e => e.stopPropagation()}>
        <div className="add-friend-modal-header">
          <h2>Thêm bạn</h2>
          <button className="modal-close-btn" onClick={handleClose}>✕</button>
        </div>
        <div className="add-friend-modal-body">
          <div className="phone-input-section">
            <div className="country-code-selector">
              <span className="country-flag">🇻🇳</span>
              <span>(+84)</span>
              <FaChevronDown className="dropdown-arrow" />
            </div>
            <input
              type="tel"
              className="phone-input"
              placeholder="Số điện thoại"
              value={phoneNumber}
              onChange={(e) => {
                setPhoneNumber(e.target.value);
                setSearchResultUser(null); // Xóa kết quả cũ khi SĐT thay đổi
                setSearchError('');
                setActionMessage('');
              }}
            />
          </div>

          {isLoading && (
            <div className="search-loading">
              <FaSpinner className="spinner-icon" /> Đang tìm kiếm...
            </div>
          )}
          {searchError && <div className="search-error-message">{searchError}</div>}
          {actionMessage && <div className="add-friend-message">{actionMessage}</div>}

          {searchResultUser && (
            <div className="search-result-section">
              <h4>Kết quả tìm kiếm:</h4>
              <div className="suggested-friend-item">
                <div className="suggested-friend-avatar">
                  {searchResultUser.avatar ? (
                    <img src={searchResultUser.avatar} alt={searchResultUser.userName} />
                  ) : (
                    searchResultUser.userName?.substring(0, 2).toUpperCase()
                  )}
                </div>
                <div className="suggested-friend-info">
                  <span className="suggested-friend-name">{searchResultUser.userName}</span>
                </div>
                <button
                  className={`add-friend-btn-item ${searchResultUser.hasPendingSentRequest ? 'cancel-request-btn' : ''}`}
                  onClick={() => searchResultUser.hasPendingSentRequest 
                                ? handleCancelFriendRequest(searchResultUser._id) 
                                : handleSendFriendRequest(searchResultUser._id)
                          }
                >
                  {searchResultUser.hasPendingSentRequest ? 'Hủy lời mời' : 'Kết bạn'}
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="add-friend-modal-footer">
          <button className="cancel-btn-modal" onClick={handleClose}>Hủy</button>
          <button className="search-btn-modal" onClick={handleSearch} disabled={isLoading}>
            {isLoading ? 'Đang tìm...' : 'Tìm kiếm'}
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(
    modalContent,
    document.getElementById('modal-root')
  );
};

export default AddFriendModal;
import React, { useState, useEffect, useMemo } from 'react';
import '../styles/AddMembersModal.css';
import { FaTimes, FaSearch, FaSpinner } from 'react-icons/fa'; // Thêm FaSpinner

function AddMembersModal({
  isOpen,
  onClose,
  onConfirm,
  currentGroupMemberIds = [],
  conversationId,
  currentUserId // Prop mới để lấy danh sách bạn bè
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [isAdding, setIsAdding] = useState(false);

  const [friendsList, setFriendsList] = useState([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  const [friendsError, setFriendsError] = useState('');


  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setSelectedUserIds([]);
      setIsAdding(false);
      setFriendsList([]); // Reset danh sách bạn bè khi modal mở
      setFriendsError('');

      if (currentUserId) {
        setIsLoadingFriends(true);
        fetch(`${process.env.REACT_PUBLIC_API_URL}/user/getFriends/${currentUserId}`)
          .then(response => {
            if (!response.ok) {
              throw new Error('Không thể tải danh sách bạn bè.');
            }
            return response.json();
          })
          .then(data => {
            setFriendsList(Array.isArray(data) ? data : []);
            setIsLoadingFriends(false);
          })
          .catch(error => {
            console.error("Lỗi tải danh sách bạn bè:", error);
            setFriendsError(error.message || 'Lỗi tải danh sách bạn bè.');
            setIsLoadingFriends(false);
          });
      } else {
        setFriendsError('Không có ID người dùng hiện tại để tải bạn bè.');
      }
    }
  }, [isOpen, currentUserId]);

  const getIsAlreadyMember = (userId) => currentGroupMemberIds.includes(userId);

  const handleToggleUserSelection = (userId) => {
    if (getIsAlreadyMember(userId)) return;

    setSelectedUserIds(prevSelected =>
      prevSelected.includes(userId)
        ? prevSelected.filter(id => id !== userId)
        : [...prevSelected, userId]
    );
  };

  const processedFriends = useMemo(() => {
    return friendsList.map(friend => ({
      id: friend._id, // API trả về _id
      name: friend.userName, // API trả về userName
      avatarUrl: friend.avatar, // API trả về avatar
      isAlreadyMember: getIsAlreadyMember(friend._id)
    }));
  }, [friendsList, currentGroupMemberIds]);

  const filteredFriendsForDisplay = useMemo(() => {
    return processedFriends.filter(friend =>
      friend.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [processedFriends, searchTerm]);

  const groupedFriends = useMemo(() => {
    const groups = {};
    filteredFriendsForDisplay.forEach(friend => {
      const firstLetter = friend.name.charAt(0).toUpperCase();
      if (/[A-ZÀÁẠẢÃĂẰẮẶẲẴÂẦẤẬẨẪĐÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸ]/.test(firstLetter)) {
        if (!groups[firstLetter]) {
          groups[firstLetter] = [];
        }
        groups[firstLetter].push(friend);
      } else {
        if (!groups['#']) groups['#'] = [];
        groups['#'].push(friend);
      }
    });
    Object.keys(groups).forEach(letter => {
        groups[letter].sort((a,b) => a.name.localeCompare(b.name, 'vi'));
    });
    const sortedGroupEntries = Object.entries(groups).sort(([keyA], [keyB]) => {
        if (keyA === '#') return 1;
        if (keyB === '#') return -1;
        return keyA.localeCompare(keyB, 'vi');
    });
    return sortedGroupEntries;
  }, [filteredFriendsForDisplay]);


  const renderUserItem = (user) => {
    const isSelected = selectedUserIds.includes(user.id);

    return (
      <div key={user.id} className="add-members-user-item">
        <div className="checkbox-container">
            <input
                type="checkbox"
                id={`add-member-${user.id}`}
                checked={user.isAlreadyMember || isSelected}
                onChange={() => handleToggleUserSelection(user.id)}
                disabled={user.isAlreadyMember}
            />
        </div>
        <div className="user-identification-wrapper">
            <div className={`avatar ${user.avatarUrl ? '' : 'initial-avatar'}`}>
            {user.avatarUrl ? <img src={user.avatarUrl} alt={user.name} /> : (user.name ? user.name.charAt(0).toUpperCase() : '?')}
            </div>
            <div className="add-members-user-info">
            <span className="name">{user.name}</span>
            {user.isAlreadyMember && <span className="status">Đã tham gia</span>}
            </div>
        </div>
      </div>
    );
  };

  const handleConfirm = async () => {
    const newMembersToAdd = selectedUserIds.filter(id => !getIsAlreadyMember(id));
    if (newMembersToAdd.length === 0) {
      onClose();
      return;
    }

    if (!conversationId) {
        alert("Lỗi: Không tìm thấy ID của cuộc trò chuyện.");
        return;
    }
    setIsAdding(true);
    try {
        const response = await fetch(
          `${process.env.REACT_PUBLIC_API_URL}/conversation/addMemberToConversationGroupWeb`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              conversation_id: conversationId,
              friend_ids: newMembersToAdd,
            }),
          }
        );
        const data = await response.json();
        if (!response.ok) {
          alert(`Lỗi thêm thành viên: ${data.message || "Vui lòng thử lại."}`);
          setIsAdding(false);
          return;
        }
        alert("Đã thêm thành viên vào nhóm!");
        onConfirm(data.conversation);
      } catch (error) {
        console.error("Lỗi kết nối khi thêm thành viên:", error);
        alert("Lỗi kết nối, không thể thêm thành viên.");
      } finally {
        setIsAdding(false);
      }
  };

  const newSelectionsCount = selectedUserIds.filter(id => !getIsAlreadyMember(id)).length;

  if (!isOpen) {
    return null;
  }

  const noResultsAfterSearch = searchTerm && groupedFriends.length === 0;

  return (
    <div className={`add-members-modal-overlay ${isOpen ? 'active' : ''}`} onMouseDown={onClose}>
      <div className="add-members-modal-content" onMouseDown={(e) => e.stopPropagation()}>
        <div className="add-members-modal-header">
          <h3>Thêm thành viên</h3>
          <button className="add-members-modal-close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        <div className="add-members-modal-body">
          <div className="add-members-search-bar">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Nhập tên bạn bè..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="add-members-list-section">
            {isLoadingFriends && (
              <div className="loading-indicator-add-members">
                <FaSpinner className="spinner-icon" /> Đang tải danh sách bạn bè...
              </div>
            )}
            {friendsError && (
              <p className="error-message-add-members">{friendsError}</p>
            )}
            {!isLoadingFriends && !friendsError && groupedFriends.length > 0 && groupedFriends.map(([letter, usersInGroup]) => (
                <div key={letter}>
                <h4>{letter}</h4>
                {usersInGroup.map(user => renderUserItem(user))}
                </div>
            ))}

            {!isLoadingFriends && !friendsError && groupedFriends.length === 0 && !searchTerm && (
                <p className="empty-add-members-list">Bạn chưa có bạn bè nào để thêm.</p>
            )}
            {!isLoadingFriends && !friendsError && noResultsAfterSearch && (
                <p className="empty-add-members-list">Không tìm thấy bạn bè nào phù hợp.</p>
            )}
          </div>
        </div>
        <div className="add-members-modal-footer">
          <button className="add-members-footer-btn cancel" onClick={onClose} disabled={isAdding}>
            Hủy
          </button>
          <button
            className="add-members-footer-btn confirm"
            onClick={handleConfirm}
            disabled={newSelectionsCount === 0 || isAdding}
          >
            {isAdding ? 'Đang thêm...' : `Xác nhận ${newSelectionsCount > 0 ? `(${newSelectionsCount})` : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddMembersModal;
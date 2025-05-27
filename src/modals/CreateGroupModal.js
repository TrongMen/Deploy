import React, { useState, useMemo, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import '../styles/CreateGroupModal.css';
import { FaCamera, FaSearch, FaSpinner } from 'react-icons/fa';

const CreateGroupModal = ({ isOpen, onClose, currentLoggedInUserId, onGroupCreated }) => {
  const [groupName, setGroupName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  
  const [contacts, setContacts] = useState([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [contactsError, setContactsError] = useState('');

  const [groupAvatarPreview, setGroupAvatarPreview] = useState(null);
  const [groupAvatarFile, setGroupAvatarFile] = useState(null);
  const avatarInputRef = useRef(null);

  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [createGroupError, setCreateGroupError] = useState('');
  const [createGroupSuccess, setCreateGroupSuccess] = useState('');

  useEffect(() => {
    if (isOpen) {
      setGroupName('');
      setSearchTerm('');
      setSelectedMemberIds([]);
      setGroupAvatarPreview(null);
      setGroupAvatarFile(null);
      setContactsError('');
      setContacts([]);
      setIsCreatingGroup(false);
      setCreateGroupError('');
      setCreateGroupSuccess('');

      if (currentLoggedInUserId) {
        const fetchContacts = async () => {
          setIsLoadingContacts(true);
          try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/getFriends/${currentLoggedInUserId}`);
            if (response.ok) {
              const data = await response.json();
              setContacts(data || []);
            } else {
              setContactsError('Không thể tải danh sách bạn bè.');
            }
          } catch (error) {
            setContactsError('Lỗi kết nối máy chủ.');
          } finally {
            setIsLoadingContacts(false);
          }
        };
        fetchContacts();
      } else {
        setContactsError('Không thể tải danh sách bạn bè do thiếu thông tin người dùng.');
      }
    }
  }, [isOpen, currentLoggedInUserId]);

  const filteredAndSearchedContacts = useMemo(() => {
    let filtered = contacts;
    if (searchTerm) {
      filtered = filtered.filter(c =>
        c.userName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return filtered.sort((a, b) => a.userName.localeCompare(b.userName, 'vi'));
  }, [searchTerm, contacts]);

  const groupedContacts = useMemo(() => {
    return filteredAndSearchedContacts.reduce((acc, contact) => {
      const firstLetter = contact.userName[0]?.toUpperCase();
      const groupKey = firstLetter && firstLetter.match(/[A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/i) ? firstLetter : '#';
      if (!acc[groupKey]) {
        acc[groupKey] = [];
      }
      acc[groupKey].push(contact);
      return acc;
    }, {});
  }, [filteredAndSearchedContacts]);

  if (!isOpen) return null;

  const handleMemberSelect = (memberId) => {
    setSelectedMemberIds(prevSelected =>
      prevSelected.includes(memberId)
        ? prevSelected.filter(id => id !== memberId)
        : [...prevSelected, memberId]
    );
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedMemberIds.length < 2 || !currentLoggedInUserId) {
      setCreateGroupError("Tên nhóm là bắt buộc và phải chọn ít nhất 2 thành viên để tạo nhóm (ngoài bạn).");
      return;
    }

    setIsCreatingGroup(true);
    setCreateGroupError('');
    setCreateGroupSuccess('');

    const payload = {
      user_id: currentLoggedInUserId,
      friend_ids: selectedMemberIds,
      conversationName: groupName.trim(),
    };

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/conversation/createConversationsGroupWeb`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.conversation) {
        setCreateGroupSuccess('Tạo nhóm thành công!');
        console.log('Nhóm đã tạo (CreateGroupModal):', data.conversation);
        if (onGroupCreated) { // Gọi callback về ZaloPCLayout
          onGroupCreated(data.conversation);
        }
        // onClose(); // ZaloPCLayout sẽ đóng modal sau khi xử lý onGroupCreated
      } else {
        setCreateGroupError(data.message || 'Không thể tạo nhóm. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Lỗi tạo nhóm:', error);
      setCreateGroupError('Lỗi kết nối máy chủ khi tạo nhóm.');
    } finally {
      setIsCreatingGroup(false);
    }
  };
  
  const handleAvatarUploadButtonClick = () => {
    if (avatarInputRef.current) {
        avatarInputRef.current.click();
    }
  };

  const handleAvatarFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setGroupAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setGroupAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setGroupAvatarFile(null);
      setGroupAvatarPreview(null);
    }
    if (event.target) {
        event.target.value = null; 
    }
  };

  const modalContent = (
    <div className="create-group-modal-overlay" onClick={onClose}>
      <div className="create-group-modal-content" onClick={e => e.stopPropagation()}>
        <div className="create-group-modal-header">
          <h2>Tạo nhóm</h2>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="create-group-modal-body">
          <div className="group-name-input-section">
            <button className="group-avatar-upload-btn" onClick={handleAvatarUploadButtonClick}>
              {groupAvatarPreview ? (
                <img src={groupAvatarPreview} alt="Group Avatar Preview" className="group-avatar-preview" />
              ) : (
                <FaCamera />
              )}
            </button>
            <input
              type="file"
              ref={avatarInputRef}
              style={{ display: 'none' }}
              accept="image/*"
              onChange={handleAvatarFileChange}
            />
            <input
              type="text"
              className="group-name-input"
              placeholder="Nhập tên nhóm..."
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </div>
          <div className="member-search-input-section">
            <FaSearch className="search-icon-members" />
            <input
              type="text"
              className="member-search-input"
              placeholder="Nhập tên hoặc số điện thoại bạn bè..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {createGroupError && <div className="create-group-error-message">{createGroupError}</div>}
          {createGroupSuccess && <div className="create-group-success-message">{createGroupSuccess}</div>}

          <div className="contact-list-section">
            {isLoadingContacts && <div className="loading-contacts-message"><FaSpinner className="spinner-icon"/> Đang tải danh bạ...</div>}
            {contactsError && <p className="error-contacts-message">{contactsError}</p>}
            {!isLoadingContacts && !contactsError && Object.keys(groupedContacts).length > 0 ? (
              Object.entries(groupedContacts).sort(([a], [b]) => a === '#' ? 1 : b === '#' ? -1 : a.localeCompare(b, 'vi')).map(([letter, contactsInGroup]) => (
                <div key={letter} className="contact-group-by-letter">
                  <h4 className="contact-letter-header">{letter}</h4>
                  <ul className="contact-list-modal">
                    {contactsInGroup.map(contact => (
                      <li key={contact._id} className="contact-item-modal">
                        <label htmlFor={`member-${contact._id}`} className="contact-item-label">
                          <input
                            type="checkbox"
                            id={`member-${contact._id}`}
                            className="member-select-checkbox"
                            checked={selectedMemberIds.includes(contact._id)}
                            onChange={() => handleMemberSelect(contact._id)}
                          />
                          <div className="contact-avatar-modal">
                            {contact.avatar ? <img src={contact.avatar} alt={contact.userName} /> : contact.userName?.substring(0,2).toUpperCase()}
                          </div>
                          <span className="contact-name-modal">{contact.userName}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            ) : (
              !isLoadingContacts && !contactsError && <p className="no-contacts-found">{searchTerm ? 'Không tìm thấy liên hệ nào.' : 'Danh sách bạn bè trống.'}</p>
            )}
          </div>
        </div>
        <div className="create-group-modal-footer">
          <button className="cancel-btn-modal" onClick={onClose} disabled={isCreatingGroup}>Hủy</button>
          <button 
            className="create-group-btn-modal" 
            onClick={handleCreateGroup}
            disabled={!groupName.trim() || selectedMemberIds.length < 2 || isCreatingGroup}
          >
            {isCreatingGroup ? <FaSpinner className="spinner-icon" /> : `Tạo nhóm (${selectedMemberIds.length})`}
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

export default CreateGroupModal;
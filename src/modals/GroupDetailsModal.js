import React, { useState, useRef, useEffect } from 'react';
import '../styles/GroupDetailsModal.css';
import { FaTimes, FaPen, FaCommentDots, FaUserFriends, FaCamera, FaLink, FaCopy, FaShareSquare, FaCog, FaSignOutAlt, FaPhotoVideo, FaTrashAlt, FaSpinner } from 'react-icons/fa'; // Thêm FaSpinner
import RenameGroupModal from './RenameGroupModal';

function GroupDetailsModal({
    isOpen,
    onClose,
    groupData,
    onManageMembers,
    onLeaveGroup,
    onCopyLink,
    onRenameGroup,
    onDisbandGroup,
    currentUserIsAdmin,
    onUpdateGroupAvatar, // Callback này sẽ nhận đối tượng group đã được cập nhật từ API
    // --- THÊM PROP MỚI ---
    currentUserId 
}) {
    const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
    const [avatarLoadError, setAvatarLoadError] = useState(false);
    const groupAvatarInputRef = useRef(null);
    // --- THÊM STATE CHO UPLOAD ---
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setAvatarLoadError(false);
            setIsUploadingAvatar(false); // Reset trạng thái upload khi modal mở
        }
    }, [isOpen]);

    if (!isOpen || !groupData) {
        return null;
    }

    const groupName = groupData.name || "Tên nhóm";
    const members = groupData.members || [];
    const memberCount = groupData.memberCount || members.length || 0;
    const groupLink = groupData.groupLink || `https://zalo.me/g/${groupData.id?.slice(0,10) || 'testgroup123'}`;

    const SafeAvatar = () => {
        const avatarUrl = groupData?.avatar;
        const name = groupData?.name || '?';
        const isValidUrl = typeof avatarUrl === 'string' && (avatarUrl.startsWith('http') || avatarUrl.startsWith('data:image'));

        if (avatarLoadError || !isValidUrl) {
            const initials = name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || name.charAt(0).toUpperCase();
            return <span>{initials}</span>;
        }
        return <img src={avatarUrl} alt={name} onError={() => setAvatarLoadError(true)} />;
    };

    const handleOpenRenameModal = () => setIsRenameModalOpen(true);

    const handleConfirmRename = (newName) => {
        if (onRenameGroup) {
            onRenameGroup(newName, groupData._id || groupData.id); // Truyền cả ID nhóm để cha xử lý
        }
        setIsRenameModalOpen(false);
    };

    const handleGroupAvatarUploadClick = () => {
        if (groupAvatarInputRef.current && !isUploadingAvatar) { // Không cho click nếu đang upload
            groupAvatarInputRef.current.click();
        }
    };

    // --- BẮT ĐẦU: CẬP NHẬT HÀM XỬ LÝ UPLOAD AVATAR ---
    const handleGroupAvatarFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file || !file.type.startsWith('image/')) {
            alert("Vui lòng chọn một tệp hình ảnh hợp lệ.");
            event.target.value = null;
            return;
        }

        if (!groupData?._id || !currentUserId) {
            alert("Lỗi: Thiếu thông tin để cập nhật avatar (ID nhóm hoặc ID người dùng).");
            event.target.value = null;
            return;
        }

        setIsUploadingAvatar(true);
        const formData = new FormData();
        formData.append('file', file); // Backend dùng 'file' làm tên field cho Multer
        formData.append('conversation_id', groupData._id);
        formData.append('user_id', currentUserId);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/conversation/updateConversationAvatarWeb`, {
                method: 'PUT',
                body: formData, // Khi gửi FormData, không cần đặt header 'Content-Type'
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message || 'Cập nhật ảnh đại diện nhóm thành công!');
                if (onUpdateGroupAvatar && data.conversation) {
                    // Gọi callback của cha với toàn bộ đối tượng conversation đã được cập nhật
                    onUpdateGroupAvatar(data.conversation); 
                }
            } else {
                alert(data.message || 'Cập nhật ảnh đại diện nhóm thất bại.');
            }
        } catch (error) {
            console.error("Lỗi khi cập nhật avatar nhóm:", error);
            alert("Lỗi kết nối hoặc xử lý phía máy chủ, không thể cập nhật avatar.");
        } finally {
            setIsUploadingAvatar(false);
            event.target.value = null; 
        }
    };
    // --- KẾT THÚC: CẬP NHẬT HÀM XỬ LÝ UPLOAD AVATAR ---

    return (
        <>
            <div className={`group-details-modal-overlay ${isOpen ? 'active' : ''}`} onMouseDown={onClose}>
                <div className="group-details-modal-content" onMouseDown={(e) => e.stopPropagation()}>
                    <div className="group-details-modal-header">
                        <span style={{width: '32px'}}></span>
                        <h3>Thông tin nhóm</h3>
                        <button className="group-details-modal-close-btn" onClick={onClose} disabled={isUploadingAvatar}>
                            <FaTimes />
                        </button>
                    </div>

                    <div className="group-details-modal-body">
                        <div className="group-main-info-section">
                            <div 
                                className="group-main-avatar" 
                                style={{cursor: isUploadingAvatar ? 'default' : 'pointer'}} 
                                onClick={handleGroupAvatarUploadClick} 
                                title="Đổi ảnh đại diện nhóm"
                            >
                                {isUploadingAvatar ? (
                                    <FaSpinner className="avatar-spinner" />
                                ) : (
                                    <SafeAvatar />
                                )}
                                {!isUploadingAvatar && <span className="camera-icon-overlay"><FaCamera /></span>}
                            </div>
                            <input
                                type="file"
                                ref={groupAvatarInputRef}
                                style={{ display: 'none' }}
                                accept="image/*" // Chỉ cho phép chọn file ảnh
                                onChange={handleGroupAvatarFileChange}
                                disabled={isUploadingAvatar}
                            />
                            <div className="group-name-container">
                                <h2>{groupName}</h2>
                                {(currentUserIsAdmin || groupData?.currentUserIsDeputy) && ( // Cho cả phó nhóm đổi tên
                                    <FaPen className="edit-icon" onClick={handleOpenRenameModal} title="Đổi tên nhóm"/>
                                )}
                            </div>
                            
                        </div>

                        <div className="group-info-section">
                            <div className="group-info-list-item" onClick={onManageMembers || (() => console.log("View members"))}>
                                <FaUserFriends className="item-icon" />
                                <span className="item-label">Thành viên ({memberCount})</span>
                            </div>
                            <div className="members-preview-container">
                                {members.slice(0, 3).map(member => (
                                    <div key={member._id || member.id} className="member-avatar-preview" title={member.name || member.userName}>
                                        {member.avatar ? <img src={member.avatar} alt={member.name || member.userName} /> : (member.name || member.userName || '?').charAt(0).toUpperCase()}
                                    </div>
                                ))}
                                {members.length > 3 && <div className="more-members-indicator">...</div>}
                            </div>
                        </div>
                        
                       

                        <div className="group-info-section">
                            <div className="group-info-list-item" style={{cursor: 'default'}}>
                                <FaLink className="item-icon" />
                                <span className="item-label">Link tham gia nhóm</span>
                            </div>
                            <div className="group-link-display">
                                <span className="link-text">{groupLink}</span>
                                <div className="group-link-actions">
                                    <button title="Sao chép link" onClick={() => onCopyLink ? onCopyLink(groupLink) : navigator.clipboard.writeText(groupLink).then(()=>alert('Đã sao chép link!'))}>
                                        <FaCopy />
                                    </button>
                                    <button title="Chia sẻ link" onClick={() => console.log("Share link clicked")}>
                                        <FaShareSquare />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="group-info-section">
                            <div className="group-info-list-item" onClick={() => onManageMembers ? onManageMembers() : console.log("Manage group clicked")}>
                                <FaCog className="item-icon" />
                                <span className="item-label">Quản lý nhóm</span>
                            </div>
                            <div className="group-info-list-item danger-action" onClick={onLeaveGroup || (() => console.log("Leave group clicked"))}>
                                <FaSignOutAlt className="item-icon" />
                                <span className="item-label">Rời nhóm</span>
                            </div>
                            {currentUserIsAdmin && (
                                <div className="group-info-list-item danger-action" onClick={onDisbandGroup || (() => console.log("Disband group clicked"))}>
                                    <FaTrashAlt className="item-icon" />
                                    <span className="item-label">Giải tán nhóm</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <RenameGroupModal
                isOpen={isRenameModalOpen}
                onClose={() => setIsRenameModalOpen(false)}
                onConfirmRename={handleConfirmRename}
                currentGroupName={groupName}
                groupMembers={members}
                conversationId={groupData?._id || groupData?.id} // Truyền ID nhóm
                currentUserId={currentUserId} // Truyền ID người dùng
            />
        </>
    );
}

export default GroupDetailsModal;
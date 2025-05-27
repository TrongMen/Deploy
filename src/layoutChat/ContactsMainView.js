// Trong file ContactsMainView.jsx

import React, { useState, useEffect, useRef } from 'react';
import '../styles/ContactsMainView.css';
import { 
    FaSearch, FaFilter, FaEllipsisH, FaSortAmountDown, FaAddressBook, FaUsers, 
    FaUserPlus, FaCommentDots, FaSpinner, FaPaperPlane, FaTrashAlt, FaUserMinus // Thêm icon xóa bạn
} from 'react-icons/fa';

// Giả sử onInitiateChatWithFriend và fetchAllConversations được truyền từ ZaloPCLayout
function ContactsMainView({ subViewType, currentLoggedInUserId, onInitiateChatWithFriend, fetchAllConversations }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOrder, setSortOrder] = useState('name_asc');
    const [receivedFriendRequests, setReceivedFriendRequests] = useState([]);
    const [isLoadingReceivedRequests, setIsLoadingReceivedRequests] = useState(false);
    const [sentFriendRequests, setSentFriendRequests] = useState([]);
    const [isLoadingSentRequests, setIsLoadingSentRequests] = useState(false);
    const [friendsList, setFriendsList] = useState([]);
    const [isLoadingFriends, setIsLoadingFriends] = useState(false);
    const [friendsError, setFriendsError] = useState('');
    const [groupsList, setGroupsList] = useState([]);
    const [isLoadingGroups, setIsLoadingGroups] = useState(false);
    const [groupsError, setGroupsError] = useState('');
    const [requestActionStatus, setRequestActionStatus] = useState({});
    const [globalSearchResult, setGlobalSearchResult] = useState(null);
    const [isGlobalSearching, setIsGlobalSearching] = useState(false);
    const [globalSearchError, setGlobalSearchError] = useState('');
    const [globalSearchActionStatus, setGlobalSearchActionStatus] = useState('');
    const [openMenuId, setOpenMenuId] = useState(null); // Dùng cho cả menu bạn bè và menu nhóm

    useEffect(() => {
        const handleClickOutside = (event) => {
            // Kiểm tra xem click có nằm ngoài menu và nút mở menu không
            if (openMenuId && !event.target.closest('.contact-item-menu') && !event.target.closest('.group-item-menu') && !event.target.closest('.contact-item-options-btn')) {
                setOpenMenuId(null);
            }
        };
        if (openMenuId) {
            document.addEventListener('click', handleClickOutside);
        }
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [openMenuId]);

    const handleMenuToggle = (e, id) => {
        e.stopPropagation();
        setOpenMenuId(openMenuId === id ? null : id);
    };

    const handleSendMessageToGroup = (group) => {
        if (onInitiateChatWithFriend && group) {
            onInitiateChatWithFriend({
                _id: group._id,
                name: group.conversationName,
                avatar: group.avatar,
                type: 'group',
                isGroup: true,
                members: group.members,
            });
        }
        setOpenMenuId(null);
    };
    
    const handleDisbandGroup = async (groupName, groupId) => {
        if (window.confirm(`Bạn có chắc chắn muốn giải tán nhóm "${groupName}" không?`)) {
            const token = localStorage.getItem('user_token');
            try {
                const response = await fetch(`${process.env.REACT_PUBLIC_API_URL}/conversation/disbandGroupWeb`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ conversation_id: groupId, user_id: currentLoggedInUserId })
                });
                const data = await response.json();
                if (response.ok) {
                    alert(data.message || "Giải tán nhóm thành công!");
                    setGroupsList(prev => prev.filter(g => g._id !== groupId));
                    if(typeof fetchAllConversations === 'function') fetchAllConversations();
                } else {
                    alert(data.message || "Giải tán nhóm thất bại.");
                }
            } catch (error) {
                alert("Lỗi kết nối khi giải tán nhóm.");
            }
        }
        setOpenMenuId(null);
    };

    const fetchFriendsList = async () => {
        setIsLoadingFriends(true);
        setFriendsError('');
        setFriendsList([]);
        const token = localStorage.getItem('user_token');
        try {
            const response = await fetch(`${process.env.REACT_PUBLIC_API_URL}/user/getFriends/${currentLoggedInUserId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setFriendsList(data || []);
            } else {
                setFriendsError('Không thể tải danh sách bạn bè.');
                setFriendsList([]);
            }
        } catch (error) {
            setFriendsError('Lỗi kết nối máy chủ.');
            setFriendsList([]);
        } finally {
            setIsLoadingFriends(false);
        }
    };
    
    useEffect(() => {
        setGlobalSearchResult(null);
        setGlobalSearchError('');
        setGlobalSearchActionStatus('');
        setRequestActionStatus({});
        const token = localStorage.getItem('user_token');

        if (currentLoggedInUserId) {
            if (subViewType === 'friend_requests') {
                const fetchAllRequests = async () => {
                    setIsLoadingReceivedRequests(true);
                    setIsLoadingSentRequests(true);
                    try {
                        const receivedRes = await fetch(`${process.env.REACT_PUBLIC_API_URL}/user/friend-request/${currentLoggedInUserId}`, {
                             headers: { 'Authorization': `Bearer ${token}` }
                        });
                        if (receivedRes.ok) {
                            const receivedData = await receivedRes.json();
                            setReceivedFriendRequests(receivedData || []);
                        } else {
                            setReceivedFriendRequests([]);
                        }
                    } catch (error) {
                        setReceivedFriendRequests([]);
                    } finally {
                        setIsLoadingReceivedRequests(false);
                    }

                    try {
                        const sentRes = await fetch(`${process.env.REACT_PUBLIC_API_URL}/user/getSentFriendRequests/${currentLoggedInUserId}`, {
                             headers: { 'Authorization': `Bearer ${token}` }
                        });
                        if (sentRes.ok) {
                            const sentData = await sentRes.json();
                            setSentFriendRequests(sentData || []);
                        } else {
                            setSentFriendRequests([]);
                        }
                    } catch (error) {
                        setSentFriendRequests([]);
                    } finally {
                        setIsLoadingSentRequests(false);
                    }
                };
                fetchAllRequests();
            } else if (subViewType === 'friends') {
                fetchFriendsList();
            } else if (subViewType === 'groups') {
                const fetchGroupsList = async () => {
                    setIsLoadingGroups(true);
                    setGroupsError('');
                    setGroupsList([]);
                    try {
                        const response = await fetch(`${process.env.REACT_PUBLIC_API_URL}/conversation/getConversationGroupByUserIDWeb`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                            body: JSON.stringify({ user_id: currentLoggedInUserId }),
                        });
                        if (response.ok) {
                            const data = await response.json();
                            setGroupsList(data.conversationGroup || []);
                        } else {
                            setGroupsError('Không thể tải danh sách nhóm.');
                            setGroupsList([]);
                        }
                    } catch (error) {
                        setGroupsError('Lỗi kết nối máy chủ.');
                        setGroupsList([]);
                    } finally {
                        setIsLoadingGroups(false);
                    }
                };
                fetchGroupsList();
            }
        }
    }, [subViewType, currentLoggedInUserId]);

    const handleAcceptFriendRequest = async (senderId) => {
        if (!currentLoggedInUserId) {
            setRequestActionStatus(prev => ({ ...prev, [`received_${senderId}`]: 'Lỗi: Thiếu ID người dùng' }));
            return;
        }
        setRequestActionStatus(prev => ({ ...prev, [`received_${senderId}`]: 'Đang xử lý...' }));
        const token = localStorage.getItem('user_token');
        try {
            const response = await fetch(`${process.env.REACT_PUBLIC_API_URL}/user/acceptFriendRequestWeb`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ user_id: currentLoggedInUserId, friend_id: senderId }),
            });
            const data = await response.json();
            if (response.ok) {
                setRequestActionStatus(prev => ({ ...prev, [`received_${senderId}`]: 'Đã chấp nhận' }));
                setReceivedFriendRequests(prevRequests => prevRequests.filter(req => req._id !== senderId));
                if(typeof fetchAllConversations === 'function') fetchAllConversations();
                if (subViewType === 'friends') fetchFriendsList();
            } else {
                setRequestActionStatus(prev => ({ ...prev, [`received_${senderId}`]: data.message || 'Lỗi' }));
            }
        } catch (error) {
            setRequestActionStatus(prev => ({ ...prev, [`received_${senderId}`]: 'Lỗi kết nối' }));
        }
    };

    const handleDeclineFriendRequest = async (senderId) => {
        if (!currentLoggedInUserId) {
            setRequestActionStatus(prev => ({ ...prev, [`received_${senderId}`]: 'Lỗi: Thiếu ID người dùng' }));
            return;
        }
        setRequestActionStatus(prev => ({ ...prev, [`received_${senderId}`]: 'Đang xử lý...' }));
        const token = localStorage.getItem('user_token');
        try {
            const response = await fetch(${process.env.REACT_PUBLIC_API_URL}/user/deleteFriendRequestWeb, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ user_id: currentLoggedInUserId, friend_id: senderId }),
            });
            const data = await response.json();
            if (response.ok) {
                setRequestActionStatus(prev => ({ ...prev, [`received_${senderId}`]: 'Đã từ chối' }));
                setReceivedFriendRequests(prevRequests => prevRequests.filter(req => req._id !== senderId));
            } else {
                setRequestActionStatus(prev => ({ ...prev, [`received_${senderId}`]: data.message || 'Lỗi' }));
            }
        } catch (error) {
            setRequestActionStatus(prev => ({ ...prev, [`received_${senderId}`]: 'Lỗi kết nối' }));
        }
    };

    const handleCancelSentRequest = async (recipientId) => {
        if (!currentLoggedInUserId) {
            setRequestActionStatus(prev => ({ ...prev, [`sent_${recipientId}`]: 'Lỗi: Thiếu ID người dùng' }));
            return;
        }
        setRequestActionStatus(prev => ({ ...prev, [`sent_${recipientId}`]: 'Đang thu hồi...' }));
        const token = localStorage.getItem('user_token');
        try {
            const response = await fetch(`${process.env.REACT_PUBLIC_API_URL}/user/cancelFriendRequestWeb`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ user_id: currentLoggedInUserId, friend_id: recipientId }),
            });
            const data = await response.json();
            if (response.ok) {
                setRequestActionStatus(prev => ({ ...prev, [`sent_${recipientId}`]: 'Đã thu hồi lời mời' }));
                setSentFriendRequests(prevRequests => prevRequests.filter(req => req._id !== recipientId));
            } else {
                setRequestActionStatus(prev => ({ ...prev, [`sent_${recipientId}`]: data.message || 'Lỗi thu hồi' }));
            }
        } catch (error) {
            setRequestActionStatus(prev => ({ ...prev, [`sent_${recipientId}`]: 'Lỗi kết nối' }));
        }
    };

    const handleGlobalPhoneSearch = async () => {
        if (!searchTerm.trim() || !/^\d{10,11}$/.test(searchTerm.trim())) {
            setGlobalSearchError('Vui lòng nhập SĐT hợp lệ để tìm kiếm.');
            setGlobalSearchResult(null);
            return;
        }
        setIsGlobalSearching(true);
        setGlobalSearchError('');
        setGlobalSearchResult(null);
        setGlobalSearchActionStatus('');
        const token = localStorage.getItem('user_token');
        try {
            const response = await fetch(`${process.env.REACT_PUBLIC_API_URL}/user/findUserByPhoneWeb`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ phoneNumber: searchTerm.trim() }),
            });
            const data = await response.json();
            if (response.ok && data.user) {
                setGlobalSearchResult({ ...data.user, hasPendingSentRequest: false });
            } else {
                setGlobalSearchResult(null);
                setGlobalSearchError(data.message || 'Không tìm thấy người dùng trên hệ thống.');
            }
        } catch (error) {
            setGlobalSearchResult(null);
            setGlobalSearchError('Lỗi kết nối khi tìm kiếm SĐT.');
        } finally {
            setIsGlobalSearching(false);
        }
    };

    const handleSendRequestToGlobalUser = async (recipientId) => {
        if (!currentLoggedInUserId) {
            setGlobalSearchActionStatus('Lỗi: Không xác định người dùng hiện tại.');
            return;
        }
        setGlobalSearchActionStatus('Đang gửi lời mời...');
        const token = localStorage.getItem('user_token');
        try {
            const response = await fetch(`${process.env.REACT_PUBLIC_API_URL}/user/sendFriendRequestWeb`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ user_id: currentLoggedInUserId, friend_id: recipientId }),
            });
            const data = await response.json();
            if (response.ok) {
                setGlobalSearchActionStatus(data.message || 'Đã gửi lời mời!');
                setGlobalSearchResult(prev => prev ? { ...prev, hasPendingSentRequest: true } : null);
            } else {
                setGlobalSearchActionStatus(data.message || 'Gửi lời mời thất bại.');
            }
        } catch (error) {
            setGlobalSearchActionStatus('Lỗi kết nối khi gửi lời mời.');
        }
    };

    const handleCancelRequestForGlobalUser = async (recipientId) => {
        if (!currentLoggedInUserId) {
            setGlobalSearchActionStatus('Lỗi: Không xác định người dùng hiện tại.');
            return;
        }
        setGlobalSearchActionStatus('Đang hủy lời mời...');
        const token = localStorage.getItem('user_token');
        try {
            const response = await fetch(`${process.env.REACT_PUBLIC_API_URL}/user/cancelFriendRequestWeb`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ user_id: currentLoggedInUserId, friend_id: recipientId }),
            });
            const data = await response.json();
            if (response.ok) {
                setGlobalSearchActionStatus(data.message || 'Đã hủy lời mời!');
                setGlobalSearchResult(prev => prev ? { ...prev, hasPendingSentRequest: false } : null);
            } else {
                setGlobalSearchActionStatus(data.message || 'Hủy lời mời thất bại.');
            }
        } catch (error) {
            setGlobalSearchActionStatus('Lỗi kết nối khi hủy lời mời.');
        }
    };

    const handleSearchInputChange = (e) => {
        setSearchTerm(e.target.value);
        if (subViewType !== 'friend_requests' || !e.target.value.trim().match(/^\d+$/)) {
            setGlobalSearchResult(null);
            setGlobalSearchError('');
            setGlobalSearchActionStatus('');
        }
    };

    const handleSearchInputKeyPress = (e) => {
        if (e.key === 'Enter' && subViewType === 'friend_requests' && searchTerm.trim().match(/^\d{10,11}$/)) {
            handleGlobalPhoneSearch();
        }
    };

    const handleDeleteFriend = async (friendIdToDelete, friendName) => {
        if (!currentLoggedInUserId) {
            alert("Lỗi: Không xác định được người dùng hiện tại.");
            return;
        }
        if (window.confirm(`Bạn có chắc chắn muốn xóa bạn bè với ${friendName} không?`)) {
            setRequestActionStatus(prev => ({ ...prev, [`friend_${friendIdToDelete}`]: 'Đang xóa...' }));
            const token = localStorage.getItem('user_token');
            try {
                const response = await fetch(`${process.env.REACT_PUBLIC_API_URL}/user/deleteFriendWeb`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({
                        user_id: currentLoggedInUserId,
                        friend_id: friendIdToDelete
                    }),
                });
                const data = await response.json();
                if (response.ok) {
                    alert(data.message || "Xóa bạn bè thành công!");
                    setFriendsList(prevFriends => prevFriends.filter(friend => friend._id !== friendIdToDelete));
                    if(typeof fetchAllConversations === 'function') {
                        fetchAllConversations(); // Gọi để ZaloPCLayout cập nhật lại allConversations
                    }
                } else {
                    alert(data.message || "Xóa bạn bè thất bại.");
                    setRequestActionStatus(prev => ({ ...prev, [`friend_${friendIdToDelete}`]: data.message || 'Lỗi xóa' }));
                }
            } catch (error) {
                alert("Lỗi kết nối khi xóa bạn bè.");
                setRequestActionStatus(prev => ({ ...prev, [`friend_${friendIdToDelete}`]: 'Lỗi kết nối' }));
            }
        }
         setOpenMenuId(null);
    };


    const renderFriendItem = (contact) => (
        <div key={contact._id} className="contact-list-item">
            <div 
                className="contact-item-main-info" 
                onClick={() => onInitiateChatWithFriend && onInitiateChatWithFriend(contact)} 
                title={`Nhắn tin với ${contact.userName}`} 
                style={{ cursor: 'pointer', flexGrow: 1 }}
            >
                <img src={contact.avatar || 'https://via.placeholder.com/40'} alt={contact.userName} className="contact-item-avatar" />
                <div className="contact-item-info">
                    <span className="contact-item-name">{contact.userName}</span>
                </div>
            </div>
            <div className="contact-item-options-container">
                <button className="contact-item-options-btn" onClick={(e) => handleMenuToggle(e, contact._id)}>
                    <FaEllipsisH />
                </button>
                {openMenuId === contact._id && (
                    <div className="contact-item-menu" onClick={(e) => e.stopPropagation()}>
                        <button className="menu-item" onClick={() => { if(onInitiateChatWithFriend) onInitiateChatWithFriend(contact); setOpenMenuId(null); }}>
                            <FaCommentDots className="menu-item-icon" /> Nhắn tin
                        </button>
                        <button className="menu-item menu-item-danger" onClick={() => handleDeleteFriend(contact._id, contact.userName)}>
                            <FaUserMinus className="menu-item-icon" /> Xóa bạn
                        </button>
                    </div>
                )}
            </div>
        </div>
    );

    const renderGroupItem = (group) => (
        <div key={group._id} className="group-list-item" onClick={() => onInitiateChatWithFriend && onInitiateChatWithFriend({...group, type: 'group', name: group.conversationName})} style={{cursor: 'pointer'}}>
            <div className="group-item-main-info">
                <div className="group-item-avatar">
                    {group.avatar ? (
                        <img src={group.avatar} alt={group.conversationName} />
                    ) : (
                        <FaUsers />
                    )}
                </div>
                <div className="group-item-info">
                    <span className="group-item-name">{group.conversationName}</span>
                    {group.members && (
                        <span className="group-item-members">{group.members.length} thành viên</span>
                    )}
                </div>
            </div>
            <div className="contact-item-options-container">
                <button className="contact-item-options-btn" onClick={(e) => handleMenuToggle(e, group._id)}>
                    <FaEllipsisH />
                </button>
                {openMenuId === group._id && (
                    <div className="group-item-menu" onClick={(e) => e.stopPropagation()}>
                         <button className="menu-item" onClick={() => {onInitiateChatWithFriend && onInitiateChatWithFriend({...group, type: 'group', name: group.conversationName}); setOpenMenuId(null); }}>
                            <FaPaperPlane className="menu-item-icon" />
                            <span>Nhắn tin</span>
                        </button>
                        <button className="menu-item menu-item-danger" onClick={() => handleDisbandGroup(group.conversationName, group._id)}>
                            <FaTrashAlt className="menu-item-icon" />
                            <span>Giải tán nhóm</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );

    const renderReceivedRequestItem = (request) => (
        <div key={request._id} className="friend-request-card received-request-card">
            <img src={request.avatar || 'https://via.placeholder.com/60'} alt={request.userName} className="request-card-avatar" />
            <div className="request-card-info">
                <span className="request-card-name">{request.userName}</span>
                {requestActionStatus[`received_${request._id}`] && <span className="request-action-feedback">{requestActionStatus[`received_${request._id}`]}</span>}
            </div>
            {(!requestActionStatus[`received_${request._id}`] || requestActionStatus[`received_${request._id}`].includes('Lỗi')) && (
                <div className="request-card-actions">
                    <button className="request-action-btn decline-btn" onClick={() => handleDeclineFriendRequest(request._id)}>Từ chối</button>
                    <button className="request-action-btn accept-btn" onClick={() => handleAcceptFriendRequest(request._id)}>Chấp nhận</button>
                </div>
            )}
        </div>
    );

    const renderSentRequestItem = (request) => (
        <div key={request._id} className="friend-request-card sent-request-card">
            <img src={request.avatar || 'https://via.placeholder.com/60'} alt={request.userName} className="request-card-avatar" />
            <div className="request-card-info">
                <span className="request-card-name">{request.userName}</span>
                {requestActionStatus[`sent_${request._id}`] ? (
                    <span className="request-card-status">{requestActionStatus[`sent_${request._id}`]}</span>
                ) : (
                    <span className="request-card-status">Đã gửi lời mời</span>
                )}
            </div>
            {(!requestActionStatus[`sent_${request._id}`] || requestActionStatus[`sent_${request._id}`].includes('Lỗi')) && (
                <div className="request-card-actions">
                    <button
                        className="request-action-btn withdraw-btn"
                        onClick={() => handleCancelSentRequest(request._id)}
                    >
                        Thu hồi lời mời
                    </button>
                </div>
            )}
        </div>
    );

    const renderGlobalSearchResultItem = () => (
        globalSearchResult && (
            <div className="friend-requests-section global-search-result-section">
                <h3 className="friend-requests-section-title">Kết quả tìm kiếm SĐT</h3>
                <div className="friend-request-grid">
                    <div key={globalSearchResult._id} className="friend-request-card suggestion-card">
                        <img src={globalSearchResult.avatar || 'https://via.placeholder.com/60'} alt={globalSearchResult.userName} className="request-card-avatar" />
                        <div className="request-card-info">
                            <span className="request-card-name">{globalSearchResult.userName}</span>
                            {globalSearchActionStatus && <span className="request-action-feedback">{globalSearchActionStatus}</span>}
                        </div>
                        <div className="request-card-actions">
                            {(globalSearchActionStatus !== 'Đang gửi lời mời...' && globalSearchActionStatus !== 'Đang hủy lời mời...') ? (
                                <button
                                    className={`request-action-btn ${globalSearchResult.hasPendingSentRequest ? 'withdraw-btn' : 'add-friend-btn'}`}
                                    onClick={() => globalSearchResult.hasPendingSentRequest
                                        ? handleCancelRequestForGlobalUser(globalSearchResult._id)
                                        : handleSendRequestToGlobalUser(globalSearchResult._id)}
                                >
                                    {globalSearchResult.hasPendingSentRequest ? 'Hủy lời mời' : 'Kết bạn'}
                                </button>
                            ) : (
                                <FaSpinner className="spinner-icon" />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )
    );

    let title = '';
    let titleIcon = null;
    let searchPlaceholder = "Tìm kiếm...";
    let content = null;

    if (subViewType === 'friends') {
        title = `Bạn bè (${friendsList.length})`;
        titleIcon = <FaAddressBook className="contacts-title-icon" />;
        searchPlaceholder = "Tìm bạn";
        const filteredFriends = friendsList.filter(item =>
            item.userName.toLowerCase().includes(searchTerm.toLowerCase())
        );
        const groupedFriends = filteredFriends.reduce((acc, contact) => {
            const firstLetter = contact.userName.charAt(0).toUpperCase();
            const groupKey = firstLetter.match(/[A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/i) ? firstLetter : '#';
            if (!acc[groupKey]) acc[groupKey] = [];
            acc[groupKey].push(contact);
            return acc;
        }, {});

        content = (
            <>
                <div className="contacts-controls">
                    <div className="contacts-search-bar">
                        <FaSearch className="contacts-search-icon" />
                        <input type="text" placeholder={searchPlaceholder} value={searchTerm} onChange={handleSearchInputChange} />
                    </div>
                    <div className="contacts-filters">
                        <button className="filter-btn" onClick={() => setSortOrder(sortOrder === 'name_asc' ? 'name_desc' : 'name_asc')}>
                            <FaSortAmountDown /> Tên ({sortOrder === 'name_asc' ? 'A-Z' : 'Z-A'})
                        </button>
                        <button className="filter-btn"><FaFilter /> Tất cả</button>
                    </div>
                </div>
                <div className="contacts-list-container">
                    {isLoadingFriends && <div className="loading-requests"><FaSpinner className="spinner-icon" /> Đang tải danh sách bạn bè...</div>}
                    {friendsError && <div className="search-error-message">{friendsError}</div>}
                    {!isLoadingFriends && !friendsError && (
                        <>
                            {Object.keys(groupedFriends).sort((a, b) => a === '#' ? 1 : b === '#' ? -1 : a.localeCompare(b, 'vi')).map(letter => (
                                <div key={letter} className="contact-group">
                                    <h3 className="contact-group-letter">{letter}</h3>
                                    {groupedFriends[letter].map(contact => renderFriendItem(contact))}
                                </div>
                            ))}
                            {friendsList.length === 0 && !searchTerm && <p className="no-contacts-found">Danh sách bạn bè trống.</p>}
                            {filteredFriends.length === 0 && searchTerm && <p className="no-contacts-found">{`Không tìm thấy bạn bè nào cho "${searchTerm}"`}</p>}
                        </>
                    )}
                </div>
            </>
        );
    } else if (subViewType === 'groups') {
        title = `Danh sách nhóm (${groupsList.length})`;
        titleIcon = <FaUsers className="contacts-title-icon" />;
        searchPlaceholder = "Tìm nhóm...";
        const filteredGroups = groupsList.filter(item =>
            item.conversationName.toLowerCase().includes(searchTerm.toLowerCase())
        );
        content = (
            <>
                <div className="contacts-controls">
                    <div className="contacts-search-bar">
                        <FaSearch className="contacts-search-icon" />
                        <input type="text" placeholder={searchPlaceholder} value={searchTerm} onChange={handleSearchInputChange} />
                    </div>
                    <div className="contacts-filters">
                        <button className="filter-btn">
                            <FaSortAmountDown /> Hoạt động (mới → cũ)
                        </button>
                        <button className="filter-btn"><FaFilter /> Tất cả</button>
                    </div>
                </div>
                <div className="contacts-list-container groups-list-container">
                    {isLoadingGroups && <div className="loading-requests"><FaSpinner className="spinner-icon" /> Đang tải danh sách nhóm...</div>}
                    {groupsError && <div className="search-error-message">{groupsError}</div>}
                    {!isLoadingGroups && !groupsError && (
                        <>
                            {filteredGroups.map(group => renderGroupItem(group))}
                            {groupsList.length === 0 && !searchTerm && <p className="no-contacts-found">Chưa có nhóm nào.</p>}
                            {filteredGroups.length === 0 && searchTerm && <p className="no-contacts-found">{`Không tìm thấy nhóm nào cho "${searchTerm}"`}</p>}
                        </>
                    )}
                </div>
            </>
        );
    } else if (subViewType === 'friend_requests') {
        title = 'Lời mời kết bạn';
        titleIcon = <FaUserPlus className="contacts-title-icon" />;
        searchPlaceholder = "Tìm theo tên hoặc nhập SĐT để tìm (Enter)";

        const filteredReceivedRequests = receivedFriendRequests.filter(req =>
            req.userName.toLowerCase().includes(searchTerm.toLowerCase()) && !searchTerm.trim().match(/^\d+$/)
        );
        const filteredSentRequests = sentFriendRequests.filter(req =>
            req.userName.toLowerCase().includes(searchTerm.toLowerCase()) && !searchTerm.trim().match(/^\d+$/)
        );

        content = (
            <>
                <div className="contacts-controls friend-requests-controls">
                    <div className="contacts-search-bar">
                        <FaSearch className="contacts-search-icon" />
                        <input
                            type="text"
                            placeholder={searchPlaceholder}
                            value={searchTerm}
                            onChange={handleSearchInputChange}
                            onKeyPress={handleSearchInputKeyPress}
                        />
                    </div>
                </div>
                <div className="contacts-list-container friend-requests-container">

                    {isGlobalSearching && <div className="loading-requests"><FaSpinner className="spinner-icon" /> Đang tìm kiếm trên hệ thống...</div>}
                    {globalSearchError && <div className="search-error-message">{globalSearchError}</div>}
                    {renderGlobalSearchResultItem()}

                    <div className="friend-requests-section">
                        <h3 className="friend-requests-section-title">Lời mời nhận được ({filteredReceivedRequests.length})</h3>
                        {isLoadingReceivedRequests && <div className="loading-requests"><FaSpinner className="spinner-icon" /> Đang tải...</div>}
                        {!isLoadingReceivedRequests && (
                            <div className="friend-request-grid">
                                {filteredReceivedRequests.length > 0 ?
                                    filteredReceivedRequests.map(request => renderReceivedRequestItem(request))
                                    : ((!searchTerm || searchTerm.trim().match(/^\d+$/)) && !globalSearchResult && !isGlobalSearching && <p className="no-requests-message">Bạn không có lời mời kết bạn nào.</p>)
                                }
                                {filteredReceivedRequests.length === 0 && searchTerm && !searchTerm.trim().match(/^\d+$/) && !globalSearchResult && !isGlobalSearching && <p className="no-contacts-found">{`Không tìm thấy lời mời nào khớp với "${searchTerm}" trong danh sách đã nhận.`}</p>}
                            </div>
                        )}
                    </div>

                    <div className="friend-requests-section">
                        <h3 className="friend-requests-section-title">Lời mời đã gửi ({filteredSentRequests.length})</h3>
                        {isLoadingSentRequests && <div className="loading-requests"><FaSpinner className="spinner-icon" /> Đang tải...</div>}
                        {!isLoadingSentRequests && (
                            <div className="friend-request-grid">
                                {filteredSentRequests.length > 0 ?
                                    filteredSentRequests.map(request => renderSentRequestItem(request))
                                    : ((!searchTerm || searchTerm.trim().match(/^\d+$/)) && !globalSearchResult && !isGlobalSearching && <p className="no-requests-message">Bạn chưa gửi lời mời nào.</p>)
                                }
                                {filteredSentRequests.length === 0 && searchTerm && !searchTerm.trim().match(/^\d+$/) && !globalSearchResult && !isGlobalSearching && <p className="no-contacts-found">{`Không tìm thấy lời mời nào khớp với "${searchTerm}" trong danh sách đã gửi.`}</p>}
                            </div>
                        )}
                    </div>
                </div>
            </>
        );
    }

    return (
        <div className="contacts-main-view">
            <div className="contacts-header-bar">
                <div className="contacts-title-container">
                    {titleIcon}
                    <h2 className="contacts-view-title">{title}</h2>
                </div>
            </div>
            {content}
        </div>
    );
}

export default ContactsMainView;
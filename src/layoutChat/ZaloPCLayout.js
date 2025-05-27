import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import '../styles/ZaloPCLayout.css';
import Sidebar from './Sidebar';
import MainContent from './MainContent';
import ContactsMainView from './ContactsMainView';
import AccountInfoModal from '../modals/AccountInfoModal';
import SettingsModal from '../modals/SettingsModal';
import UpdateInfoModal from '../modals/UpdateInfoModal';
import AddFriendModal from '../modals/AddFriendModal';
import CreateGroupModal from '../modals/CreateGroupModal';

const SOCKET_SERVER_URL = `${process.env.REACT_PUBLIC_SOCKET_URL}`;

function ZaloPCLayout({ onLogout }) {
    const [selectedChat, setSelectedChat] = useState(null);
    const [isAccountInfoModalOpen, setIsAccountInfoModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isUpdateInfoModalOpen, setIsUpdateInfoModalOpen] = useState(false);
    const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState(false);
    const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
    const [activeView, setActiveView] = useState('chats');
    const [activeContactsNavItem, setActiveContactsNavItem] = useState('friends');
    const [loggedInUser, setLoggedInUser] = useState(null);
    const [allConversations, setAllConversations] = useState([]);
    const [isLoadingConversations, setIsLoadingConversations] = useState(false);
    const [conversationsError, setConversationsError] = useState('');
    const [socket, setSocket] = useState(null);
    const socketRef = useRef(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setLoggedInUser(parsedUser);
            } catch (error) {
                console.error("Lỗi khi đọc thông tin người dùng từ localStorage:", error);
                onLogout();
            }
        } else {
            onLogout();
        }
    }, [onLogout]);

    useEffect(() => {
        if (loggedInUser?._id) {
            const jwtToken = localStorage.getItem('user_token');
            const newSocket = io(SOCKET_SERVER_URL, {
                auth: {
                    token: jwtToken
                }
            });
            socketRef.current = newSocket;
            setSocket(newSocket);

            newSocket.on('connect', () => {
                console.log('✅ ZaloPCLayout: Socket connected to server:', newSocket.id);
            });

            newSocket.on('disconnect', (reason) => {
                console.log('❌ ZaloPCLayout: Socket disconnected from server:', reason);
            });

            newSocket.on('connect_error', (error) => {
                console.error('🔴 ZaloPCLayout: Socket connection error:', error);
            });

            return () => {
                if (newSocket) {
                    console.log('ZaloPCLayout: Disconnecting socket...');
                    newSocket.disconnect();
                }
                socketRef.current = null;
                setSocket(null);
            };
        } else {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
                setSocket(null);
            }
        }
    }, [loggedInUser]);

    const fetchAllUserConversations = async () => {
    if (!loggedInUser?._id) {
        setAllConversations([]);
        return;
    }
    setIsLoadingConversations(true);
    setConversationsError('');
    let fetchedGroups = [];
    let fetchedFriendsAsConversations = [];

    try {
        const groupPromise = fetch(`${process.env.REACT_PUBLIC_API_URL}/conversation/getConversationGroupByUserIDWeb`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('user_token')}` },
            body: JSON.stringify({ user_id: loggedInUser._id }),
        });
        const friendsPromise = fetch(`${process.env.REACT_PUBLIC_API_URL}/user/getFriends/${loggedInUser._id}`,{
            headers: { 'Authorization': `Bearer ${localStorage.getItem('user_token')}` }
        });
        const [groupResponse, friendsResponse] = await Promise.all([groupPromise, friendsPromise]);

        if (groupResponse.ok) {
            const groupData = await groupResponse.json();
            if (groupData.conversationGroup) {
                fetchedGroups = groupData.conversationGroup.map(group => ({
                    ...group,
                    type: 'group',
                    name: group.conversationName,
                    updatedAt: group.updatedAt || group.createdAt || new Date(0).toISOString(),
                }));
            }
        } else {
            console.error('Lỗi tải danh sách nhóm:', await groupResponse.text());
        }

        if (friendsResponse.ok) {
            const friendsData = await friendsResponse.json();
            if (friendsData && Array.isArray(friendsData)) {
                const conversationPromises = friendsData.map(async (friend) => {
                    console.log(`[ZaloPCLayout] Friend data from API for ${friend.userName}:`, JSON.stringify(friend)); 
                    try {
                        const convResponse = await fetch(`${process.env.REACT_PUBLIC_API_URL}/conversation/createConversationsWeb`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('user_token')}` },
                            body: JSON.stringify({
                                user_id: loggedInUser._id,
                                friend_id: friend._id,
                            }),
                        });
                        if (convResponse.ok) {
                            const convData = await convResponse.json();
                            if (convData.conversation) {
                                return {
                                    _id: convData.conversation._id,
                                    name: friend.userName,
                                    avatar: friend.avatar,
                                    type: 'user',
                                    members: convData.conversation.members,
                                    updatedAt: convData.conversation.updatedAt || convData.conversation.createdAt || new Date(0).toISOString(),
                                    isGroup: false,
                                    groupLeader: null,
                                    deputyLeaders: [],
                                    otherMemberInfo: { 
                                        _id: friend._id,
                                        userName: friend.userName,
                                        name: friend.userName,  
                                        avatar: friend.avatar,
                                        gender: friend.gender, 
                                        dateOfBirth: friend.dateOfBirth, // Đúng tên trường từ API (khớp model)
                                        phoneNumber: friend.phoneNumber, // Đúng tên trường từ API (khớp model)
                                        coverImage: friend.coverImage,   // Đúng tên trường từ API (khớp model)
                                        isOnline: friend.isOnline || false,
                                        
                                    }
                                    
                                };
                            }
                        }
                        return null;
                    } catch (e) { 
                        console.error("Lỗi khi tạo/lấy conversation cho bạn bè:", friend._id, e);
                        return null; 
                    }
                });
                fetchedFriendsAsConversations = (await Promise.all(conversationPromises)).filter(Boolean);
            }
        } else {
            console.error('Lỗi tải danh sách bạn bè:', await friendsResponse.text());
        }
        
        let combinedList = [...fetchedGroups, ...fetchedFriendsAsConversations];

        const lastMessagePromises = combinedList.map(conv =>
            fetch(`${process.env.REACT_PUBLIC_API_URL}/message/getLastMessageWeb`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('user_token')}` },
                body: JSON.stringify({
                    conversation_id: conv._id,
                    user_id: loggedInUser._id
                })
            })
            .then(res => {
                if (res.ok) return res.json();
                // Nếu API trả về lỗi, vẫn trả về một cấu trúc để Promise.all không bị reject hoàn toàn
                // và có thể gán giá trị mặc định cho tin nhắn cuối
                console.error(`Lỗi API getLastMessageWeb cho conv ${conv._id}: ${res.status}`);
                return { thongbao: `API Error ${res.status}`, retrievedLastMessage: null };
            })
            .catch(err => {
                console.error(`Lỗi fetch getLastMessageWeb cho conv ${conv._id}:`, err);
                return { thongbao: "Fetch Error", retrievedLastMessage: null };
            })
        );

        const lastMessagesAPIResponses = await Promise.all(lastMessagePromises);

        const enrichedList = combinedList.map((conv, index) => {
            const apiResponse = lastMessagesAPIResponses[index];
            // Lấy object lastMessage từ API, đảm bảo nó tồn tại và không phải null
            const lastMessageDetail = apiResponse?.retrievedLastMessage || null; 

            let finalLastMessageStringForSidebar = "";
            // Sử dụng timestamp của tin nhắn cuối cùng nếu có, nếu không thì dùng updatedAt của conversation
            let accurateTimestamp = lastMessageDetail?.createdAt || conv.updatedAt || new Date(0).toISOString();

            if (lastMessageDetail && lastMessageDetail.messageString) {
                // Sử dụng messageString đã được backend chuẩn bị (ví dụ: "Tên: Nội dung" hoặc "Bạn: Nội dung")
                finalLastMessageStringForSidebar = lastMessageDetail.messageString;

                // Logic bỏ tên người gửi cho chat 1-1 (nếu người kia nhắn)
                if (conv.type === 'user' && 
                    lastMessageDetail.sender && 
                    lastMessageDetail.sender._id && // Đảm bảo sender._id tồn tại
                    loggedInUser?._id && // Đảm bảo loggedInUser._id tồn tại
                    lastMessageDetail.sender._id.toString() !== loggedInUser._id.toString()) {
                    
                    // Nếu messageString từ backend là "Tên Người Gửi: Nội dung"
                    // và không phải là "Bạn: Nội dung", thì chỉ lấy phần nội dung.
                    const bạnPrefix = "Bạn: "; // Backend có thể trả về "Bạn : " (có khoảng trắng)
                    const potentialSenderPrefixPattern = /^(.+?):\s+/;

                    if (finalLastMessageStringForSidebar.startsWith(bạnPrefix) || finalLastMessageStringForSidebar.startsWith("Bạn : ")) {
                        // Giữ nguyên nếu là "Bạn: ..."
                    } else if (potentialSenderPrefixPattern.test(finalLastMessageStringForSidebar)) {
                        // Là "Tên Người Khác: Nội dung", lấy phần nội dung
                        finalLastMessageStringForSidebar = finalLastMessageStringForSidebar.substring(finalLastMessageStringForSidebar.indexOf(": ") + 2).trim();
                    }
                    // Nếu không khớp dạng nào, có thể là tin nhắn hệ thống hoặc nội dung không có prefix, giữ nguyên
                }
            } else {
                finalLastMessageStringForSidebar = conv.type === 'group' ? "Bắt đầu cuộc trò chuyện nhóm" : "Bắt đầu trò chuyện";
                // Nếu không có lastMessageDetail, accurateTimestamp đã là conv.updatedAt
            }
            
            return {
                ...conv,
                lastMessage: finalLastMessageStringForSidebar,
                lastMessageTimestamp: accurateTimestamp, // Timestamp chính xác của tin nhắn cuối cùng
                updatedAt: accurateTimestamp // Dùng timestamp này để sort
            };
        });

        enrichedList.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        setAllConversations(enrichedList);

    } catch (error) {
        console.error("Lỗi tổng thể khi tải cuộc trò chuyện:", error);
        setConversationsError('Lỗi kết nối, không thể tải danh sách.');
    } finally {
        setIsLoadingConversations(false);
    }
};

    useEffect(() => {
        if (loggedInUser?._id) {
            fetchAllUserConversations();
        }
    }, [loggedInUser]);

    useEffect(() => {
        if (socket) {
const handleReceiveMessage = (newMessageData) => {
    setAllConversations(prevConvs =>
        prevConvs.map(conv => {
            if (conv._id === newMessageData.conversation_id) {
                let displayContent = newMessageData.content; // Nội dung gốc
                if (newMessageData.contentType === 'image' || newMessageData.contentType === 'image_gallery') displayContent = '[Hình ảnh]';
                else if (newMessageData.contentType === 'video') displayContent = '[Video]';
                else if (newMessageData.contentType === 'file') displayContent = '[Tệp]';
                // Tin nhắn dạng text thì giữ nguyên displayContent là newMessageData.content

                let senderPrefix = "";
                let senderNameForDisplay = "Một ai đó"; // Tên mặc định

                if (newMessageData.senderId) {
                    const senderObject = newMessageData.senderId; // newMessageData.senderId nên là một object { _id, userName, ...}
                    
                    if (senderObject._id === loggedInUser?._id) {
                        senderPrefix = "Bạn: ";
                    } else {
                        senderNameForDisplay = senderObject.userName || "Một người bạn";
                        senderPrefix = `${senderNameForDisplay}: `;
                    }
                } else {
                     senderPrefix = "Hệ thống: "; // Hoặc một tên phù hợp cho tin nhắn không rõ người gửi
                }
                
                const formattedLastMessage = senderPrefix + displayContent;

                return {
                    ...conv,
                    lastMessage: formattedLastMessage, // Đã bao gồm người gửi và nội dung
                    lastMessageSenderName: senderNameForDisplay, // Giữ lại để có thể dùng cho mục đích khác nếu cần
                    lastMessageTimestamp: newMessageData.createdAt,
                    updatedAt: newMessageData.createdAt, // Quan trọng cho việc sắp xếp
                    unread: (selectedChat?._id !== newMessageData.conversation_id) ? (conv.unread || 0) + 1 : 0,
                };
            }
            return conv;
        }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    );
};


            const handleGroupMetadataUpdate = (data) => {
                setAllConversations(prevConvs =>
                    prevConvs.map(conv => {
                        if (conv._id === data.conversationId) {
                            return { 
                                ...conv, 
                                ...data.updatedData,
                                updatedAt: new Date().toISOString()
                            }; 
                        }
                        return conv;
                    }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                );

                if (selectedChat && selectedChat._id === data.conversationId) {
                    setSelectedChat(prevSelected => ({
                        ...prevSelected,
                        ...data.updatedData
                    }));
                }
            };

            const handleMemberLeft = (data) => {
                 setAllConversations(prevConvs =>
                     prevConvs.map(conv => {
                         if (conv._id === data.conversationId) {
                             const newMembers = Array.isArray(data.updatedMembers) ? data.updatedMembers : 
                                                 (conv.members || []).filter(m => (m._id || m) !== data.userId);
                             const newDeputies = Array.isArray(data.updatedDeputyLeaders) ? data.updatedDeputyLeaders :
                                                 (conv.deputyLeaders || []).filter(id => id !== data.userId);
                            return {
                                ...conv,
                                members: newMembers,
                                deputyLeaders: newDeputies,
                                updatedAt: new Date().toISOString()
                            };
                         }
                         return conv;
                     }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                 );
                 if (selectedChat && selectedChat._id === data.conversationId) {
                     setSelectedChat(prev => ({
                         ...prev,
                         members: Array.isArray(data.updatedMembers) ? data.updatedMembers : 
                                    (prev.members || []).filter(m => (m._id || m) !== data.userId),
                         deputyLeaders: Array.isArray(data.updatedDeputyLeaders) ? data.updatedDeputyLeaders :
                                    (prev.deputyLeaders || []).filter(id => id !== data.userId)
                     }));
                 }
            };

            const handleGroupDisbanded = (data) => {
                const disbandedConvName = allConversations.find(c => c._id === data.conversationId)?.name || "Một nhóm";
                setAllConversations(prevConvs =>
                    prevConvs.filter(conv => conv._id !== data.conversationId)
                );
                if (selectedChat && selectedChat._id === data.conversationId) {
                    setSelectedChat(null);
                    alert(`Nhóm "${disbandedConvName}" đã bị giải tán bởi ${data.disbandedBy?.name || 'trưởng nhóm'}.`);
                }
            };

            const handleGroupCreated = (data) => {
                const newGroup = {
                    ...data.conversation,
                    type: 'group',
                    name: data.conversation.conversationName,
                    updatedAt: data.conversation.updatedAt || data.conversation.createdAt || new Date().toISOString()
                };

                setAllConversations(prevConvs => {
                    if (prevConvs.some(c => c._id === newGroup._id)) {
                        return prevConvs.map(c => c._id === newGroup._id ? newGroup : c)
                                        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
                    }
                    return [newGroup, ...prevConvs]
                            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
                });
                if (data.conversation.groupLeader?._id === loggedInUser?._id || data.conversation.members?.some(m => (m._id || m) === loggedInUser?._id)) {
                    handleSelectChat(newGroup);
                }
            };
           
            socket.on('receive-message', handleReceiveMessage);
            socket.on('group-metadata-updated', handleGroupMetadataUpdate);
            socket.on('member-left', handleMemberLeft);
            socket.on('group-disbanded', handleGroupDisbanded);
            socket.on('group-created', handleGroupCreated);

            return () => {
                socket.off('receive-message', handleReceiveMessage);
                socket.off('group-metadata-updated', handleGroupMetadataUpdate);
                socket.off('member-left', handleMemberLeft);
                socket.off('group-disbanded', handleGroupDisbanded);
                socket.off('group-created', handleGroupCreated);
            };
        }
    }, [socket, loggedInUser, selectedChat, allConversations]);


    const handleSelectChat = (chatData) => {
        if (!chatData || !chatData._id) {
            console.error("handleSelectChat: Invalid chat data received", chatData);
            return;
        }
        const fullChatData = allConversations.find(c => c._id === chatData._id) || chatData;
    
        setAllConversations(prevConvs => 
            prevConvs.map(c => 
                c._id === fullChatData._id ? { ...c, unread: 0 } : c
            ).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        );
        setSelectedChat({...fullChatData, unread: 0 });
        setActiveView('chats');
    };
    

    const handleInitiateChatWithFriend = async (friend) => {
        if (!loggedInUser || !friend) return;
        try {
            const response = await fetch(`${process.env.REACT_PUBLIC_API_URL}/conversation/createConversationsWeb`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('user_token')}` },
                body: JSON.stringify({ user_id: loggedInUser._id, friend_id: friend._id }),
            });
            const data = await response.json();
            if (response.ok && data.conversation) {
                const preparedSelectedChat = {
                    _id: data.conversation._id,
                    name: friend.userName,
                    avatar: friend.avatar,
                    type: 'user',
                    isGroup: false,
                    members: data.conversation.members.map(m => typeof m === 'string' ? allConversations.flatMap(c => c.members).find(member => member._id === m) || { _id: m } : m),
                    updatedAt: data.conversation.updatedAt || data.conversation.createdAt || new Date().toISOString(),
                    
                };
                setAllConversations(prev => {
                    const existingIndex = prev.findIndex(c => c._id === preparedSelectedChat._id);
                    if (existingIndex > -1) {
                        const updated = [...prev];
                        updated[existingIndex] = { ...updated[existingIndex], ...preparedSelectedChat, updatedAt: new Date().toISOString() };
                        return updated.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
                    }
                    return [preparedSelectedChat, ...prev].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
                });
                handleSelectChat(preparedSelectedChat);
            } else {
                console.error('Không thể tạo/mở cuộc trò chuyện:', data.message || 'Lỗi không xác định');
            }
        } catch (error) {
            console.error('Lỗi kết nối khi tạo cuộc trò chuyện:', error);
        }
    };

    const closeAllModals = () => {
        setIsAccountInfoModalOpen(false);
        setIsSettingsModalOpen(false);
        setIsUpdateInfoModalOpen(false);
        setIsAddFriendModalOpen(false);
        setIsCreateGroupModalOpen(false);
    };

    const openAccountInfoModal = () => { closeAllModals(); setIsAccountInfoModalOpen(true); };
    const closeAccountInfoModal = () => setIsAccountInfoModalOpen(false);
    const openSettingsModal = () => { closeAllModals(); setIsSettingsModalOpen(true); };
    const closeSettingsModal = () => setIsSettingsModalOpen(false);
    const openUpdateInfoModal = () => { closeAllModals(); setIsUpdateInfoModalOpen(true); };
    const handleCloseUpdateModalAndReturnToAccountInfo = () => { closeAllModals(); setIsAccountInfoModalOpen(true); };
    const justCloseUpdateInfoModal = () => setIsUpdateInfoModalOpen(false);
    const openAddFriendModal = () => { closeAllModals(); setIsAddFriendModalOpen(true); };
    const closeAddFriendModal = () => setIsAddFriendModalOpen(false);
    const openCreateGroupModal = () => { closeAllModals(); setIsCreateGroupModalOpen(true); };
    const closeCreateGroupModal = () => setIsCreateGroupModalOpen(false);

    const handleProfileUpdate = (updatedData) => {
        setLoggedInUser(prevData => ({
            ...prevData,
            userName: updatedData.name,
            gender: updatedData.gender,
            dateOfBirth: updatedData.dob,
            avatar: updatedData.avatar || prevData.avatar
        }));
        localStorage.setItem('user', JSON.stringify({
            ...loggedInUser, 
            userName: updatedData.name,
            gender: updatedData.gender,
            dateOfBirth: updatedData.dob,
            avatar: updatedData.avatar || loggedInUser.avatar
        }));
        justCloseUpdateInfoModal();
        setIsAccountInfoModalOpen(true);
    };

    const handleGroupCreated = (newGroupDataFromAPI) => {
        const groupToAdd = { 
            ...newGroupDataFromAPI, 
            type: 'group', 
            name: newGroupDataFromAPI.conversationName, 
            updatedAt: newGroupDataFromAPI.updatedAt || newGroupDataFromAPI.createdAt || new Date().toISOString() 
        };
        setAllConversations(prevConversations => {
            const existingIndex = prevConversations.findIndex(conv => conv._id === groupToAdd._id);
            let updatedConversations;
            if (existingIndex !== -1) {
                updatedConversations = [...prevConversations];
                updatedConversations[existingIndex] = groupToAdd;
            } else {
                updatedConversations = [groupToAdd, ...prevConversations];
            }
            return updatedConversations.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        });
        handleSelectChat(groupToAdd);
        closeCreateGroupModal();
    };

    const handleConversationDeleted = (deletedConversationId) => {
        setAllConversations(prevConversations =>
            prevConversations.filter(conv => (conv._id || conv.id) !== deletedConversationId)
        );
        if (selectedChat && (selectedChat._id || selectedChat.id) === deletedConversationId) {
            setSelectedChat(null);
        }
    };
    
    const handleUserUpdated = (updatedUser) => {
        setLoggedInUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
    
        setAllConversations(prevConvs => 
            prevConvs.map(conv => {
                if (conv.type === 'user' && conv.members.some(m => (m._id || m) === updatedUser._id)) {
                    const otherUser = conv.members.find(m => (m._id || m) !== updatedUser._id);
                    return {
                        ...conv,
                        name: otherUser?._id === loggedInUser?._id ? updatedUser.userName : conv.name,
                        avatar: otherUser?._id === loggedInUser?._id ? updatedUser.avatar : conv.avatar,
                        members: conv.members.map(m => (m._id || m) === updatedUser._id ? updatedUser : m)
                    };
                }
                return conv;
            })
        );
    
        if (selectedChat && selectedChat.type === 'user' && selectedChat.members.some(m => (m._id || m) === updatedUser._id)) {
            setSelectedChat(prev => ({
                ...prev,
                name: prev.members.find(m => (m._id || m) !== updatedUser._id)?._id === loggedInUser?._id ? updatedUser.userName : prev.name,
                avatar: prev.members.find(m => (m._id || m) !== updatedUser._id)?._id === loggedInUser?._id ? updatedUser.avatar : prev.avatar,
                members: prev.members.map(m => (m._id || m) === updatedUser._id ? updatedUser : m)
            }));
        }
    };


    return (
        <div className="zalo-pc-layout">
            <Sidebar
                conversations={allConversations}
                isLoadingConversations={isLoadingConversations}
                conversationsError={conversationsError}
                onSelectChat={handleSelectChat}
                currentSelectedChatId={selectedChat ? (selectedChat._id || selectedChat.id) : null}
                onOpenAccountInfoModal={openAccountInfoModal}
                onOpenSettingsModal={openSettingsModal}
                onOpenAddFriendModal={openAddFriendModal}
                onOpenCreateGroupModal={openCreateGroupModal}
                activeView={activeView}
                setActiveView={setActiveView}
                activeContactsNavItem={activeContactsNavItem}
                setActiveContactsNavItem={setActiveContactsNavItem}
                onLogoutFromLayout={onLogout}
                currentLoggedInUserId={loggedInUser?._id}
                socket={socket}
                loggedInUserAvatar={loggedInUser?.avatar}
            />
            {activeView === 'chats' && (
                <MainContent
                    selectedChat={selectedChat}
                    currentLoggedInUserId={loggedInUser?._id}
                    onConversationDeleted={handleConversationDeleted}
                    allConversations={allConversations}
                    socket={socket}
                />
            )}
            {activeView === 'contacts' && (
                <ContactsMainView
                    subViewType={activeContactsNavItem}
                    currentLoggedInUserId={loggedInUser?._id}
                    onInitiateChatWithFriend={handleInitiateChatWithFriend}
                    fetchAllConversations={fetchAllUserConversations}
                />
            )}
            <AccountInfoModal
                isOpen={isAccountInfoModalOpen}
                onClose={closeAccountInfoModal}
                onOpenUpdateModal={openUpdateInfoModal}
                userData={loggedInUser}
                onUserUpdated={handleUserUpdated}
            />
            <SettingsModal isOpen={isSettingsModalOpen} onClose={closeSettingsModal} />
            <UpdateInfoModal
                isOpen={isUpdateInfoModalOpen}
                onClose={justCloseUpdateInfoModal}
                onReturnToAccountInfo={handleCloseUpdateModalAndReturnToAccountInfo}
                userData={loggedInUser}
                onUpdate={handleProfileUpdate}
            />
            <AddFriendModal
                isOpen={isAddFriendModalOpen}
                onClose={closeAddFriendModal}
                currentLoggedInUserId={loggedInUser?._id}
                onFriendRequestSent={fetchAllUserConversations}
            />
            <CreateGroupModal
                isOpen={isCreateGroupModalOpen}
                onClose={closeCreateGroupModal}
                currentLoggedInUserId={loggedInUser?._id}
                onGroupCreated={handleGroupCreated}
            />
        </div>
    );
}

export default ZaloPCLayout;
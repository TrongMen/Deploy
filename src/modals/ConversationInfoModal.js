import React, { useState, useMemo, useEffect, useRef } from "react";
import "../styles/ConversationInfoModal.css";
import {
    FaTimes, FaUserPlus, FaBellSlash, FaThumbtack, FaEyeSlash, FaTrashAlt, FaBan,
    FaPhotoVideo, FaFileAlt, FaLink, FaUsers, FaExclamationTriangle, FaUserEdit,
    FaSignOutAlt, FaUserCog, FaFilm, FaFolderOpen, FaArrowLeft, FaSearch,
    FaSpinner, FaPen, FaEllipsisV, FaDownload,
    FaFileWord, FaFileExcel, FaFilePowerpoint, FaFilePdf, FaFileArchive
} from "react-icons/fa";
import { FaUserPlus as FaUserPlusForAddMember } from "react-icons/fa";

import AddMembersModal from "./AddMembersModal";
import TargetAccountInfoModal from "./TargetAccountInfoModal";
import GroupDetailsModal from "./GroupDetailsModal";
import ConfirmationDialog from "./ConfirmationDialog";
import RenameGroupModal from "./RenameGroupModal";

async function fetchUsersByIds(userIds) {
    if (!Array.isArray(userIds) || userIds.length === 0) {
        return [];
    }
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/get-users-by-ids`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userIds }),
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error("Failed to fetch user details, Server responded with:", errorText);
            throw new Error("Failed to fetch user details: " + errorText);
        }
        const data = await response.json();
        return data.users || [];
    } catch (error) {
        console.error("Error in fetchUsersByIds:", error);
        return [];
    }
}

function ConversationInfoModal({ 
    isOpen, 
    onClose, 
    chatData, 
    currentUserId,
    onConversationDeleted 
}) {
    const [activeStorageTab, setActiveStorageTab] = useState("media");
    const [currentView, setCurrentView] = useState("info");
    const [searchTerm, setSearchTerm] = useState("");
    const [isAddMembersModalOpen, setIsAddMembersModalOpen] = useState(false);
    const [isTargetAccountInfoModalOpen, setIsTargetAccountInfoModalOpen] = useState(false);
    const [isGroupDetailsModalOpen, setIsGroupDetailsModalOpen] = useState(false);
    const [isLeaveGroupConfirmOpen, setIsLeaveGroupConfirmOpen] = useState(false);
    const [isLeavingGroup, setIsLeavingGroup] = useState(false);
    const [isDisbandGroupConfirmOpen, setIsDisbandGroupConfirmOpen] = useState(false);
    const [isHeaderRenameModalOpen, setIsHeaderRenameModalOpen] = useState(false);
    const [avatarLoadError, setAvatarLoadError] = useState(false);
    const [detailedMembers, setDetailedMembers] = useState([]);
    const [isLoadingMembers, setIsLoadingMembers] = useState(false);
    const [membersError, setMembersError] = useState("");
    const [memberMenuOpen, setMemberMenuOpen] = useState(null);
    const memberMenuRef = useRef(null);
    const [liveChatData, setLiveChatData] = useState(chatData);
    const [currentUserFriends, setCurrentUserFriends] = useState(new Set());
    const [isLoadingCurrentUserFriends, setIsLoadingCurrentUserFriends] = useState(false);
    const [isDisbanding, setIsDisbanding] = useState(false);

    const [fetchedImages, setFetchedImages] = useState([]);
    const [fetchedFilesAndVideos, setFetchedFilesAndVideos] = useState([]);
    const [isLoadingStorage, setIsLoadingStorage] = useState({ media: false, files: false });
    const [storageError, setStorageError] = useState({ media: '', files: '' });

    useEffect(() => {
        if (isOpen && currentUserId) {
            const fetchCurrentUserFriends = async () => {
                setIsLoadingCurrentUserFriends(true);
                try {
                    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/findUserByUserID`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ user_id: currentUserId })
                    });
                    if (response.ok) {
                        const data = await response.json();
                        if (data.user && data.user.friend) {
                            const friendIds = new Set(data.user.friend.map(f => f.friend_id.toString()));
                            setCurrentUserFriends(friendIds);
                        } else { setCurrentUserFriends(new Set());}
                    } else {
                        console.error("Lỗi khi lấy danh sách bạn bè của người dùng hiện tại.");
                        setCurrentUserFriends(new Set());
                    }
                } catch (error) {
                    console.error("Lỗi kết nối khi lấy danh sách bạn bè:", error);
                    setCurrentUserFriends(new Set());
                } finally {
                    setIsLoadingCurrentUserFriends(false);
                }
            };
            fetchCurrentUserFriends();
        } else if (!isOpen) {
            setCurrentUserFriends(new Set()); 
        }
    }, [isOpen, currentUserId]);

    useEffect(() => {
        if (isOpen) {
            setLiveChatData(chatData); 
            setAvatarLoadError(false); 
        }
    }, [isOpen, chatData]);

    const enrichedChatData = useMemo(() => {
    if (liveChatData && typeof liveChatData === 'object') {
        const isChatGroup = liveChatData.type === "group" || !!liveChatData.groupLeader;
        let generatedGroupLink;
        let targetSpecificDetails = {}; // Sẽ chứa thông tin riêng của nhóm hoặc người dùng

        if (isChatGroup) {
            // Xử lý cho group (phần này giữ nguyên logic cũ của bạn)
            if (liveChatData.groupLink) {
                generatedGroupLink = liveChatData.groupLink;
            } else {
                const idString = String(liveChatData._id || liveChatData.id || '');
                const slicedId = idString.slice(0, 8);
                generatedGroupLink = `https://zalo.me/g/${slicedId || "testgroup123"}`;
            }
            targetSpecificDetails = {
                groupLeader: liveChatData.groupLeader,
                deputyLeader: Array.isArray(liveChatData.deputyLeader) ? liveChatData.deputyLeader : [],
                memberCount: (Array.isArray(liveChatData.members) ? liveChatData.members.length : 0),
                groupLink: generatedGroupLink,
                adminId: liveChatData.groupLeader,
                deputyAdminIds: Array.isArray(liveChatData.deputyLeader) ? liveChatData.deputyLeader : [],
                coverPhotoUrl: liveChatData.coverPhotoUrl || `https://source.unsplash.com/random/400x150?sig=${liveChatData._id || liveChatData.id || "defaultCover"}`,
            };
        } else { // Chat 1-1
            // Lấy thông tin chi tiết của người dùng kia từ liveChatData.otherMemberInfo
            const otherUser = liveChatData.otherMemberInfo; // SỬ DỤNG otherMemberInfo TỪ ZaloPCLayout
            if (otherUser) { // Kiểm tra otherUser tồn tại
                targetSpecificDetails = {
                    _id: otherUser._id, // ID của người dùng kia
                    name: otherUser.name || otherUser.userName, // Tên người dùng kia
                    avatar: otherUser.avatar, // Avatar người dùng kia
                    gender: otherUser.gender,
                    dob: otherUser.dateOfBirth , // Ưu tiên dateOfBirth, fallback về dob
                    phone: otherUser.phoneNumber , // Ưu tiên phoneNumber
                    online: otherUser.online || false,
                    coverPhotoUrl: otherUser.coverImage ,
                    online: otherUser.isOnline || false,
                };
                
            } else {
                // Fallback nếu otherMemberInfo không có (dù không nên xảy ra nếu ZaloPCLayout đúng)
                targetSpecificDetails = {
                    name: liveChatData.name || "Người dùng",
                    avatar: liveChatData.avatar,
                    gender: "Chưa cập nhật",
                    dob: "Chưa cập nhật",
                    phone: "Chưa cập nhật",
                    online: false,
                    coverPhotoUrl: `https://source.unsplash.com/random/400x150?sig=${liveChatData._id || "defaultUserCover"}`,
                };
            }
        }
        
        const isAdmin = String(liveChatData.groupLeader) === String(currentUserId);
        const isDeputy = Array.isArray(liveChatData.deputyLeader) && liveChatData.deputyLeader.map(id => String(id)).includes(String(currentUserId));

        // Tạo object result cuối cùng
        const result = {
            // Các trường chung của cuộc trò chuyện (từ liveChatData)
            _id: liveChatData._id || liveChatData.id || '', // ID cuộc trò chuyện
            name: liveChatData.name || liveChatData.conversationName || "Không có tên", // Tên cuộc trò chuyện (cho Sidebar)
            avatar: liveChatData.avatar, // Avatar cuộc trò chuyện (cho Sidebar)
            type: isChatGroup ? 'group' : 'user',
            members: Array.isArray(liveChatData.members) ? liveChatData.members : [],
            conversationName: liveChatData.conversationName || liveChatData.name || "Không có tên",
            updatedAt: liveChatData.updatedAt,
            currentUserIsAdmin: isAdmin,
            currentUserIsDeputy: isDeputy,
            
            // Gộp thông tin chi tiết của target (nhóm hoặc người dùng)
            // Các trường này sẽ được TargetAccountInfoModal hoặc GroupDetailsModal sử dụng
            ...targetSpecificDetails 
        };

        // Đối với chat 1-1, đảm bảo `name` và `avatar` ở cấp cao nhất của `result`
        // là của người bạn đang chat cùng (để TargetAccountInfoModal hiển thị đúng)
        if (!isChatGroup && targetSpecificDetails.name) {
            result.name = targetSpecificDetails.name;
            result.avatar = targetSpecificDetails.avatar;
            // Nếu targetSpecificDetails có _id (là _id của user kia), thì gán nó cho một trường khác
            // để không ghi đè _id của cuộc trò chuyện.
            // TargetAccountInfoModal sẽ dùng result._id (là id của user kia), result.name, result.avatar
            result.targetUserId = targetSpecificDetails._id; // ID của người bạn chat
        }


        return result;
    }
    return null;
}, [liveChatData, currentUserId]);
    
    useEffect(() => {
        if (isOpen && enrichedChatData?._id) {
            const conversationId = enrichedChatData._id;
    
            const fetchAllMediaData = async () => {
                setIsLoadingStorage({ media: true, files: true });
                setStorageError({ media: '', files: '' });
                setFetchedImages([]);
                setFetchedFilesAndVideos([]);
    
                try {
                    const mediaResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/message/getAllMediaWeb`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ conversation_id: conversationId }),
                    });
                    const mediaData = await mediaResponse.json();
                    if (mediaResponse.ok && mediaData.media) {
                        setFetchedImages(mediaData.media);
                    } else {
                        setStorageError(prev => ({ ...prev, media: mediaData.thongbao || 'Lỗi tải ảnh' }));
                    }
                } catch (err) {
                    setStorageError(prev => ({ ...prev, media: 'Lỗi mạng khi tải ảnh' }));
                } finally {
                    setIsLoadingStorage(prev => ({ ...prev, media: false }));
                }
    
                try {
                    const filesResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/message/getAllFileWeb`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ conversation_id: conversationId }),
                    });
                    const filesData = await filesResponse.json();
                    if (filesResponse.ok && filesData.files) {
                        const processedFiles = filesData.files.map(f => {
                            const extension = f.fileName.split('.').pop().toLowerCase();
                            let type = 'file';
                            if (['mp4', 'mov', 'avi', 'webm', 'mkv', '3gp'].includes(extension)) {
                                type = 'video';
                            }
                            return { ...f, type, url: f.fileLink };
                        });
                        setFetchedFilesAndVideos(processedFiles);
                    } else {
                        setStorageError(prev => ({ ...prev, files: filesData.thongbao || 'Lỗi tải tệp/video' }));
                    }
                } catch (err) {
                    setStorageError(prev => ({ ...prev, files: 'Lỗi mạng khi tải tệp/video' }));
                } finally {
                    setIsLoadingStorage(prev => ({ ...prev, files: false }));
                }
            };
            
            fetchAllMediaData();
            
        } else if (!isOpen) {
            setFetchedImages([]);
            setFetchedFilesAndVideos([]);
            setStorageError({ media: '', files: '' });
            setIsLoadingStorage({ media: false, files: false });
            setCurrentView("info"); 
        }
    }, [isOpen, enrichedChatData?._id]);


    useEffect(() => {
        if (isOpen) {
            setCurrentView("info");
            setSearchTerm("");
            setMembersError("");
            setMemberMenuOpen(null);
        } else {
            setIsAddMembersModalOpen(false);
            setIsTargetAccountInfoModalOpen(false);
            setIsGroupDetailsModalOpen(false);
            setIsLeaveGroupConfirmOpen(false);
            setIsDisbandGroupConfirmOpen(false);
            setIsHeaderRenameModalOpen(false);
            setMemberMenuOpen(null);
        }
    }, [isOpen]);

    const fetchAndSetDetailedMembers = async (conversationDataToUse) => {
        if (conversationDataToUse && Array.isArray(conversationDataToUse.members) && conversationDataToUse.members.length > 0) {
            try {
                const memberDetails = await fetchUsersByIds(conversationDataToUse.members);
                if (!Array.isArray(memberDetails)) {
                    setDetailedMembers([]);
                    setMembersError("Lỗi định dạng dữ liệu thành viên chi tiết.");
                    return;
                }
                const membersWithRoles = memberDetails.map((member) => {
                    if (!member || typeof member._id === 'undefined') {
                        return { ...member, _id: String(Date.now() + Math.random()), userName: "Lỗi User", name: "Lỗi User", role: "Thành viên (Lỗi)" }; 
                    }
                    let role = "Thành viên";
                    if (conversationDataToUse.groupLeader && String(member._id) === String(conversationDataToUse.groupLeader)) {
                        role = "Trưởng nhóm";
                    } else if (Array.isArray(conversationDataToUse.deputyLeader) && conversationDataToUse.deputyLeader.map(id => String(id)).includes(String(member._id))) {
                        role = "Phó nhóm";
                    }
                    return { ...member, role };
                });
                setDetailedMembers(membersWithRoles);
            } catch (error) {
                setMembersError("Lỗi tải và xử lý chi tiết thành viên.");
                setDetailedMembers([]);
            }
        } else {
            setDetailedMembers([]);
        }
    };

    useEffect(() => {
        const doFetchDetailedMembers = async () => {
            if (enrichedChatData?._id) {
                setIsLoadingMembers(true);
                setMembersError("");
                setDetailedMembers([]); 
                try {
                    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/conversation/getMemberFromConversationIDWeb`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ conversation_id: enrichedChatData._id }),
                    });
                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({ message: `Lỗi ${response.status}` }));
                        throw new Error(errorData.message || `Lỗi ${response.status}`);
                    }
                    const memberListData = await response.json();
                    await fetchAndSetDetailedMembers({ ...enrichedChatData, members: Array.isArray(memberListData.members) ? memberListData.members : [] });
                } catch (error) {
                    setMembersError("Không thể tải danh sách thành viên. Vui lòng thử lại.");
                } finally {
                    setIsLoadingMembers(false);
                }
            }
        };
        if (isOpen && currentView === "memberList" && enrichedChatData?.type === "group") {
            doFetchDetailedMembers();
        }
    }, [isOpen, currentView, enrichedChatData]);

    const handleToggleMemberMenu = (memberId, event) => {
        event.stopPropagation();
        setMemberMenuOpen((prev) => (prev === memberId ? null : memberId));
    };

    const handleMemberMenuAction = async (action, memberId, memberName) => {
        setMemberMenuOpen(null);
        if (!enrichedChatData?._id || !currentUserId || !memberId) {
            alert("Thao tác thất bại, thiếu thông tin nhóm hoặc người dùng.");
            return;
        }
        let url = "";
        let payload = {
            conversation_id: enrichedChatData._id,
            user_id: currentUserId, 
            friend_id: memberId,     
        };
        let confirmationMessage = "";
        switch (action) {
            case "removeMember":
                confirmationMessage = `Bạn có chắc chắn muốn xóa ${memberName} khỏi nhóm?`;
                url = `${process.env.NEXT_PUBLIC_API_URL}/conversation/removeMemberFromConversationGroupWeb`;
                break;
            case "assignDeputy":
                confirmationMessage = `Bạn có muốn phân ${memberName} làm phó nhóm?`;
                url = `${process.env.NEXT_PUBLIC_API_URL}/conversation/authorizeDeputyLeaderWeb`;
                break;
            case "revokeDeputy":
                confirmationMessage = `Bạn có chắc chắn muốn gỡ quyền phó nhóm của ${memberName}?`;
                url = `${process.env.NEXT_PUBLIC_API_URL}/conversation/deleteDeputyLeaderWeb`;
                break;
            case "transferLeadership":
                confirmationMessage = `Bạn có chắc chắn muốn chuyển quyền trưởng nhóm cho ${memberName}? Hành động này không thể hoàn tác.`;
                url = `${process.env.NEXT_PUBLIC_API_URL}/conversation/authorizeGroupLeaderWeb`;
                break;
            default:
                alert(`Hành động "${action}" chưa được hỗ trợ.`);
                return;
        }
        if (confirmationMessage && !window.confirm(confirmationMessage)) {
            return;
        }
        setIsLoadingMembers(true); 
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await response.json();
            if (!response.ok) {
                alert(`Lỗi: ${data.message || 'Thao tác thất bại, vui lòng thử lại.'}`);
                setIsLoadingMembers(false); 
                return;
            }
            alert(data.message || "Thao tác thành công!");
            if (data.conversation) {
                setLiveChatData(prevData => ({ ...prevData, ...data.conversation, type: 'group' }));
                if (action === 'transferLeadership' && data.conversation.groupLeader === memberId) {
                    if (data.conversation.groupLeader !== currentUserId) { }
                }
            } else {
                if(currentView === "memberList" && enrichedChatData?._id) {
                    const tempEnrichedData = {...enrichedChatData}; 
                    setLiveChatData(tempEnrichedData); 
                   }
            }
        } catch (error) {
            alert(`Lỗi kết nối, không thể thực hiện hành động ${action}.`);
            setIsLoadingMembers(false); 
        } 
    };
    
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (memberMenuRef.current && !memberMenuRef.current.contains(event.target)) {
                if (!event.target.closest(".member-menu-dots-btn")) {
                    setMemberMenuOpen(null);
                }
            }
        };
        if (memberMenuOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [memberMenuOpen]);

    const currentMemberIdsInGroup = useMemo(() => {
        const idsFromChatData = liveChatData?.members?.map((m) => String(m.id || m._id || m)) || []; 
        return Array.from(new Set(idsFromChatData));
    }, [liveChatData?.members]);

    const SafeAvatar = ({ data }) => {
        const avatarUrlToUse = data?.avatar;
        const nameToUse = data?.name || data?.userName || "?";
        const [localAvatarLoadError, setLocalAvatarLoadError] = useState(false);
        useEffect(() => { setLocalAvatarLoadError(false); }, [avatarUrlToUse]);
        const isValidUrl = typeof avatarUrlToUse === "string" && (avatarUrlToUse.startsWith("http") || avatarUrlToUse.startsWith("data:image"));
        if (localAvatarLoadError || !isValidUrl) {
            const initials = (nameToUse || '?').split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() || (nameToUse || '?').charAt(0).toUpperCase();
            return <span>{initials}</span>;
        }
        return (<img src={avatarUrlToUse} alt={nameToUse} onError={() => setLocalAvatarLoadError(true)}/>);
    };

    const isGroup = enrichedChatData?.type === "group";
    const uniqueSendersPreview = useMemo(() => {
    if (isGroup && enrichedChatData?.messages && Array.isArray(enrichedChatData.messages)) {
        // Lấy thông tin người gửi từ mỗi tin nhắn, đảm bảo senderId có thật và không phải của người dùng hiện tại
        // Sau đó tạo một Set để chỉ lấy các tên duy nhất, rồi chuyển lại thành mảng và lấy 4 người đầu tiên.
        const senderNames = enrichedChatData.messages
            .filter(msg => msg.senderId && String(msg.senderId._id || msg.senderId) !== String(currentUserId))
            .map(msg => {
                // Giả sử senderId là một object chứa userName hoặc name
                // Nếu senderId chỉ là một ID, bạn sẽ cần fetch thông tin user ở đâu đó trước
                return msg.senderId?.userName || msg.senderId?.name || "Người lạ";
            });
        return Array.from(new Set(senderNames)).slice(0, 4);
    }
    return [];
}, [isGroup, enrichedChatData?.messages, currentUserId]);
    const mediaForTab = fetchedImages.map(url => ({ type: 'image', url, id: url }));
    const videosForTab = fetchedFilesAndVideos.filter(f => f.type === 'video').map(v => ({ ...v, id: v.fileLink }));
    const combinedMedia = [...mediaForTab, ...videosForTab];

    const filesForTab = fetchedFilesAndVideos.filter(f => f.type === 'file').map(f => ({ ...f, id: f.fileLink }));
    
    const linkMessages = useMemo(() => 
        (liveChatData?.messages || [])
        .filter(m => m.contentType === "text" && /https?:\/\/[^\s]+/.test(m.content))
        .map(m => ({...m, url: m.content.match(/https?:\/\/[^\s]+/)[0] })),
    [liveChatData?.messages]);


    const handleGroupNameUpdatedByModal = (newName, convId) => {
        setLiveChatData(prevData => {
            if (prevData && (prevData._id || prevData.id) === convId) {
                return { ...prevData, name: newName, conversationName: newName, type: 'group' };
            }
            return prevData;
        });
        setIsHeaderRenameModalOpen(false); 
    };

    const getMemberCountForDisplay = (chatToDisplay) => {
        if (detailedMembers.length > 0 && !isLoadingMembers && !membersError) {
            return detailedMembers.length;
        }
        if (chatToDisplay?.type === "group") return chatToDisplay.memberCount || 0;
        return 0;
    };
    const memberCountDisplay = getMemberCountForDisplay(enrichedChatData);

    const handleHeaderEntityClick = () => {
        if (isGroup) {
            setIsGroupDetailsModalOpen(true);
        } else {
            setIsTargetAccountInfoModalOpen(true);
        }
    };

    const handleOpenRenameModalFromHeader = (e) => {
        e.stopPropagation();
        if (isGroup && (enrichedChatData?.currentUserIsAdmin || enrichedChatData?.currentUserIsDeputy)) {
            setIsHeaderRenameModalOpen(true);
        }
    };

    const handleSendFriendRequest = async (targetMemberId) => {
        if (!currentUserId || !targetMemberId) {
            alert("Lỗi: Thiếu thông tin người dùng.");
            return;
        }
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/sendFriendRequestWeb`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: currentUserId, friend_id: targetMemberId })
            });
            const data = await response.json();
            if (response.ok) {
                alert(data.message || "Đã gửi lời mời kết bạn!");
            } else {
                alert(data.message || "Gửi lời mời thất bại.");
            }
        } catch (error) {
            alert("Lỗi kết nối khi gửi lời mời.");
        }
    };

    const handleAction = (action, data = null) => {
        if (!enrichedChatData) return;
        switch (action) {
            case "view_all_members": if (isGroup) setCurrentView("memberList"); break;
            case "request_add_member_view": case "add_member_to_group": if (isGroup) setIsAddMembersModalOpen(true); break;
            case "connect_friend": if (data) handleSendFriendRequest(data); break;
            case "leave_group":
                if (isGroup) {
                    if (enrichedChatData.currentUserIsAdmin) {
                        const otherMembersExist = enrichedChatData.members && enrichedChatData.members.filter(m => String(m.id || m._id || m) !== String(currentUserId)).length > 0;
                        if (otherMembersExist) {
                            alert("Bạn là trưởng nhóm. Vui lòng chuyển quyền trưởng nhóm cho một thành viên khác trước khi rời nhóm.");
                        } else { requestLeaveGroupConfirmation(); }
                    } else { requestLeaveGroupConfirmation(); }
                }
                break;
            case "toggle_notifications": console.log("Action: Tắt/Mở thông báo cho:", enrichedChatData.name, data); break;
            case "pin_conversation": console.log("Action: Ghim cuộc trò chuyện:", enrichedChatData.name, data); break;
            case "hide_conversation": console.log("Action: Ẩn cuộc trò chuyện:", enrichedChatData.name, data); break;
            case "manage_members_main": 
                if (isGroup && (enrichedChatData.currentUserIsAdmin || enrichedChatData.currentUserIsDeputy)) { setCurrentView("memberList");} 
                else if (isGroup) {alert("Bạn không có quyền quản lý thành viên nhóm này.");}
                break;
            case "group_settings": if (isGroup) setIsGroupDetailsModalOpen(true); break;
            case "delete_history": alert("Chức năng Xóa lịch sử trò chuyện sẽ được triển khai sau."); break;
            case "block_user": if (!isGroup) alert(`Chức năng Chặn ${enrichedChatData.name} sẽ được triển khai sau.`); break;
            case "create_group_with_user": if (!isGroup && enrichedChatData?._id) alert(`Chức năng Tạo nhóm với ${enrichedChatData.name} sẽ được triển khai sau.`); break;
            case "view_common_groups": if (!isGroup && enrichedChatData?._id) alert(`Chức năng Xem nhóm chung với ${enrichedChatData.name} sẽ được triển khai sau.`); break;
            default: console.log(`Hành động chưa được xử lý: ${action}`, data ? `với dữ liệu: ${JSON.stringify(data)}` : `cho cuộc trò chuyện ID: ${enrichedChatData?._id}, Tên: ${enrichedChatData?.name}`);
        }
    };

    const handleConfirmAddMembers = async (updatedConversationData) => {
        setIsAddMembersModalOpen(false); 
        if (updatedConversationData && updatedConversationData.members) {
            setLiveChatData(prevData => ({ ...prevData, ...updatedConversationData, type: 'group' }));
        } else {
            if(currentView === "memberList" && enrichedChatData?._id) { }
        }
    };
    
    const handleGroupAvatarUpdated = (updatedConversationData) => {
        setLiveChatData(prevData => ({ ...prevData, ...updatedConversationData, type: 'group' }));
    };

    const handleBackToInfo = () => {
        setCurrentView("info");
        setSearchTerm("");
        setMemberMenuOpen(null);
    };

    const handleManageMembersInGroupDetails = () => {
        setIsGroupDetailsModalOpen(false);
        setCurrentView("memberList");
        setSearchTerm("");
    };

    const requestLeaveGroupConfirmation = () => setIsLeaveGroupConfirmOpen(true);

    const executeLeaveGroup = async () => {
        if (!enrichedChatData?._id || !currentUserId) {
            alert("Lỗi: Thiếu thông tin để rời nhóm.");
            setIsLeaveGroupConfirmOpen(false);
            return;
        }
        setIsLeavingGroup(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/conversation/leaveGroupWeb`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conversation_id: enrichedChatData._id, user_id: currentUserId })
            });
            const data = await response.json();
            if (response.ok) {
                alert(data.message || "Rời nhóm thành công!");
                if (onConversationDeleted) { onConversationDeleted(enrichedChatData._id); }
                onClose(); 
            } else {
                alert(data.message || "Rời nhóm thất bại.");
            }
        } catch (error) {
            alert("Lỗi kết nối, không thể rời nhóm.");
        } finally {
            setIsLeavingGroup(false);
            setIsLeaveGroupConfirmOpen(false);
        }
    };

    const handleRenameGroupConfirmed = (newName, convId) => {
        setLiveChatData(prev => {
            if (prev && (prev._id || prev.id) === convId) {
                return {...prev, name: newName, conversationName: newName, type: 'group'};
            }
            return prev;
        });
    };

    const handleConfirmRenameFromHeader = (newName, convId) => {
        setLiveChatData(prev => {
            if (prev && (prev._id || prev.id) === convId) {
                return {...prev, name: newName, conversationName: newName, type: 'group'};
            }
            return prev;
        });
        setIsHeaderRenameModalOpen(false);
    };

    const requestDisbandGroupConfirmation = () => setIsDisbandGroupConfirmOpen(true);

    const executeDisbandGroup = async () => {
        if (!enrichedChatData?._id || !currentUserId) {
            alert("Lỗi: Thiếu thông tin để giải tán nhóm.");
            setIsDisbandGroupConfirmOpen(false);
            return;
        }
        if (!enrichedChatData.currentUserIsAdmin) {
            alert("Bạn không có quyền giải tán nhóm này.");
            setIsDisbandGroupConfirmOpen(false);
            return;
        }
        setIsDisbanding(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/conversation/disbandGroupWeb`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conversation_id: enrichedChatData._id, user_id: currentUserId })
            });
            const data = await response.json();
            if (response.ok) {
                alert(data.message || "Giải tán nhóm thành công!");
                if (onConversationDeleted) { onConversationDeleted(enrichedChatData._id); }
                onClose();
            } else {
                alert(data.message || "Giải tán nhóm thất bại.");
            }
        } catch (error) {
            alert("Lỗi kết nối, không thể giải tán nhóm.");
        } finally {
            setIsDisbanding(false);
            setIsDisbandGroupConfirmOpen(false);
        }
    };
    
   const renderStorageTabContent = () => {
    const displayLimit = 12; 
    const fileDisplayLimit = 10; 

    switch (activeStorageTab) {
        case "media":
            const videosFromFiles = fetchedFilesAndVideos.filter(f => f.type === 'video');
            // fetchedImages là mảng các URL ảnh
            // videosFromFiles là mảng các object video { fileName, fileLink, type, url }
            
            const allMediaItems = [
                ...fetchedImages.map(url => ({ type: 'image', url, id: url + '-img' })), // Thêm suffix để key có thể khác
                ...videosFromFiles.map(video => ({ type: 'video', ...video, id: video.fileLink + '-vid' }))
            ];

            const isLoadingCurrentTab = isLoadingStorage.media || isLoadingStorage.files; // Tab media phụ thuộc cả hai fetch
            const hasActualMediaError = storageError.media && storageError.media !== 'Không tìm thấy media nào trong cuộc trò chuyện này.';
            const hasActualVideoError = storageError.files && videosFromFiles.length === 0 && storageError.files !== 'Không tìm thấy file!!!';


            return (
                <div className="storage-tab-content media-grid">
                    {isLoadingCurrentTab && (
                        <div className="loading-placeholder"><FaSpinner className="spinner-icon"/> Đang tải...</div>
                    )}

                    {!isLoadingCurrentTab && allMediaItems.length === 0 && (
                        // Chỉ hiển thị lỗi/thông báo trống nếu không có item nào VÀ đã tải xong
                        hasActualMediaError ? <p className="error-message">Lỗi tải ảnh: {storageError.media}</p> :
                        hasActualVideoError ? <p className="error-message">Lỗi tải video: {storageError.files}</p> :
                        <p className="empty-tab-message">Chưa có ảnh/video nào được chia sẻ.</p>
                    )}
                    
                    {/* Hiển thị media items nếu có */}
                    {allMediaItems.length > 0 && allMediaItems.slice(0, displayLimit).map((item, index) => (
                        <div key={item.id || index} className="media-item-preview storage-media-item">
                            {item.type === 'image' ? (
                                <img src={item.url} alt={`Media ${index + 1}`} onError={(e) => e.target.style.display='none'} />
                            ) : ( // type === 'video'
                                <div className="video-placeholder">
                                    <FaFilm className="video-icon-overlay" />
                                    <span>{item.fileName || 'Video'}</span>
                                </div>
                            )}
                        </div>
                    ))}

                    {!isLoadingCurrentTab && allMediaItems.length > displayLimit && (
                        <button className="view-all-storage-btn" onClick={() => handleAction("view_all_media")}>
                            Xem tất cả ({allMediaItems.length})
                        </button>
                    )}
                </div>
            );

        case "files":
            const filesOnlyToDisplay = fetchedFilesAndVideos.filter(f => f.type === 'file');
            const isLoadingFilesTab = isLoadingStorage.files;
            // Kiểm tra xem có phải là lỗi thực sự hay chỉ là thông báo "Không tìm thấy file!!!"
            const hasActualFileError = storageError.files && storageError.files !== 'Không tìm thấy file!!!';

            return (
                <div className="storage-tab-content file-list">
                    {isLoadingFilesTab && <div className="loading-placeholder"><FaSpinner className="spinner-icon"/> Đang tải...</div>}
                    
                    {!isLoadingFilesTab && filesOnlyToDisplay.length === 0 && (
                        hasActualFileError ? <p className="error-message">{storageError.files}</p> :
                        <p className="empty-tab-message">Chưa có file nào được chia sẻ.</p>
                    )}

                    {filesOnlyToDisplay.length > 0 && filesOnlyToDisplay.slice(0, fileDisplayLimit).map((file, index) => {
                         const extension = file.fileName.split('.').pop().toLowerCase();
                         let fileIcon;
                         let iconClassName = "file-item-icon generic";
                         switch (extension) {
                             case 'doc': case 'docx': fileIcon = <FaFileWord />; iconClassName += " word"; break;
                             case 'xls': case 'xlsx': fileIcon = <FaFileExcel />; iconClassName += " excel"; break;
                             case 'ppt': case 'pptx': fileIcon = <FaFilePowerpoint />; iconClassName += " ppt"; break;
                             case 'pdf': fileIcon = <FaFilePdf />; iconClassName += " pdf"; break;
                             case 'zip': case 'rar': case '7z': fileIcon = <FaFileArchive />; iconClassName += " archive"; break;
                             default: fileIcon = <FaFileAlt />; break;
                         }
                        return (
                            <div key={file.fileLink || index} className="file-item-preview storage-file-item">
                                <span className={iconClassName}>{fileIcon}</span>
                                <div className="file-item-details">
                                    <span className="file-item-name" title={file.fileName}>{file.fileName}</span>
                                </div>
                                <a href={file.fileLink} target="_blank" rel="noopener noreferrer" download={file.fileName} className="download-icon-storage"><FaDownload /></a>
                            </div>
                        );
                    })}
                    {!isLoadingFilesTab && filesOnlyToDisplay.length > fileDisplayLimit && (
                        <button className="view-all-storage-btn" onClick={() => handleAction("view_all_files")}>
                            Xem tất cả ({filesOnlyToDisplay.length})
                        </button>
                    )}
                </div>
            );
        // ... (case "links" giữ nguyên như trước) ...
        case "links":
            // Giữ nguyên logic của tab "links"
            // Ví dụ:
            const currentLinkMessages = linkMessages; // linkMessages được tính từ useMemo
            return (
                <div className="storage-tab-content link-list">
                    {currentLinkMessages.length > 0 ? (
                        currentLinkMessages.slice(0, fileDisplayLimit).map((msg, index) => (
                            <div key={msg._id || index} className="link-item-preview storage-link-item">
                                <FaLink className="link-item-icon" />
                                <div className="link-item-details">
                                    <a href={msg.url} target="_blank" rel="noopener noreferrer" className="link-item-url" title={msg.url}>
                                        {msg.url}
                                    </a>
                                    {msg.senderId?.userName && <span className="link-item-sender">Gửi bởi: {msg.senderId.userName}</span>}
                                </div>
                            </div>
                        ))
                    ) : ( <p className="empty-tab-message">Chưa có link nào được chia sẻ.</p> )}
                    {currentLinkMessages.length > fileDisplayLimit && (
                        <button className="view-all-storage-btn" onClick={() => handleAction("view_all_links")}>
                            Xem tất cả ({currentLinkMessages.length})
                        </button>
                    )}
                </div>
            );
        default:
            return null;
    }
};

    const renderMemberListContent = () => {
        if (!isGroup) return null;
        const currentFilteredMembers = detailedMembers.filter((member) => (member?.userName || member?.name || "")?.toLowerCase().includes(searchTerm.toLowerCase()));
        return (
            <>
                <div className="conv-info-header member-list-header-override">
                    <button className="modal-back-btn-conv-info" onClick={handleBackToInfo} title="Quay lại"><FaArrowLeft /></button>
                    <h2>Thành viên ({isLoadingMembers ? <FaSpinner className="spinner-icon-inline"/> : currentFilteredMembers.length})</h2>
                </div>
                <div className="member-list-controls">
                    {(enrichedChatData?.currentUserIsAdmin || enrichedChatData?.currentUserIsDeputy) && (<button className="add-member-btn" onClick={() => handleAction("request_add_member_view")}><FaUserPlusForAddMember /> Thêm thành viên</button>)}
                    <div className="member-search-bar"><FaSearch className="search-icon" /><input type="text" placeholder="Tìm kiếm thành viên" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
                </div>
                <div className="member-list-scrollable">
                    {isLoadingMembers && (<div className="loading-message" style={{ textAlign: "center", padding: "20px" }}><FaSpinner className="spinner-icon" /> Đang tải...</div>)}
                    {membersError && (<div className="error-message" style={{ textAlign: "center", padding: "20px", color: "red" }}>{membersError}</div>)}
                    {!isLoadingMembers && !membersError && currentFilteredMembers.length > 0 ? currentFilteredMembers.map((member) => {
                        if (!member || typeof member._id === 'undefined') { return null; }
                        const memberName = member.userName || member.name || "Không rõ";
                        const memberAvatar = member.avatar;
                        const memberId = String(member._id); 
                        const currentDeputyIds = enrichedChatData?.deputyAdminIds?.map(id => String(id)) || [];
                        const isSelf = memberId === String(currentUserId);
                        const currentUserIsAdmin = enrichedChatData?.currentUserIsAdmin === true;
                        const currentUserIsDeputy = enrichedChatData?.currentUserIsDeputy === true;
                        const memberIsAdmin = memberId === String(enrichedChatData?.adminId);
                        const memberIsDeputy = currentDeputyIds.includes(memberId);
                        const isAlreadyFriend = currentUserFriends.has(memberId);
                        let showThreeDotMenu = false;
                        if (!isSelf) {
                            if (currentUserIsAdmin) { showThreeDotMenu = true; } 
                            else if (currentUserIsDeputy && !memberIsAdmin && !memberIsDeputy ) { showThreeDotMenu = true; }
                        }
                        return (
                            <div key={memberId} className="member-item">
                                <div className={`avatar member-avatar-item ${memberAvatar ? "" : "initial-avatar"}`}>{memberAvatar ? <img src={memberAvatar} alt={memberName} onError={(e) => e.target.style.display='none'} /> : memberName ? memberName.charAt(0).toUpperCase() : "?"}</div>
                                <div className="member-details"><span className="member-name">{memberName}</span>{member.role && member.role !== "Thành viên" && (<span className="member-role">{member.role}</span>)}</div>
                                {isSelf ? null : showThreeDotMenu ? (
                                    <div className="member-actions-menu-container" ref={memberMenuOpen === memberId ? memberMenuRef : null}>
                                        <button className="member-menu-dots-btn" onClick={(e) => handleToggleMemberMenu(memberId, e)}><FaEllipsisV /></button>
                                        {memberMenuOpen === memberId && (
                                        <div className="member-actions-dropdown">
                                            {currentUserIsAdmin && !memberIsAdmin && (<><button onClick={() => handleMemberMenuAction("assignDeputy",memberId,memberName)} disabled={memberIsDeputy}>Phân phó nhóm</button><button onClick={() => handleMemberMenuAction("revokeDeputy",memberId,memberName)} disabled={!memberIsDeputy}>Gỡ quyền phó nhóm</button><button onClick={() => handleMemberMenuAction("transferLeadership",memberId,memberName)}>Chuyển quyền trưởng nhóm</button></>)}
                                            {(currentUserIsAdmin && !memberIsAdmin) || (currentUserIsDeputy && !memberIsAdmin && !memberIsDeputy) ? (<button className="action-remove" onClick={() => handleMemberMenuAction("removeMember",memberId,memberName)}>Xóa thành viên</button>) : null}
                                        </div>)}
                                    </div>
                                ) : !isLoadingCurrentUserFriends && !isAlreadyFriend && !memberIsAdmin && !memberIsDeputy ? ( <button className="member-action-btn" onClick={() => handleAction("connect_friend", memberId)}>Kết bạn</button>
                                ) : isAlreadyFriend && !memberIsAdmin && !memberIsDeputy ? (<span className="friend-status-indicator">Bạn bè</span>) : null }
                            </div>);
                        }) : !isLoadingMembers && !membersError && ( <p className="empty-member-list-message">{searchTerm ? "Không tìm thấy thành viên nào." : "Chưa có thành viên nào trong nhóm."}</p>)}
                </div>
            </>
        );
    };
    
    const renderInfoContent = () => {
        return (
            <>
                <div className="conv-info-header">
                    <button className="modal-close-btn-conv-info" onClick={onClose} title="Đóng"><FaTimes /></button>
                    <div className={`avatar modal-avatar ${isGroup ? "group-avatar" : "user-avatar"} ${enrichedChatData?.online && !isGroup ? "online" : ""}`} onClick={handleHeaderEntityClick} style={{ cursor: "pointer" }}>
                        <SafeAvatar data={enrichedChatData} />
                        {enrichedChatData?.online && !isGroup && (<span className="online-indicator"></span>)}
                    </div>
                    <div className="conv-info-name-wrapper">
                        <h2 onClick={handleHeaderEntityClick} style={{ cursor: "pointer", display: "inline-block" }} title={isGroup ? "Xem thông tin nhóm" : "Xem thông tin tài khoản"}>{enrichedChatData?.name}</h2>
                        {isGroup && (enrichedChatData?.currentUserIsAdmin || enrichedChatData?.currentUserIsDeputy) && ( <FaPen className="conv-info-rename-group-icon" title="Đổi tên nhóm" onClick={handleOpenRenameModalFromHeader}/>)}
                    </div>
                    {isGroup && <p>{memberCountDisplay} thành viên</p>}
                    {!isGroup && (<p className={enrichedChatData?.online ? "status-online" : "status-offline"}>{enrichedChatData?.online ? "Đang hoạt động" : "Không hoạt động"}</p>)}
                </div>
                <div className="conv-info-actions-bar">
                    <button className="conv-action-item-bar" onClick={() => handleAction("toggle_notifications")}><FaBellSlash /> <span>Thông báo</span></button>
                    <button className="conv-action-item-bar" onClick={() => handleAction("pin_conversation")}><FaThumbtack /> <span>Ghim</span></button>
                    <button className="conv-action-item-bar" onClick={() => handleAction("hide_conversation")}><FaEyeSlash /> <span>Ẩn</span></button>
                    {isGroup && (enrichedChatData?.currentUserIsAdmin || enrichedChatData?.currentUserIsDeputy) && (<button className="conv-action-item-bar" onClick={() => handleAction("view_all_members")}><FaUserCog /> <span>Quản lý</span></button>)}
                </div>
                <div className="conv-info-body">
                    <div className="conv-info-section storage-section">
                        <div className="storage-tabs-nav">
                            <button className={`storage-tab-btn ${activeStorageTab === "media" ? "active" : ""}`} onClick={() => setActiveStorageTab("media")}><FaPhotoVideo /> Ảnh/Video ({fetchedImages.length + fetchedFilesAndVideos.filter(f=>f.type==='video').length})</button>
                            <button className={`storage-tab-btn ${activeStorageTab === "files" ? "active" : ""}`} onClick={() => setActiveStorageTab("files")}><FaFolderOpen /> File ({fetchedFilesAndVideos.filter(f=>f.type==='file').length})</button>
                            <button className={`storage-tab-btn ${activeStorageTab === "links" ? "active" : ""}`} onClick={() => setActiveStorageTab("links")}><FaLink /> Link ({linkMessages.length})</button>
                        </div>
                        {renderStorageTabContent()}
                    </div>
                    {isGroup && (
                    <div className="conv-info-section">
                        <h3>Thành viên ({memberCountDisplay})</h3>
                        <div className="member-list-preview">{detailedMembers.length > 0 ? detailedMembers.slice(0,4).map(member => (<div key={member._id} className="avatar member-avatar-small" title={member.userName || member.name}>{member.avatar ? <img src={member.avatar} alt={member.userName || member.name} onError={(e) => e.target.style.display='none'}/> : (member.userName || member.name || '?').charAt(0).toUpperCase()}</div>)) : uniqueSendersPreview.map((senderName, idx) => ( <div key={idx} className="avatar member-avatar-small" title={senderName}>{senderName.charAt(0).toUpperCase()}</div>))}</div>
                        <div className="conv-info-item" onClick={() => handleAction("view_all_members")}><FaUsers /> Xem danh sách thành viên</div>
                        {(enrichedChatData?.currentUserIsAdmin || enrichedChatData?.currentUserIsDeputy) &&(<div className="conv-info-item" onClick={() => handleAction("add_member_to_group")}><FaUserPlus /> Thêm thành viên</div>)}
                    </div>)}
                    {!isGroup && (
                    <div className="conv-info-section">
                        <h3>Tuỳ chọn</h3>
                        <div className="conv-info-item" onClick={() => handleAction("create_group_with_user")}><FaUserPlus /> Tạo nhóm với {enrichedChatData?.name}</div>
                        <div className="conv-info-item" onClick={() => handleAction("view_common_groups")}><FaUsers /> Xem nhóm chung</div>
                    </div>)}
                    <div className="conv-info-section conv-info-danger-zone">
                        <h3>Thiết lập bảo mật & khác</h3>
                        {isGroup && (<div className="conv-info-item" onClick={() => handleAction("group_settings")}><FaUserEdit /> Tuỳ chỉnh nhóm</div>)}
                        <div className="conv-info-item danger" onClick={() => handleAction("delete_history")}><FaTrashAlt /> Xóa lịch sử trò chuyện</div>
                        {!isGroup && (<div className="conv-info-item danger" onClick={() => handleAction("block_user")}><FaBan /> Chặn {enrichedChatData?.name}</div>)}
                        {isGroup && (<div className="conv-info-item danger" onClick={() => handleAction("leave_group")}><FaSignOutAlt /> Rời nhóm</div>)}
                        {isGroup && enrichedChatData?.currentUserIsAdmin && (<div className="conv-info-item danger" onClick={requestDisbandGroupConfirmation}><FaTrashAlt /> Giải tán nhóm</div>)}
                    </div>
                </div>
            </>
        );
    };

    if (!isOpen || !enrichedChatData) {
        return null;
    }

    return (
        <>
            <div className={`modal-overlay-conv-info ${isOpen ? "active" : ""}`} onClick={currentView === "info" ? onClose : undefined} >
                <div className="modal-content-conv-info" onClick={(e) => e.stopPropagation()}>
                    {currentView === "info" ? renderInfoContent() : renderMemberListContent()}
                </div>
            </div>
            <AddMembersModal isOpen={isAddMembersModalOpen} onClose={() => setIsAddMembersModalOpen(false)} onConfirm={handleConfirmAddMembers} currentGroupMemberIds={currentMemberIdsInGroup} conversationId={enrichedChatData?._id} currentUserId={currentUserId}/>
            <TargetAccountInfoModal isOpen={isTargetAccountInfoModalOpen} onClose={() => setIsTargetAccountInfoModalOpen(false)} userData={enrichedChatData} currentUserId={currentUserId} onSendFriendRequest={handleSendFriendRequest} currentUserFriends={currentUserFriends}/>
            {isGroup && <GroupDetailsModal isOpen={isGroupDetailsModalOpen} onClose={() => setIsGroupDetailsModalOpen(false)} groupData={enrichedChatData} onManageMembers={handleManageMembersInGroupDetails} onLeaveGroup={requestLeaveGroupConfirmation} onRenameGroup={handleRenameGroupConfirmed} onDisbandGroup={requestDisbandGroupConfirmation} currentUserIsAdmin={enrichedChatData?.currentUserIsAdmin} currentUserId={currentUserId} onUpdateGroupAvatar={handleGroupAvatarUpdated}/>}
            {isGroup && <RenameGroupModal isOpen={isHeaderRenameModalOpen} onClose={() => setIsHeaderRenameModalOpen(false)} onConfirmRename={handleConfirmRenameFromHeader} currentGroupName={enrichedChatData?.name} groupMembers={enrichedChatData?.members || []} conversationId={enrichedChatData?._id} currentUserId={currentUserId} />}
            <ConfirmationDialog isOpen={isLeaveGroupConfirmOpen} onClose={() => setIsLeaveGroupConfirmOpen(false)} onConfirm={executeLeaveGroup} title="Rời khỏi nhóm?" message={`Bạn có chắc chắn muốn rời khỏi nhóm "${enrichedChatData?.name || "này"}" không? Bạn sẽ không thể xem lại tin nhắn trong nhóm này nữa.`} confirmText="Rời nhóm" cancelText="Hủy"/>
            <ConfirmationDialog isOpen={isDisbandGroupConfirmOpen} onClose={() => setIsDisbandGroupConfirmOpen(false)} onConfirm={executeDisbandGroup} title="Giải tán nhóm?" message={`Bạn có chắc chắn muốn giải tán nhóm "${enrichedChatData?.name || "này"}" không? Hành động này không thể hoàn tác và toàn bộ lịch sử trò chuyện sẽ bị xóa.`} confirmText={isDisbanding ? <FaSpinner className="spinner-icon-inline" /> : "Giải tán"} cancelText="Hủy" isConfirmDisabled={isDisbanding}/>
        </>
    );
}

export default ConversationInfoModal;
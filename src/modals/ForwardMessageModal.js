// src/modals/ForwardMessageModal.js
import React, { useState, useEffect, useMemo } from 'react';
import '../styles/ForwardMessageModal.css'; // Đảm bảo file CSS này tồn tại và đúng đường dẫn
import { FaSearch, FaTimes, FaPaperPlane } from 'react-icons/fa';

// Hàm renderForwardPreviewContent (giữ nguyên như của bạn)
const renderForwardPreviewContent = (message) => {
    if (!message) return <p>Không có tin nhắn để hiển thị.</p>;
    if (message.recalled) return <p><i>Tin nhắn đã được thu hồi</i></p>;
    const contentType = message.contentType || message.type;
    let content = message.content || message.text;
    switch (contentType) {
        case 'text':
            return <p className="forward-preview-text">{String(content).substring(0,150)}{String(content).length > 150 ? "..." : ""}</p>;
        case 'image':
            return <img src={message.imageUrl || content} alt="Ảnh xem trước" className="forward-preview-image" />;
        case 'image_gallery':
            if (Array.isArray(content) && content.length > 0) {
                return <img src={content[0]} alt="Ảnh gallery xem trước" className="forward-preview-image" />;
            }
            return <p className="forward-preview-text">[Gallery Ảnh]</p>;
        case 'file':
            const fileName = typeof content === 'string' ? content.split('/').pop() : (message.fileName || "Tệp đính kèm");
            return <p className="forward-preview-text">[Tệp: {fileName}]</p>;
        case 'video':
            return <p className="forward-preview-text">[Video]</p>;
        default:
            return <p className="forward-preview-text">[{contentType || 'Tin nhắn đa phương tiện'}]</p>;
    }
};

function ForwardMessageModal({ isOpen, onClose, onConfirm, currentUserId, messageToForward, allConversations }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedConversationId, setSelectedConversationId] = useState(null);
    // KHÔNG CẦN STATE CHO additionalMessage NỮA
    // const [additionalMessage, setAdditionalMessage] = useState(''); 

    useEffect(() => {
        if (isOpen) {
            setSearchTerm('');
            setSelectedConversationId(null);
            // KHÔNG CẦN RESET additionalMessage NỮA
            // setAdditionalMessage(''); 
        }
    }, [isOpen]);

    const filteredConversations = useMemo(() => {
        if (!allConversations) return [];
        return allConversations.filter(conv => 
            (conv.name || conv.conversationName || '').toLowerCase().includes(searchTerm.toLowerCase()) &&
            (conv._id || conv.id) !== (messageToForward?.conversation_id)
        );
    }, [allConversations, searchTerm, messageToForward?.conversation_id]);

    const handleSelectConversation = (convId) => {
        setSelectedConversationId(prevId => prevId === convId ? null : convId);
    };

    const handleConfirm = () => {
        if (selectedConversationId) {
            // *** THAY ĐỔI Ở ĐÂY ***
            // Chỉ truyền mảng chứa ID cuộc trò chuyện, không truyền tin nhắn gửi kèm
            onConfirm([selectedConversationId], null); // Hoặc onConfirm([selectedConversationId]) nếu hàm cha xử lý được việc thiếu tham số thứ 2
        } else {
            alert("Vui lòng chọn một cuộc trò chuyện để chuyển tiếp.");
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="modal-overlay forward-modal-overlay">
            <div className="modal-content forward-modal-content">
                <div className="forward-modal-header">
                    <h3>Chuyển tiếp tin nhắn</h3>
                    <button onClick={onClose} className="modal-close-btn"><FaTimes /></button>
                </div>

                {messageToForward && (
                    <div className="forward-preview-section">
                        <h4>Tin nhắn gốc:</h4>
                        <div className="forward-preview-bubble">
                            {renderForwardPreviewContent(messageToForward)}
                        </div>
                    </div>
                )}

                {/* KHÔNG CẦN Ô NHẬP TIN NHẮN GỬI KÈM NỮA
                <div className="forward-additional-message">
                    <textarea
                        placeholder="Nhập tin nhắn gửi kèm (tùy chọn)..."
                        value={additionalMessage}
                        onChange={(e) => setAdditionalMessage(e.target.value)}
                        rows="2"
                    />
                </div>
                */}

                <div className="forward-search-bar">
                    <FaSearch />
                    <input 
                        type="text" 
                        placeholder="Tìm kiếm người nhận hoặc nhóm..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="forward-conversation-list">
                    {filteredConversations.length > 0 ? (
                        filteredConversations.map(conv => (
                            <div 
                                key={conv._id || conv.id} 
                                className={`forward-conversation-item ${selectedConversationId === (conv._id || conv.id) ? 'selected' : ''}`}
                                onClick={() => handleSelectConversation(conv._id || conv.id)}
                            >
                                <div className={`avatar forward-conv-avatar ${conv.type === 'group' ? 'group-avatar' : 'user-avatar'}`}>
                                    {conv.avatar ? <img src={conv.avatar} alt={conv.name || conv.conversationName} /> : (conv.name || conv.conversationName || '?').substring(0,2).toUpperCase()}
                                </div>
                                <span className="forward-conv-name">{conv.name || conv.conversationName}</span>
                                <input 
                                    type="radio" 
                                    name="targetConversation" 
                                    value={conv._id || conv.id}
                                    checked={selectedConversationId === (conv._id || conv.id)}
                                    onChange={() => handleSelectConversation(conv._id || conv.id)}
                                    className="forward-conv-radio"
                                />
                            </div>
                        ))
                    ) : (
                        <p className="no-results-forward">Không tìm thấy cuộc trò chuyện phù hợp.</p>
                    )}
                </div>

                <div className="forward-modal-actions">
                    <button onClick={onClose} className="btn-cancel-forward">Hủy</button>
                    <button onClick={handleConfirm} className="btn-confirm-forward" disabled={!selectedConversationId}>
                        <FaPaperPlane /> Gửi
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ForwardMessageModal;
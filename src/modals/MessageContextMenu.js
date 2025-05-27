// Menu tin nhắn, thu hồi tin nhắn, xóa tin nhắn, trả lời tin nhắn, chuyển tiếp tin nhắn


import React from 'react';
import '../styles/MessageContextMenu.css';

const MessageContextMenu = React.forwardRef(
  ({ message, position, onClose, onRecall, onDeleteForMe, onReply, onForward, currentLoggedInUserId }, ref) => {
    if (!message) return null;

    const isMyMessage =
      (typeof message.senderId === 'object' ? message.senderId._id : message.senderId) === currentLoggedInUserId;

    const handleAction = (action) => {
      action();
      onClose();
    };

    return (
      <div
        ref={ref}
        className="message-context-menu"
        style={{ top: `${position.y}px`, left: `${position.x}px` }}
        onClick={(e) => e.stopPropagation()}
      >
        <ul className="context-menu-list">
          {isMyMessage && (
            <li className="context-menu-item" onClick={() => handleAction(onRecall)}>
              Thu hồi tin nhắn
            </li>
          )}
          <li className="context-menu-item" onClick={() => handleAction(onDeleteForMe)}>
            Xóa ở phía tôi
          </li>
          <li className="context-menu-item" onClick={() => handleAction(onReply)}>
            Trả lời
          </li>
          <li className="context-menu-item" onClick={() => handleAction(onForward)}>
            Chuyển tiếp
          </li>
        </ul>
      </div>
    );
  }
);
export default MessageContextMenu;
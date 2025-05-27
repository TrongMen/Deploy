import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import "../styles/AccountInfoModal.css";

const AccountInfoModal = ({ isOpen, onClose, onOpenUpdateModal }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const stored = localStorage.getItem("user");
      if (!stored) return;

      const storedUser = JSON.parse(stored);

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/findUserByUserID`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ user_id: storedUser._id }),
        });

        const data = await res.json();
        
        const userFromServer = data.user;
        if (userFromServer && userFromServer.coverImage) {
          userFromServer.coverPhoto = userFromServer.coverImage;
        }
        
        setUser(userFromServer);

      } catch (err) {
        console.error("Lỗi lấy user:", err);
      }
    };

    if (isOpen) {
      fetchUser();
    }
  }, [isOpen]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !user?._id) return;

    const formData = new FormData();
    formData.append("user_id", user._id);
    formData.append("image", file);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/user/changeImageAvatarWeb`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();
      if (data.avatarURL) {
        alert("Cập nhật avatar thành công!");
        const updatedUser = { ...user, avatar: data.avatarURL };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }
    } catch (err) {
      console.error("Lỗi cập nhật avatar:", err);
      alert("Lỗi khi tải ảnh lên!");
    }
  };

  const handleCoverPhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !user?._id) return;

    const formData = new FormData();
    formData.append("user_id", user._id);
    formData.append("image", file);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/user/changeImageCoverAvatarWeb`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();
      if (data.coverPhotoURL) {
        alert("Cập nhật ảnh bìa thành công!");
        const updatedUser = { ...user, coverPhoto: data.coverPhotoURL };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }
    } catch (err) {
      console.error("Lỗi cập nhật ảnh bìa:", err);
      alert("Lỗi khi tải ảnh lên!");
    }
  };

  if (!isOpen || !user) return null;

  const genderDisplay =
    user.gender === "male" ? "Nam" : user.gender === "female" ? "Nữ" : "";

  return ReactDOM.createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content account-info-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Thông tin tài khoản</h2>
          <button className="modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="account-profile-header">
            <div className="cover-photo">
              <img
                src={
                  user.coverPhoto ||
                  "https://iuh.edu.vn/wp-content/uploads/2020/06/2-1024x576.jpg"
                }
                alt="Ảnh bìa"
              />
              <input
                type="file"
                accept="image/*"
                id="coverPhotoUpload"
                style={{ display: "none" }}
                onChange={handleCoverPhotoChange}
              />
              <label
                htmlFor="coverPhotoUpload"
                className="change-cover-photo-btn"
              >
                📷 Cập nhật ảnh bìa
              </label>
            </div>
            <div className="avatar-section-modal">
              <div className="profile-avatar-wrapper-modal">
                <img
                  src={
                    user.avatar || "https://via.placeholder.com/100x100?text=?"
                  }
                  alt="Avatar"
                  className="profile-avatar-modal"
                />
                <input
                  type="file"
                  accept="image/*"
                  id="avatarUpload"
                  style={{ display: "none" }}
                  onChange={handleAvatarChange}
                />
                <label
                  htmlFor="avatarUpload"
                  className="change-avatar-btn-modal"
                >
                  📷
                </label>
              </div>
            </div>
            <div className="profile-name-section-modal">
              <span className="profile-name-modal">{user.userName}</span>
              <button
                className="edit-name-btn-modal"
                onClick={onOpenUpdateModal}
              >
                ✏️
              </button>
            </div>
          </div>

          <div className="account-personal-info">
            <h4>Thông tin cá nhân</h4>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Giới tính: </span>
                <span className="info-value">{genderDisplay}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Ngày sinh: </span>
                <span className="info-value">{user.dateOfBirth}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Điện thoại: </span>
                <span className="info-value sensitive-info">
                  {user.phoneNumber}
                </span>
              </div>
            </div>
            <p className="phone-privacy-note">
              Chỉ bạn bè có lưu số của bạn trong danh bạ máy xem được số này
            </p>
          </div>
        </div>

        <div className="modal-footer">
          <button className="update-profile-btn" onClick={onOpenUpdateModal}>
            Cập nhật
          </button>
        </div>
      </div>
    </div>,
    document.getElementById("modal-root")
  );
};

export default AccountInfoModal;
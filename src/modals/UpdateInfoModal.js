// File: UpdateInfoModal.js

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import '../styles/UpdateInfoModal.css';

const UpdateInfoModal = ({ isOpen, onClose, userData, onUpdate }) => { // Thêm onUpdate prop
  const [displayName, setDisplayName] = useState('');
  const [gender, setGender] = useState(''); // Sẽ lưu 'Nam' hoặc 'Nữ' cho UI
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');

  // Sửa hàm này để kiểm tra kiểu string trước khi toLowerCase()
  const mapGenderToUI = (serverGenderValue) => {
    if (typeof serverGenderValue === 'string') { // Chỉ xử lý nếu là string
      const lowerValue = serverGenderValue.toLowerCase();
      if (lowerValue === 'male') return 'Nam';
      if (lowerValue === 'female') return 'Nữ';
      // Nếu là string khác, hoặc đã là "Nam"/"Nữ" (trường hợp người dùng chọn lại)
      if (lowerValue === 'nam' || lowerValue === 'nữ') return serverGenderValue.charAt(0).toUpperCase() + serverGenderValue.slice(1).toLowerCase();
      return ''; // Hoặc giá trị mặc định khác nếu serverGenderValue không hợp lệ
    }
    return ''; // Trả về rỗng nếu không phải string hoặc null/undefined
  };

  const mapGenderToServer = (uiGenderValue) => {
    if (!uiGenderValue) return '';
    return uiGenderValue === 'Nam' ? 'male' : uiGenderValue === 'Nữ' ? 'female' : '';
  };

  // useEffect này để khởi tạo state từ userData prop khi modal mở hoặc userData thay đổi
  useEffect(() => {
    if (isOpen && userData) {
      setDisplayName(userData.userName || '');
      setGender(mapGenderToUI(userData.gender)); // userData.gender từ server nên là 'male'/'female'
      
      // Xử lý dateOfBirth từ userData nếu nó là chuỗi "dd/mm/yyyy"
      if (userData.dateOfBirth && typeof userData.dateOfBirth === 'string') {
        const [d, m, y] = userData.dateOfBirth.split('/');
        setDay(d || '01');
        setMonth(m || '01');
        setYear(y || '2000');
      } else if (userData.dateOfBirth && typeof userData.dateOfBirth === 'object') {
        // Nếu dateOfBirth là object { day, month, year } (ít khả năng từ server)
        setDay(userData.dateOfBirth.day || '01');
        setMonth(userData.dateOfBirth.month || '01');
        setYear(userData.dateOfBirth.year || '2000');
      } else {
        // Fallback nếu dateOfBirth không có hoặc không đúng định dạng
        setDay('01');
        setMonth('01');
        setYear('2000');
      }
    }
  }, [isOpen, userData]);

  // Bỏ useEffect thứ hai và thứ ba liên quan đến localStorage và fetchUser trực tiếp khi isOpen.
  // Dữ liệu nên được truyền qua props userData là chính.
  // Nếu cần fetch lại, nên có một cơ chế rõ ràng hơn thay vì fetch mỗi khi modal mở.

  if (!isOpen) return null;

  const days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
  const months = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => String(currentYear - i));

  const handleSubmit = async () => {
    if (!userData?._id) {
        alert('Không tìm thấy thông tin người dùng để cập nhật.');
        return;
    }
    try {
      const formattedDOB = `${day}/${month}/${year}`;
      const genderServerValue = mapGenderToServer(gender); // Chuyển 'Nam'/'Nữ' về 'male'/'female'

      const response = await fetch(`${process.env.REACT_PUBLIC_API_URL}/user/updateUserWeb`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('user_token')}` // Thêm token nếu API yêu cầu
        },
        body: JSON.stringify({
          user_id: userData._id, // Nên dùng _id từ userData prop
          userName: displayName,
          gender: genderServerValue,
          dateOfBirth: formattedDOB,
          // Không gửi avatar ở đây trừ khi bạn có input cho nó
        }),
      });

      const data = await response.json();
      if (response.ok && data.user) { // Kiểm tra response.ok và sự tồn tại của data.user
        alert('Cập nhật thông tin thành công!');
        localStorage.setItem('user', JSON.stringify(data.user)); // Cập nhật localStorage
        if (onUpdate) { // Gọi callback onUpdate từ ZaloPCLayout
            onUpdate(data.user);
        }
        onClose(); // Đóng modal
      } else {
        alert(data.message || 'Cập nhật thất bại!');
      }
    } catch (err) {
      console.error('Lỗi khi cập nhật thông tin:', err);
      alert('Lỗi kết nối server!');
    }
  };

  const modalContent = (
    <div className="update-modal-overlay" onClick={onClose}>
      <div className="update-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="update-modal-header">
          <button className="update-modal-back-btn" onClick={onClose}>
            &#x2190;
          </button>
          <h2>Cập nhật thông tin cá nhân</h2>
          <button className="update-modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="update-modal-body">
          <div className="form-group">
            <label htmlFor="displayName">Tên hiển thị</label>
            <input
              type="text"
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Giới tính</label>
            <div className="gender-options">
              <label htmlFor="maleRadio"> {/* Thay đổi id để không trùng với value */}
                <input
                  type="radio"
                  id="maleRadio"
                  name="gender"
                  value="Nam"
                  checked={gender === 'Nam'}
                  onChange={(e) => setGender(e.target.value)}
                />
                Nam
              </label>
              <label htmlFor="femaleRadio"> {/* Thay đổi id */}
                <input
                  type="radio"
                  id="femaleRadio"
                  name="gender"
                  value="Nữ"
                  checked={gender === 'Nữ'}
                  onChange={(e) => setGender(e.target.value)}
                />
                Nữ
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>Ngày sinh</label>
            <div className="dob-selects">
              <select value={day} onChange={(e) => setDay(e.target.value)}>
                {days.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              <select value={month} onChange={(e) => setMonth(e.target.value)}>
                {months.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <select value={year} onChange={(e) => setYear(e.target.value)}>
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="update-modal-footer">
          <button className="cancel-btn" onClick={onClose}>Hủy</button>
          <button className="submit-btn" onClick={handleSubmit}>Cập nhật</button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.getElementById('modal-root'));
};

export default UpdateInfoModal;
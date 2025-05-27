import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/ForgotPassword.css'; // Import CSS mới
import { FaPhoneAlt } from 'react-icons/fa';

function ForgotPassword() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!phoneNumber.trim()) {
      setError('Vui lòng nhập số điện thoại của bạn.');
      return;
    }

    const phoneDigits = phoneNumber.replace(/\D/g, '');
    if (phoneDigits.length < 9 || phoneDigits.length > 10) {
      setError('Số điện thoại không hợp lệ. Vui lòng kiểm tra lại.');
      return;
    }

    const formattedPhone = phoneDigits.startsWith('0')
      ? `+84${phoneDigits.slice(1)}`
      : `+84${phoneDigits}`;

    setIsLoading(true);

    try {
      const response = await fetch(`${process.env.REACT_PUBLIC_API_URL}/account/forgot-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: formattedPhone,
          passwordnew: '123456', // mật khẩu mới mặc định hoặc sẽ cập nhật ở bước tiếp theo
        }),
      });

      const data = await response.json();
      setIsLoading(false);

      if (data.message === 'Mật khẩu đã được thay đổi thành công!!! ') {
        alert('Đổi mật khẩu thành công. Vui lòng đăng nhập lại với mật khẩu mới! Mật khẩu mới là: 123456');
        navigate('/login');
      } else {
        alert(data.message || 'Có lỗi xảy ra khi đặt lại mật khẩu.');
      }
    } catch (err) {
      console.error('Lỗi khi gửi yêu cầu đặt lại mật khẩu:', err);
      alert('Lỗi kết nối đến máy chủ!');
      setIsLoading(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <header className="zalo-header">
        <h1>Zalo</h1>
      </header>

      <main className="forgot-password-form-wrapper">
        <h2>Quên mật khẩu?</h2>
        <p className="forgot-password-instruction">
          Đừng lo lắng! Vui lòng nhập số điện thoại đã đăng ký Zalo của bạn để chúng tôi có thể hỗ trợ bạn đặt lại mật khẩu.
        </p>

        <form className="forgot-password-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <span className="country-code-selector-forgot">+84</span>
            <input
              type="tel"
              placeholder="Số điện thoại "
              className="input-field phone-input-forgot"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
              required
              disabled={isLoading}
            />
          </div>

          {error && <p className="error-message-fp">{error}</p>}

          <button type="submit" className="forgot-password-button" disabled={isLoading}>
            {isLoading ? 'Đang xử lý...' : 'Tiếp tục'}
          </button>
        </form>

        <div className="back-to-login-section">
          <Link to="/login" className="back-to-login-link-fp">
            Quay lại Đăng nhập
          </Link>
        </div>
      </main>
    </div>
  );
}

export default ForgotPassword;
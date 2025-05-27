import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import '../styles/OtpVerification.css'; // Import CSS

const OTP_LENGTH = 6; // Số lượng chữ số OTP

function OtpVerification() {
  const [otp, setOtp] = useState(new Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const inputRefs = useRef([]);

  const phoneNumber = location.state?.phoneNumber || "số điện thoại của bạn";
  const fullName = location.state?.fullName;


  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  useEffect(() => {
    let timerId;
    if (resendTimer > 0 && !canResend) {
      timerId = setTimeout(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    } else if (resendTimer === 0 && !canResend) {
      setCanResend(true);
    }
    return () => clearTimeout(timerId);
  }, [resendTimer, canResend]);

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return false; 

    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);
    setError(''); 

    if (element.value !== "" && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    const pasteData = e.clipboardData.getData('text').slice(0, OTP_LENGTH);
    if (/^\d+$/.test(pasteData)) {
      const newOtp = [...otp];
      for (let i = 0; i < pasteData.length; i++) {
        if (i < OTP_LENGTH) {
          newOtp[i] = pasteData[i];
        }
      }
      setOtp(newOtp);
      const lastFilledIndex = Math.min(pasteData.length - 1, OTP_LENGTH - 1);
      if (inputRefs.current[lastFilledIndex]) {
        inputRefs.current[lastFilledIndex].focus();
      }
    }
    e.preventDefault();
  };


  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const enteredOtp = otp.join("");

    if (enteredOtp.length !== OTP_LENGTH) {
      setError(`Vui lòng nhập đủ ${OTP_LENGTH} chữ số OTP.`);
      return;
    }

    try {
      const confirmationResult = window.confirmationResult;
      if (!confirmationResult) throw new Error("Không tìm thấy xác thực OTP");

      await confirmationResult.confirm(enteredOtp); // Xác thực OTP Firebase

      const formData = JSON.parse(localStorage.getItem('registerForm'));
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/account/addAccountWeb`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.status === 200) {
        alert('Đăng ký thành công!');
        localStorage.removeItem('registerForm');
        navigate('/login');
      } else {
        setError(data.message || 'Đăng ký thất bại!');
      }

    } catch (err) {
      console.error('Xác thực OTP hoặc đăng ký thất bại:', err);
      setError('Mã OTP không chính xác hoặc đã hết hạn. Vui lòng thử lại.');
      setOtp(new Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    }
  };


  const handleResendOtp = () => {
    if (!canResend) return;
    console.log('Yêu cầu gửi lại OTP cho:', phoneNumber);
    // --- Logic gửi lại OTP giả lập ---
    // Trong thực tế, bạn sẽ gọi API để yêu cầu gửi lại OTP
    alert(`Đã gửi lại mã OTP đến ${phoneNumber} (giả lập).`);
    setCanResend(false);
    setResendTimer(30); // Reset bộ đếm
    setOtp(new Array(OTP_LENGTH).fill("")); // Xóa OTP đã nhập
    setError('');
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  };

  return (
    <div className="otp-verification-container">
      <header className="zalo-header">
        <h1>Zalo</h1>
      </header>

      <main className="otp-verification-form-wrapper">
        <h2>Xác thực tài khoản</h2>
        <p className="otp-instruction">
          Một mã OTP gồm {OTP_LENGTH} chữ số đã được gửi đến <br /> số điện thoại <strong>{phoneNumber}</strong>.
          {fullName && <> <br />Xin chào <strong>{fullName}</strong>, vui lòng nhập mã để tiếp tục.</>}
        </p>

        <form onSubmit={handleVerifyOtp}>
          <div className="otp-input-fields" onPaste={handlePaste}>
            {otp.map((data, index) => {
              return (
                <input
                  className="otp-input"
                  type="text"
                  name="otp"
                  maxLength="1"
                  key={index}
                  value={data}
                  onChange={e => handleChange(e.target, index)}
                  onKeyDown={e => handleKeyDown(e, index)}
                  onFocus={e => e.target.select()}
                  ref={el => (inputRefs.current[index] = el)}
                  required
                />
              );
            })}
          </div>

          {error && <p className="otp-error-message">{error}</p>}

          <div className="resend-otp-section">
            Không nhận được mã?{' '}
            <button
              type="button"
              className="resend-otp-button"
              onClick={handleResendOtp}
              disabled={!canResend}
            >
              Gửi lại OTP
            </button>
            {!canResend && <span className="otp-timer">({resendTimer}s)</span>}
          </div>

          <button type="submit" className="verify-otp-button" disabled={otp.join("").length !== OTP_LENGTH}>
            Xác nhận
          </button>
        </form>
        <div className="login-link-section" style={{ marginTop: '20px' }}>
          <Link to="/login" className="back-to-login-link">Quay lại Đăng nhập</Link>
        </div>
      </main>
    </div>
  );
}

export default OtpVerification;
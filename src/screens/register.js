import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/register.css';
import { FaEye, FaEyeSlash, FaUser, FaPhoneAlt, FaCalendarAlt, FaVenusMars, FaLock } from 'react-icons/fa';
import { auth, RecaptchaVerifier, signInWithPhoneNumber } from '../config/firebaseConfig';
function ZaloRegistration() {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [dobDay, setDobDay] = useState('');
  const [dobMonth, setDobMonth] = useState('');
  const [dobYear, setDobYear] = useState('');
  const [gender, setGender] = useState(''); // 'male', 'female', 'other'
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({
    fullName: '',
    phoneNumber: '',
    dateOfBirth: '',
    gender: '',
    password: '',
    confirmPassword: '',
  });

  const navigate = useNavigate();
  const validateField = async (name, value) => {
    let message = '';

    switch (name) {
      case 'fullName':
        if (!value.trim()) message = 'Vui lòng nhập họ và tên';
        break;

      case 'phoneNumber':
        if (!/^\d{10}$/.test(value)) {
          message = 'Số điện thoại phải đủ 10 chữ số';
        } else {
          try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/account/check-phone?phoneNumber=0${value.slice(-9)}`);
            const data = await response.json();
            if (data.exists) {
              message = 'Số điện thoại đã được đăng ký, vui lòng nhập số khác';
            }
          } catch (err) {
            console.error('Lỗi kiểm tra số điện thoại:', err);
            message = 'Không kiểm tra được số điện thoại';
          }
        }
        break;

      case 'dateOfBirth':
        const [day, month, year] = value.split('/');
        const age = new Date().getFullYear() - parseInt(year);
        if (!day || !month || !year) {
          message = 'Vui lòng chọn đầy đủ ngày, tháng, năm sinh';
        } else if (age < 15) {
          message = 'Bạn phải đủ 15 tuổi trở lên để đăng ký';
        }
        break;

      case 'gender':
        if (!value) message = 'Vui lòng chọn giới tính';
        break;

      case 'password':
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
        if (!regex.test(value)) {
          message = 'Mật khẩu cần ít nhất 6 ký tự gồm chữ thường, chữ hoa và số';
        }
        break;

      case 'confirmPassword':
        if (value !== password) {
          message = 'Mật khẩu nhập lại không khớp';
        }
        break;

      default:
        break;
    }

    setErrors(prev => ({ ...prev, [name]: message }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    // 1. Kiểm tra mật khẩu khớp
    if (password !== confirmPassword) {
      alert('Mật khẩu nhập lại không khớp!');
      return;
    }

    // 2. Kiểm tra độ mạnh của mật khẩu
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
    if (!passwordRegex.test(password)) {
      alert('Mật khẩu phải có ít nhất 6 ký tự, gồm chữ thường, chữ hoa và số!');
      return;
    }

    // 3. Kiểm tra tuổi
    const birthYear = parseInt(dobYear);
    const currentYear = new Date().getFullYear();
    const age = currentYear - birthYear;
    if (age < 15) {
      alert('Bạn phải đủ 15 tuổi trở lên để đăng ký!');
      return;
    }

    // 4. Format số điện thoại thành +84xxxxxxx
    let formattedPhone = phoneNumber;
    if (phoneNumber.startsWith('0')) {
      formattedPhone = '+84' + phoneNumber.slice(1);
    }

    const formData = {
      fullName,
      phoneNumber: formattedPhone,
      dateOfBirth: `${dobDay}/${dobMonth}/${dobYear}`,
      gender,
      password,
    };

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/account/addAccountWeb`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      console.log('Kết quả đăng ký:', data);

      if (response.status === 200 && data.message === 'Đăng ký thành công!!!') {
        navigate('/receive-otp', {
          state: { phoneNumber: formattedPhone },
        });
      } else if (response.status === 400 && data.message === 'Số điện thoại đã được đăng ký!') {
        setErrors(prev => ({
          ...prev,
          phoneNumber: 'Số điện thoại đã được đăng ký, vui lòng nhập số khác',
        }));
      } else {
        alert(data.message || 'Đăng ký thất bại!');
      }

    } catch (err) {
      console.error('Lỗi đăng ký:', err);
      alert('Lỗi kết nối server!');
    }
  };
  // const handleRegister = async (e) => {
  //   e.preventDefault();

  //   // Validate như bạn đã làm

  //   let formattedPhone = phoneNumber;
  //   if (phoneNumber.startsWith('0')) {
  //     formattedPhone = '+84' + phoneNumber.slice(1);
  //   }

  //   const formData = {
  //     fullName,
  //     phoneNumber: formattedPhone,
  //     dateOfBirth: `${dobDay}/${dobMonth}/${dobYear}`,
  //     gender,
  //     password,
  //   };

  //   try {
  //     // Lưu thông tin form vào localStorage để sau xác thực mới gửi lên server
  //     localStorage.setItem('registerForm', JSON.stringify(formData));

  //     // Tạo Recaptcha và gửi OTP
  //     window.recaptchaVerifier = new RecaptchaVerifier('recaptcha-container', { size: 'invisible' }, auth);
  //     const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, window.recaptchaVerifier);
  //     window.confirmationResult = confirmationResult;

  //     navigate('/otp-verification', {
  //       state: { phoneNumber: formattedPhone, fullName }
  //     });
  //   } catch (err) {
  //     console.error("Lỗi gửi OTP:", err);
  //     alert("Không gửi được mã OTP.");
  //   }
  // };

  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
  const dateOfBirth = `${dobDay}/${dobMonth}/${dobYear}`;
  return (
    <div className="zalo-register-container">
      <header className="zalo-header">
        <h1>Zalo</h1>
        <p>Tạo tài khoản mới để bắt đầu kết nối</p>
      </header>

      <main className="register-form-wrapper">
        <form className="register-form" onSubmit={handleRegister}>
          <h2>Tạo tài khoản</h2>

          <div className="input-group">
            <span className="input-icon"><FaUser /></span>
            <input
              type="text"
              placeholder="Họ và tên"
              className="input-field"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              onBlur={() => validateField('fullName', fullName)}
              required

            />

          </div>
          {errors.fullName && <p className="error-text">{errors.fullName}</p>}

          <div className="input-group">
            <span className="input-icon"><FaPhoneAlt /></span>
            <div className="country-code-selector-register">
              <span>+84</span>
            </div>
            <input
              type="tel"
              placeholder="Số điện thoại"
              className="input-field phone-input"
              value={phoneNumber}
              onChange={(e) => {
                const input = e.target.value.replace(/\D/g, '');
                if (input.length <= 10) setPhoneNumber(input);
              }}
              onBlur={() => validateField('phoneNumber', phoneNumber)}
              required
            />

          </div>
          {errors.phoneNumber && <p className="error-text">{errors.phoneNumber}</p>}

          <label className="form-label dob-label"><FaCalendarAlt /> Ngày sinh</label>
          <div className="dob-group">
            <select value={dobDay} onChange={(e) => setDobDay(e.target.value)} onBlur={() => validateField('dateOfBirth', dateOfBirth)} required className="dob-select">
              <option value="">Ngày</option>
              {days.map(day => <option key={day} value={day}>{day}</option>)}
            </select>
            <select value={dobMonth} onChange={(e) => setDobMonth(e.target.value)} onBlur={() => validateField('dateOfBirth', dateOfBirth)} required className="dob-select">
              <option value="">Tháng</option>
              {months.map(month => <option key={month} value={month}>{month}</option>)}
            </select>
            <select value={dobYear} onChange={(e) => setDobYear(e.target.value)} onBlur={() => validateField('dateOfBirth', dateOfBirth)} required className="dob-select" >
              <option value="">Năm</option>
              {years.map(year => <option key={year} value={year}>{year}</option>)}
            </select>


          </div>
          {errors.dateOfBirth && <p className="error-text">{errors.dateOfBirth}</p>}
          <label className="form-label gender-label"><FaVenusMars /> Giới tính</label>
          <div className="gender-group">
            <label className="radio-label">
              <input type="radio" name="gender" value="male" onBlur={() => validateField('gender', gender)} checked={gender === 'male'} onChange={(e) => setGender(e.target.value)} required /> Nam
            </label>
            <label className="radio-label">
              <input type="radio" name="gender" value="female" onBlur={() => validateField('gender', gender)} checked={gender === 'female'} onChange={(e) => setGender(e.target.value)} /> Nữ
            </label>
            {/* <label className="radio-label">
              <input type="radio" name="gender" value="other" checked={gender === 'other'} onChange={(e) => setGender(e.target.value)} /> Khác
            </label> */}
          </div>

          <div className="input-group password-group">
            <span className="input-icon"><FaLock /></span>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Nhập mật khẩu"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              onBlur={() => validateField('password', password)}
            />

            <button
              type="button"
              className="toggle-password-button"
              onClick={() => setShowPassword(!showPassword)}
              title={showPassword ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          {errors.password && <p className="error-text">{errors.password}</p>}

          <div className="input-group password-group">
            <span className="input-icon"><FaLock /></span>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Nhập lại mật khẩu"
              className="input-field"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              onBlur={() => validateField('confirmPassword', confirmPassword)}
            />


            <button
              type="button"
              className="toggle-password-button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              title={showConfirmPassword ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"}
            >
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          {errors.confirmPassword && <p className="error-text">{errors.confirmPassword}</p>}

          <button type="submit" className="register-button">
            Đăng ký
          </button>

          <div className="login-link-section">
            <p>Đã có tài khoản?</p>
            <Link to="/login" className="back-to-login-link">Đăng nhập ngay</Link>
          </div>
        </form>
      </main>
      <div id="recaptcha-container"></div>

    </div>
  );
}

export default ZaloRegistration;
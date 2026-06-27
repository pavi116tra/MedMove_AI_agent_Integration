import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import './UserRegister.css';
import medmoveimg from '../Assest/medmove_new_logo.svg';
import API_BASE from '../config/api';

const UserRegister = () => {
    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        otp: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    const [otpSent, setOtpSent] = useState(false);
    const [isOtpVerified, setIsOtpVerified] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [devOtp, setDevOtp] = useState('');
    
    const navigate = useNavigate();
    const { login } = useContext(AuthContext);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSendOtp = async () => {
        if (!formData.phone || formData.phone.length !== 10) {
            setError('Please enter a valid 10-digit phone number');
            return;
        }
        try {
            const res = await axios.post(`${API_BASE}/api/auth/send-otp`, { phone: formData.phone });
            setOtpSent(true);
            if (res.data.dev_otp) {
                setDevOtp(res.data.dev_otp);
            }
            setError('');
        } catch (err) {
            setError('Failed to send OTP. Try again.');
        }
    };

    const handleVerifyOtp = async () => {
        try {
            await axios.post(`${API_BASE}/api/auth/verify-otp`, { phone: formData.phone, otp: formData.otp });
            setIsOtpVerified(true);
            setError('');
        } catch (err) {
            setError('Incorrect or expired OTP');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (!isOtpVerified) {
            setError('Please verify your phone number first');
            return;
        }

        try {
            const res = await axios.post(`${API_BASE}/api/auth/register-user`, formData);
            login(res.data);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong');
        }
    };

    return (
        <div className="user-register-page">

            {/* ── Logo ── */}
            <div className="ur-logo">
                <img src={medmoveimg} alt="MedMove" style={{ height: '46px', objectFit: 'contain' }} />
            </div>
            <p className="ur-tagline">Patient Registration</p>

            {/* ── Card ── */}
            <div className="user-register-card">

                {/* Card Header */}
                <div className="ur-badge">👤 Create Patient Account</div>
                <h2 className="ur-title">Create Your Account</h2>
                <p className="ur-subtitle">
                    All fields are required to create your patient account.
                </p>

                {/* Alerts */}
                {error && <div className="ur-error">{error}</div>}
                {devOtp && (
                    <div className="ur-dev-otp">
                        DEV MODE — Your OTP is: {devOtp}
                    </div>
                )}

                <form onSubmit={handleSubmit}>

                    {/* Full Name */}
                    <div className="ur-field">
                        <label className="ur-label" htmlFor="full_name">
                            Full Name <span className="required">*</span>
                        </label>
                        <input
                            id="full_name"
                            name="full_name"
                            type="text"
                            className="ur-input"
                            placeholder="Enter your full name"
                            required
                            value={formData.full_name}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Phone + OTP */}
                    <div className="ur-field">
                        <label className="ur-label" htmlFor="phone">
                            Phone Number <span className="required">*</span>
                        </label>
                        <div className="ur-phone-row">
                            <input
                                id="phone"
                                name="phone"
                                type="text"
                                className="ur-input"
                                placeholder="10 digits"
                                disabled={isOtpVerified}
                                value={formData.phone}
                                onChange={handleChange}
                            />
                            {!isOtpVerified && (
                                <button
                                    type="button"
                                    className={`ur-send-otp-btn${otpSent ? ' sent' : ''}`}
                                    onClick={handleSendOtp}
                                >
                                    {otpSent ? 'OTP Sent ✓' : 'Send OTP'}
                                </button>
                            )}
                        </div>

                        {otpSent && !isOtpVerified && (
                            <div className="ur-otp-verify-row">
                                <input
                                    name="otp"
                                    className="ur-input"
                                    placeholder="Enter 6-digit OTP"
                                    value={formData.otp}
                                    onChange={handleChange}
                                />
                                <button
                                    type="button"
                                    className="ur-verify-otp-btn"
                                    onClick={handleVerifyOtp}
                                >
                                    Verify
                                </button>
                            </div>
                        )}

                        {isOtpVerified && (
                            <p className="ur-phone-verified">✅ Phone verified</p>
                        )}
                    </div>

                    {/* Email */}
                    <div className="ur-field">
                        <label className="ur-label" htmlFor="email">
                            Email <span style={{ color: '#aab8c2', fontSize: '11px', fontWeight: 400 }}>(Optional)</span>
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            className="ur-input"
                            placeholder="you@example.com"
                            value={formData.email}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Password */}
                    <div className="ur-field">
                        <label className="ur-label" htmlFor="password">
                            Password <span className="required">*</span>
                        </label>
                        <div className="ur-password-wrapper">
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                className="ur-input"
                                placeholder="Min 8 characters"
                                required
                                value={formData.password}
                                onChange={handleChange}
                            />
                            <span className="ur-eye" onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? '👁️' : '🙈'}
                            </span>
                        </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="ur-field">
                        <label className="ur-label" htmlFor="confirmPassword">
                            Confirm Password <span className="required">*</span>
                        </label>
                        <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type={showPassword ? 'text' : 'password'}
                            className="ur-input"
                            placeholder="Repeat password"
                            required
                            value={formData.confirmPassword}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Submit */}
                    <button type="submit" className="ur-submit-btn" disabled={!isOtpVerified}>
                        Create Account →
                    </button>

                    {/* Divider */}
                    <div className="ur-divider">
                        <span className="ur-divider-line" />
                        <span className="ur-divider-text">OR</span>
                        <span className="ur-divider-line" />
                    </div>

                    {/* Footer */}
                    <div className="ur-footer">
                        Already have an account?{' '}
                        <Link to="/login/user">Login</Link>
                    </div>

                </form>
            </div>

            {/* ── Trust Badges ── */}
            <div className="ur-trust-badges">
                <span className="ur-trust-badge">🔒 Secure Registration</span>
                <span className="ur-trust-badge">🚑 Quick Booking</span>
                <span className="ur-trust-badge">📍 OTP Protected</span>
            </div>

        </div>
    );
};

export default UserRegister;

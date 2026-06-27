import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import './UserLogin.css';
import API_BASE from '../config/api';
import medmoveimg from '../Assest/medmove_new_logo.svg';

const UserLogin = () => {
    const [formData, setFormData] = useState({ phone: '', password: '' });
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const { login } = useContext(AuthContext);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const res = await axios.post(`${API_BASE}/api/auth/login-user`, formData);
            login(res.data);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong');
        }
    };

    return (
        <div className="user-login-page">

            {/* ── Top Logo ── */}
            <div className="ul-logo">
                <div className="ul-logo-row">
                    <img src={medmoveimg} alt="MedMove" style={{ height: '46px', objectFit: 'contain' }} />
                </div>
                <span className="ul-tagline">Patient Portal</span>
            </div>

            {/* ── Card ── */}
            <div className="user-login-card">

                {/* Header badge */}
                <div className="ul-badge">👤 Patient Login</div>
                <h2 className="ul-card-title">Welcome Back!</h2>
                <p className="ul-card-subtitle">
                    Login to book and track your ambulance in seconds.
                </p>

                {/* Error alert */}
                {error && <div className="ul-error">{error}</div>}

                <form onSubmit={handleSubmit}>

                    {/* Phone */}
                    <div className="ul-field">
                        <label className="ul-label" htmlFor="phone">
                            Phone Number <span className="required">*</span>
                        </label>
                        <input
                            id="phone"
                            name="phone"
                            type="tel"
                            className="ul-input"
                            placeholder="+91 XXXXX XXXXX"
                            required
                            value={formData.phone}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Password */}
                    <div className="ul-field">
                        <label className="ul-label" htmlFor="password">
                            Password <span className="required">*</span>
                        </label>
                        <div className="ul-password-wrapper">
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                className="ul-input"
                                placeholder="Enter your password"
                                required
                                value={formData.password}
                                onChange={handleChange}
                            />
                            <span
                                className="ul-eye"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? '👁️' : '🙈'}
                            </span>
                        </div>
                    </div>

                    {/* Forgot Password */}
                    <Link to="/forgot-password" className="ul-forgot">
                        Forgot Password?
                    </Link>

                    {/* Submit */}
                    <button type="submit" className="user-login-btn">
                        Login →
                    </button>

                    {/* Divider */}
                    <div className="ul-divider">
                        <span className="ul-divider-line" />
                        <span className="ul-divider-text">OR</span>
                        <span className="ul-divider-line" />
                    </div>

                    {/* Footer links — routing unchanged */}
                    <div className="ul-footer-row">
                        Don't have an account?{' '}
                        <Link to="/register/user">Register</Link>
                    </div>
                    <div className="ul-footer-row">
                        Login as{' '}
                        <Link to="/login/provider">Provider instead?</Link>
                    </div>

                </form>
            </div>

            {/* ── Trust Badges ── */}
            <div className="ul-trust-badges">
                <span className="ul-trust-badge">🔒 Secure Login</span>
                <span className="ul-trust-badge">🚑 60s Booking</span>
                <span className="ul-trust-badge">📍 Live Tracking</span>
            </div>

            {/* ── Bottom Decoration ── */}
            <div className="ul-bottom-art" />

        </div>
    );
};

export default UserLogin;

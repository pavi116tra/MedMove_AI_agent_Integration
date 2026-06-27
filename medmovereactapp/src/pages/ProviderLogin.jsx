import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import './ProviderLogin.css';
import medmoveimg from '../Assest/medmove_new_logo.svg';
import API_BASE from '../config/api';

const ProviderLogin = () => {
    const [formData, setFormData] = useState({ phone: '', password: '' });
    const [error, setError] = useState('');
    const [warning, setWarning] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const { login } = useContext(AuthContext);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setWarning('');
        try {
            const res = await axios.post(`${API_BASE}/api/auth/login-provider`, formData);
            login(res.data);
            navigate('/provider/dashboard');
        } catch (err) {
            if (err.response?.status === 403) {
                setWarning(err.response.data.message);
            } else {
                setError(err.response?.data?.message || 'Something went wrong');
            }
        }
    };

    return (
        <div className="login-page">
            {/* ── Logo ── */}
            <div className="login-logo">
                <img src={medmoveimg} alt="MedMove" style={{ height: '48px', objectFit: 'contain' }} />
            </div>
            <p className="login-tagline">Provider Portal</p>

            {/* ── Card ── */}
            <div className="login-card">
                {/* Card header */}
                <div className="provider-badge">🚑 Ambulance Provider</div>
                <h2 className="card-title">Login as Provider</h2>
                <p className="card-subtitle">
                    Access your provider dashboard to manage ambulances and bookings.
                </p>

                {/* Alerts */}
                {error   && <div className="login-error">{error}</div>}
                {warning && <div className="login-warning">⚠️ {warning}</div>}

                <form onSubmit={handleSubmit}>
                    {/* Phone */}
                    <div className="field-group">
                        <label className="field-label" htmlFor="phone">
                            Registered Phone Number <span className="required">*</span>
                        </label>
                        <input
                            id="phone"
                            name="phone"
                            type="text"
                            className="field-input"
                            placeholder="Enter phone"
                            required
                            value={formData.phone}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Password */}
                    <div className="field-group">
                        <label className="field-label" htmlFor="password">
                            Password <span className="required">*</span>
                        </label>
                        <div className="password-field-wrapper">
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                className="field-input"
                                placeholder="Enter password"
                                required
                                value={formData.password}
                                onChange={handleChange}
                            />
                            <span
                                className="password-eye"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? '👁️' : '🙈'}
                            </span>
                        </div>
                    </div>

                    {/* Submit */}
                    <button type="submit" className="login-btn">
                        Login as Provider →
                    </button>

                    {/* Divider */}
                    <div className="divider">
                        <span className="divider-line" />
                        <span className="divider-text">OR</span>
                        <span className="divider-line" />
                    </div>

                    {/* Footer links — routing unchanged */}
                    <div className="footer-link-row">
                        New provider?{' '}
                        <Link to="/register/provider">Register here</Link>
                    </div>
                    <div className="footer-link-row">
                        Login as{' '}
                        <Link to="/login/user">User instead?</Link>
                    </div>
                </form>
            </div>

            {/* ── Trust Badges ── */}
            <div className="trust-badges">
                <span className="trust-badge">🔒 Secure Login</span>
                <span className="trust-badge">✅ Verified Providers</span>
                <span className="trust-badge">🛡️ OTP Protected</span>
            </div>

            {/* ── Bottom Decoration ── */}
            <div className="bottom-art" />
        </div>
    );
};

export default ProviderLogin;

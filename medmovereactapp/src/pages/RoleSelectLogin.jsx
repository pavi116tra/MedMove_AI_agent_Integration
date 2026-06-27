import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Auth.css';
import medmoveimg from '../Assest/medmove_new_logo.svg';

const RoleSelectLogin = () => {
    const navigate = useNavigate();

    return (
        <div className="auth-page-wrapper">

            {/* Logo */}
            <div className="auth-logo">
                <img src={medmoveimg} alt="MedMove" />
            </div>

            {/* Heading */}
            <div className="auth-heading-block">
                <h1>Welcome Back</h1>
                <p>How do you want to login?</p>
            </div>

            {/* Cards */}
            <div className="auth-card-container">

                {/* Patient Card */}
                <div className="role-card" onClick={() => navigate('/login/user')}>
                    <div className="role-icon-bubble">👤</div>
                    <div className="role-title">Login as Patient</div>
                    <p className="role-desc">
                        Access your dashboard to book and track ambulances in real time.
                    </p>
                    <button className="auth-btn">Patient Login</button>
                </div>

                {/* Provider Card */}
                <div className="role-card" onClick={() => navigate('/login/provider')}>
                    <div className="role-icon-bubble">🚑</div>
                    <div className="role-title">Login as Provider</div>
                    <p className="role-desc">
                        Manage your fleet and respond to incoming booking requests.
                    </p>
                    <button className="auth-btn">Provider Login</button>
                </div>

            </div>

            {/* Footer */}
            <p className="auth-footer-link">
                Don't have an account?
                <Link to="/register">Register here</Link>
            </p>

        </div>
    );
};

export default RoleSelectLogin;

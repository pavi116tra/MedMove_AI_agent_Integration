import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Auth.css';
import medmoveimg from '../Assest/medmove_new_logo.svg';

const RoleSelectRegister = () => {
    const navigate = useNavigate();

    return (
        <div className="auth-page-wrapper">

            {/* Logo */}
            <div className="auth-logo">
                <img src={medmoveimg} alt="MedMove" />
            </div>

            {/* Heading */}
            <div className="auth-heading-block">
                <h1>Join MedMove</h1>
                <p>Who are you registering as?</p>
            </div>

            {/* Cards */}
            <div className="auth-card-container">

                {/* Patient Card */}
                <div className="role-card" onClick={() => navigate('/register/user')}>
                    <div className="role-icon-bubble">🧑‍⚕️</div>
                    <div className="role-title">I'm a Patient / Family Member</div>
                    <p className="role-desc">
                        Book ambulances for medical trips and manage your health journey.
                    </p>
                    <button className="auth-btn">Get Started</button>
                </div>

                {/* Provider Card */}
                <div className="role-card" onClick={() => navigate('/register/provider')}>
                    <div className="role-icon-bubble">🚑</div>
                    <div className="role-title">I'm an Ambulance Provider</div>
                    <p className="role-desc">
                        List and manage your ambulances and start receiving bookings today.
                    </p>
                    <button className="auth-btn">Register Now</button>
                </div>

            </div>

            {/* Footer */}
            <p className="auth-footer-link">
                Already have an account?
                <Link to="/login">Login here</Link>
            </p>

        </div>
    );
};

export default RoleSelectRegister;

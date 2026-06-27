import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import './LoginModal.css';
import API_BASE from '../../config/api';

const LoginModal = ({ isOpen, onClose, onLoginSuccess }) => {
    const [role, setRole] = useState(null); // 'user', 'provider', or null (for selection)
    const [formData, setFormData] = useState({ phone: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useContext(AuthContext);

    if (!isOpen) return null;

    const handleBackdropClick = (e) => {
        if (e.target.className === 'modal-backdrop') {
            onClose();
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const endpoint = role === 'user' 
                ? `${API_BASE}/api/auth/login-user` 
                : `${API_BASE}/api/auth/login-provider`;
            
            const res = await axios.post(endpoint, formData);
            login(res.data);
            if (onLoginSuccess) onLoginSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-backdrop" onClick={handleBackdropClick}>
            <div className="modal-content">
                <button className="modal-close" onClick={onClose}>&times;</button>
                
                {!role ? (
                    <div className="role-selection">
                        <h2>Login to Continue</h2>
                        <p>Please select your account type</p>
                        <div className="modal-role-cards">
                            <div className="modal-role-card" onClick={() => setRole('user')}>
                                <div className="role-icon">🧑‍⚕️</div>
                                <span>Patient / User</span>
                            </div>
                            <div className="modal-role-card" onClick={() => setRole('provider')}>
                                <div className="role-icon">🚑</div>
                                <span>Ambulance Provider</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="login-form-container">
                        <button className="back-btn" onClick={() => { setRole(null); setError(''); }}>
                            &larr; Back
                        </button>
                        <h2>{role === 'user' ? 'Patient Login' : 'Provider Login'}</h2>
                        
                        {error && <div className="modal-error">{error}</div>}
                        
                        <form onSubmit={handleSubmit}>
                            <div className="modal-form-group">
                                <label>Phone Number</label>
                                <input 
                                    name="phone" 
                                    type="text" 
                                    placeholder="Enter registered phone" 
                                    required 
                                    value={formData.phone} 
                                    onChange={handleChange} 
                                />
                            </div>
                            <div className="modal-form-group">
                                <label>Password</label>
                                <input 
                                    name="password" 
                                    type="password" 
                                    placeholder="Enter password" 
                                    required 
                                    value={formData.password} 
                                    onChange={handleChange} 
                                />
                            </div>
                            <button type="submit" className="modal-auth-btn" disabled={loading}>
                                {loading ? 'Logging in...' : 'Login Now'}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LoginModal;

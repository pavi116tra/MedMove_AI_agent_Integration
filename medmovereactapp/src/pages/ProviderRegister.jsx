import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './ProviderRegister.css';
import medmoveimg from '../Assest/medmove_new_logo.svg';
import API_BASE from '../config/api';

const ProviderRegister = () => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        company_name: '',
        owner_name: '',
        phone: '',
        otp: '',
        email: '',
        password: '',
        confirmPassword: '',
        address: '',
        service_area: 'Chennai',
        license_number: '',
    });

    const [files, setFiles] = useState({
        license_doc: null,
        id_proof: null
    });

    const [otpSent, setOtpSent] = useState(false);
    const [isOtpVerified, setIsOtpVerified] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [devOtp, setDevOtp] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        setFiles({ ...files, [e.target.name]: e.target.files[0] });
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
            setError('Failed to send OTP.');
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

    const nextStep = () => {
        if (step === 1) {
            if (!isOtpVerified) {
                setError('Please verify your phone number first');
                return;
            }
            if (formData.password !== formData.confirmPassword) {
                setError('Passwords do not match');
                return;
            }
        }
        setError('');
        setStep(step + 1);
    };

    const prevStep = () => setStep(step - 1);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const data = new FormData();
        Object.keys(formData).forEach(key => data.append(key, formData[key]));
        if (files.license_doc) data.append('license_doc', files.license_doc);
        if (files.id_proof) data.append('id_proof', files.id_proof);

        try {
            await axios.post(`${API_BASE}/api/auth/register-provider`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setSuccess(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Submission failed');
        }
    };

    /* ── Success Screen ── */
    if (success) {
        return (
            <div className="register-page">
                <div className="register-logo">
                    <img src={medmoveimg} alt="MedMove" style={{ height: '48px', objectFit: 'contain' }} />
                </div>
                <p className="register-tagline">Provider Registration</p>

                <div className="success-card">
                    <div className="success-icon">✅</div>
                    <h2 className="success-title">Application Submitted!</h2>
                    <p className="success-text">
                        Your application is under review. Admin will approve within 24 hours.{' '}
                        You will receive an SMS notification.
                    </p>
                    <button className="success-btn" onClick={() => navigate('/login/provider')}>
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    /* ── Step badge / heading maps ── */
    const badge    = step === 1 ? '🏢 Company Details'       : '📄 Upload Documents';
    const heading  = step === 1 ? 'Tell us about your company' : 'Upload your documents';
    const subtext  = step === 1
        ? 'All fields are required to create your provider account.'
        : 'Upload clear scans or photos of your documents for verification.';

    return (
        <div className="register-page">
            {/* ── Logo ── */}
            <div className="register-logo">
                <img src={medmoveimg} alt="MedMove" style={{ height: '48px', objectFit: 'contain' }} />
            </div>
            <p className="register-tagline">Provider Registration</p>

            {/* ── Card ── */}
            <div className="register-card">

                {/* Step Progress Bar */}
                <div className="stepper">
                    <div className="step-wrapper">
                        <div className={`step-circle ${step >= 1 ? 'active' : 'inactive'}`}>1</div>
                        <span className={`step-label ${step >= 1 ? 'active' : 'inactive'}`}>Company</span>
                    </div>

                    <div className="step-connector" />

                    <div className="step-wrapper">
                        <div className={`step-circle ${step >= 2 ? 'active' : 'inactive'}`}>2</div>
                        <span className={`step-label ${step >= 2 ? 'active' : 'inactive'}`}>Documents</span>
                    </div>
                </div>

                {/* Card Header */}
                <div className="reg-badge">{badge}</div>
                <h2 className="reg-title">{heading}</h2>
                <p className="reg-subtitle">{subtext}</p>

                {/* Alerts */}
                {error  && <div className="reg-error">{error}</div>}
                {devOtp && (
                    <div className="reg-dev-otp">
                        DEV MODE — Your OTP is: {devOtp}
                    </div>
                )}

                {/* ── Step 1 ── */}
                {step === 1 && (
                    <>
                        <div className="reg-field">
                            <label className="reg-label" htmlFor="company_name">
                                Company Name <span className="required">*</span>
                            </label>
                            <input
                                id="company_name"
                                name="company_name"
                                className="reg-input"
                                onChange={handleChange}
                                value={formData.company_name}
                                required
                            />
                        </div>

                        <div className="reg-field">
                            <label className="reg-label" htmlFor="owner_name">
                                Owner Name <span className="required">*</span>
                            </label>
                            <input
                                id="owner_name"
                                name="owner_name"
                                className="reg-input"
                                onChange={handleChange}
                                value={formData.owner_name}
                                required
                            />
                        </div>

                        <div className="reg-field">
                            <label className="reg-label" htmlFor="phone">
                                Phone Number <span className="required">*</span>
                            </label>
                            <div className="phone-row">
                                <input
                                    id="phone"
                                    name="phone"
                                    className="reg-input"
                                    disabled={isOtpVerified}
                                    onChange={handleChange}
                                    value={formData.phone}
                                    required
                                />
                                {!isOtpVerified && (
                                    <button
                                        type="button"
                                        className={`send-otp-btn${otpSent ? ' sent' : ''}`}
                                        onClick={handleSendOtp}
                                    >
                                        {otpSent ? 'OTP Sent ✓' : 'Send OTP'}
                                    </button>
                                )}
                            </div>

                            {otpSent && !isOtpVerified && (
                                <div className="otp-verify-row">
                                    <input
                                        name="otp"
                                        className="reg-input"
                                        placeholder="Enter OTP"
                                        onChange={handleChange}
                                        value={formData.otp}
                                    />
                                    <button
                                        type="button"
                                        className="verify-otp-btn"
                                        onClick={handleVerifyOtp}
                                    >
                                        Verify
                                    </button>
                                </div>
                            )}

                            {isOtpVerified && (
                                <p className="phone-verified">✅ Phone verified</p>
                            )}
                        </div>

                        <div className="reg-field">
                            <label className="reg-label" htmlFor="email">
                                Email <span className="required">*</span>
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                className="reg-input"
                                onChange={handleChange}
                                value={formData.email}
                                required
                            />
                        </div>

                        <div className="reg-field">
                            <label className="reg-label" htmlFor="password">
                                Password <span className="required">*</span>
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                className="reg-input"
                                onChange={handleChange}
                                value={formData.password}
                                required
                            />
                        </div>

                        <div className="reg-field">
                            <label className="reg-label" htmlFor="confirmPassword">
                                Confirm Password <span className="required">*</span>
                            </label>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                className="reg-input"
                                onChange={handleChange}
                                value={formData.confirmPassword}
                                required
                            />
                        </div>

                        <button type="button" className="next-btn" onClick={nextStep}>
                            Next Step →
                        </button>
                    </>
                )}

                {/* ── Step 2 ── */}
                {step === 2 && (
                    <>
                        <div className="reg-field">
                            <label className="reg-label" htmlFor="address">
                                Full Address <span className="required">*</span>
                            </label>
                            <input
                                id="address"
                                name="address"
                                className="reg-input"
                                onChange={handleChange}
                                value={formData.address}
                                required
                            />
                        </div>

                        <div className="reg-field">
                            <label className="reg-label" htmlFor="service_area">
                                Service Area (District) <span className="required">*</span>
                            </label>
                            <select
                                id="service_area"
                                name="service_area"
                                className="reg-input"
                                onChange={handleChange}
                                value={formData.service_area}
                            >
                                <option value="Chennai">Chennai</option>
                                <option value="Coimbatore">Coimbatore</option>
                                <option value="Madurai">Madurai</option>
                                <option value="Salem">Salem</option>
                            </select>
                        </div>

                        <div className="reg-field">
                            <label className="reg-label" htmlFor="license_number">
                                License Number <span className="required">*</span>
                            </label>
                            <input
                                id="license_number"
                                name="license_number"
                                className="reg-input"
                                onChange={handleChange}
                                value={formData.license_number}
                                required
                            />
                        </div>

                        <div className="reg-field">
                            <label className="reg-label" htmlFor="license_doc">
                                Upload License Document <span className="required">*</span>
                            </label>
                            <input
                                id="license_doc"
                                name="license_doc"
                                type="file"
                                className="reg-input"
                                onChange={handleFileChange}
                                required
                            />
                        </div>

                        <div className="reg-field">
                            <label className="reg-label" htmlFor="id_proof">
                                Upload ID Proof <span className="required">*</span>
                            </label>
                            <input
                                id="id_proof"
                                name="id_proof"
                                type="file"
                                className="reg-input"
                                onChange={handleFileChange}
                                required
                            />
                        </div>

                        <button type="button" className="back-btn" onClick={prevStep}>
                            ← Back
                        </button>
                        <button type="button" className="next-btn" onClick={handleSubmit}>
                            Complete Registration →
                        </button>
                    </>
                )}

                {/* Footer link */}
                <div className="reg-footer">
                    Already registered?{' '}
                    <Link to="/login/provider">Login here</Link>
                </div>
            </div>

            {/* ── Trust Badges ── */}
            <div className="trust-badges">
                <span className="trust-badge">🔒 Secure Registration</span>
                <span className="trust-badge">✅ Verified Providers Only</span>
                <span className="trust-badge">🛡️ OTP Protected</span>
            </div>
        </div>
    );
};

export default ProviderRegister;

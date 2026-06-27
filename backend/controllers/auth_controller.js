const { User, Provider, OTPLog } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendOTP, generateOTP } = require('../config/otp');

const generateAuthTokens = (id, role) => {
    const secret = process.env.JWT_SECRET || 'medmove_secret_key';
    const accessToken = jwt.sign({ id, role }, secret, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ id, role }, secret, { expiresIn: '7d' });
    return { accessToken, refreshToken };
};

// @desc    Send OTP to phone
exports.sendOTP = async (req, res) => {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ success: false, message: 'Phone number is required' });

    try {
        const otp = generateOTP();
        const expires_at = new Date(Date.now() + 10 * 60 * 1000);

        await OTPLog.create({ 
            phone, 
            otp_code: otp, 
            status: 'sent', 
            expires_at 
        });

        const result = await sendOTP(phone, otp);
        res.status(200).json({ 
            success: true, 
            message: result.message,
            dev_otp: process.env.NODE_ENV !== 'production' ? otp : undefined 
        });
    } catch (err) {
        console.error('Send OTP Error:', err);
        res.status(500).json({ success: false, message: 'Failed to send OTP. Please try again later.' });
    }
};

// @desc    Verify OTP
exports.verifyOTP = async (req, res) => {
    const { phone, otp } = req.body;
    if (!phone || !otp) return res.status(400).json({ success: false, message: 'Phone and OTP are required' });

    try {
        const log = await OTPLog.findOne({
            where: { phone, otp_code: otp, status: 'sent' },
            order: [['createdAt', 'DESC']]
        });

        if (!log || new Date() > log.expires_at) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }

        await log.update({ status: 'verified' });
        res.status(200).json({ success: true, message: 'OTP verified successfully' });
    } catch (err) {
        console.error('Verify OTP Error:', err);
        res.status(500).json({ success: false, message: 'Verification failed. Server error.' });
    }
};

// @desc    Register a new patient
exports.registerUser = async (req, res) => {
    const { full_name, phone, email, password } = req.body;
    if (!full_name || !phone || !password) return res.status(400).json({ success: false, message: 'Required fields missing' });

    try {
        let user = await User.findOne({ where: { phone } });
        if (user) return res.status(400).json({ success: false, message: 'Phone number already registered' });

        const verifiedLog = await OTPLog.findOne({
            where: { phone, status: 'verified' },
            order: [['updatedAt', 'DESC']]
        });
        if (!verifiedLog) return res.status(400).json({ success: false, message: 'Phone number not verified via OTP' });

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        user = await User.create({
            full_name,
            phone,
            email,
            password_hash,
            is_verified: true
        });

        const { accessToken, refreshToken } = generateAuthTokens(user.id, 'user');
        res.status(201).json({
            success: true,
            accessToken,
            refreshToken,
            user: { id: user.id, full_name: user.full_name, phone: user.phone, role: 'user' }
        });
    } catch (err) {
        console.error('Register User Error:', err);
        res.status(500).json({ success: false, message: 'Registration failed due to server error.' });
    }
};

// @desc    Login patient
exports.loginUser = async (req, res) => {
    const { phone, password } = req.body;
    if (!phone || !password) return res.status(400).json({ success: false, message: 'Phone and password required' });

    try {
        const user = await User.findOne({ where: { phone } });
        if (!user) return res.status(404).json({ success: false, message: 'No account found with this phone number.' });

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(400).json({ success: false, message: 'Incorrect password.' });

        if (!user.is_verified) return res.status(403).json({ success: false, message: 'Please verify your phone number first.' });

        const { accessToken, refreshToken } = generateAuthTokens(user.id, 'user');
        res.json({
            success: true,
            accessToken,
            refreshToken,
            user: { id: user.id, full_name: user.full_name, phone: user.phone, role: 'user' }
        });
    } catch (err) {
        console.error('Login User Error:', err);
        res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
    }
};

// @desc    Register a new provider
exports.registerProvider = async (req, res) => {
    try {
        const { 
            company_name, owner_name, phone, email, password, 
            address, service_area, license_number
        } = req.body;

        if (!company_name || !phone || !password) return res.status(400).json({ success: false, message: 'Basic provider info missing' });

        const providerExists = await Provider.findOne({ where: { phone } });
        if (providerExists) return res.status(400).json({ success: false, message: 'Phone number already registered' });

        const verifiedLog = await OTPLog.findOne({
            where: { phone, status: 'verified' },
            order: [['updatedAt', 'DESC']]
        });
        if (!verifiedLog) return res.status(400).json({ success: false, message: 'OTP verification required for registration.' });

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const license_doc = req.files && req.files['license_doc'] ? req.files['license_doc'][0].path : null;
        const id_proof = req.files && req.files['id_proof'] ? req.files['id_proof'][0].path : null;

        await Provider.create({
            company_name,
            owner_name,
            phone,
            email,
            password_hash,
            address,
            service_area,
            license_number,
            license_doc_url: license_doc,
            id_proof_url: id_proof,
            is_approved: false
        });

        res.status(201).json({ success: true, message: 'Registration submitted successfully. Pending admin review.' });
    } catch (err) {
        console.error('Register Provider Error:', err);
        res.status(500).json({ success: false, message: 'Registration failed. Server error.' });
    }
};

// @desc    Login provider
exports.loginProvider = async (req, res) => {
    const { phone, password } = req.body;
    if (!phone || !password) return res.status(400).json({ success: false, message: 'Phone and password required' });

    try {
        const provider = await Provider.findOne({ where: { phone } });
        if (!provider) return res.status(404).json({ success: false, message: 'No provider account found with this phone number.' });

        const isMatch = await bcrypt.compare(password, provider.password_hash);
        if (!isMatch) return res.status(400).json({ success: false, message: 'Incorrect password.' });

        if (!provider.is_approved) {
            return res.status(403).json({ 
                success: false,
                message: 'Account pending admin approval. You will receive an SMS once verified.',
                is_approved: false 
            });
        }

        const { accessToken, refreshToken } = generateAuthTokens(provider.id, 'provider');
        res.json({
            success: true,
            accessToken,
            refreshToken,
            provider: {
                id: provider.id,
                company_name: provider.company_name,
                is_approved: provider.is_approved,
                role: 'provider'
            }
        });
    } catch (err) {
        console.error('Login Provider Error:', err);
        res.status(500).json({ success: false, message: 'Server error during login.' });
    }
};

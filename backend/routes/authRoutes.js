const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth_controller');
const multer = require('multer');
const path = require('path');

const fs = require('fs');
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const { detectBruteForce, detectOTPAbuse } = require('../middleware/securityGuard');

// @route   POST api/auth/send-otp
router.post('/send-otp', detectOTPAbuse, authController.sendOTP);

// @route   POST api/auth/verify-otp
router.post('/verify-otp', authController.verifyOTP);

// @route   POST api/auth/register-user
router.post('/register-user', authController.registerUser);

// @route   POST api/auth/login-user
router.post('/login-user', detectBruteForce, authController.loginUser);

// @route   POST api/auth/register-provider
router.post('/register-provider', upload.fields([
    { name: 'license_doc', maxCount: 1 },
    { name: 'id_proof', maxCount: 1 }
]), authController.registerProvider);

// @route   POST api/auth/login-provider
router.post('/login-provider', detectBruteForce, authController.loginProvider);

module.exports = router;

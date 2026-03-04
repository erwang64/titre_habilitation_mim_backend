const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const authController = require('../controllers/authController');
const habilitationController = require('../controllers/habilitationController');
const { verifyToken, verifyAdmin, optionalAuth } = require('../middleware/authMiddleware');

// ── Multer config ──────────────────────────────────────────────
const uploadsDir = process.env.UPLOADS_PATH || path.join(__dirname, '..', 'uploads');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Seuls les fichiers PDF sont acceptés.'), false);
        }
    },
    limits: { fileSize: 20 * 1024 * 1024 } // 20 MB
});

// ── Auth ───────────────────────────────────────────────────────
router.post('/login', authController.login);
router.get('/me', verifyToken, authController.me);

// ── Habilitations ──────────────────────────────────────────────
// Public URL access (optionalAuth so private docs get blocked)
router.get('/public/:token', optionalAuth, habilitationController.getByPublicToken);

// List all (admin)
router.get('/habilitations', verifyToken, habilitationController.getAll);

// Stats for dashboard
router.get('/habilitations/stats', verifyToken, habilitationController.getStats);

// Get one
router.get('/habilitations/:id', verifyToken, habilitationController.getOne);

// Create
router.post('/habilitations', verifyToken, verifyAdmin, upload.single('fichier'), habilitationController.create);

// Update (metadata only)
router.put('/habilitations/:id', verifyToken, verifyAdmin, habilitationController.update);

// Replace file
router.put('/habilitations/:id/fichier', verifyToken, verifyAdmin, upload.single('fichier'), habilitationController.updateFile);

// Delete
router.delete('/habilitations/:id', verifyToken, verifyAdmin, habilitationController.remove);

// Generate / refresh QR + public URL
router.post('/habilitations/:id/generate-url', verifyToken, verifyAdmin, habilitationController.generateUrl);

module.exports = router;

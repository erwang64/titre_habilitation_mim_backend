const { appDB } = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// GET /api/habilitations — all records
exports.getAll = async (req, res) => {
    try {
        const [rows] = await appDB.execute(
            `SELECT id, titre, nom, prenom, date_validite, visibilite, public_token, fichier_nom, created_at,
                    CASE 
                        WHEN date_validite < CURDATE() THEN 'expire'
                        WHEN date_validite <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 'bientot'
                        ELSE 'valide'
                    END AS statut
             FROM habilitations ORDER BY date_validite ASC`
        );
        res.json(rows);
    } catch (error) {
        console.error('getAll error:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// GET /api/habilitations/stats
exports.getStats = async (req, res) => {
    try {
        const [[{ total }]] = await appDB.execute('SELECT COUNT(*) as total FROM habilitations');
        const [[{ expires_soon }]] = await appDB.execute(
            `SELECT COUNT(*) as expires_soon FROM habilitations 
             WHERE date_validite > CURDATE() AND date_validite <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)`
        );
        const [[{ expired }]] = await appDB.execute(
            `SELECT COUNT(*) as expired FROM habilitations WHERE date_validite < CURDATE()`
        );
        const [[{ valid }]] = await appDB.execute(
            `SELECT COUNT(*) as valid FROM habilitations WHERE date_validite >= DATE_ADD(CURDATE(), INTERVAL 30 DAY)`
        );
        res.json({ total, expires_soon, expired, valid });
    } catch (error) {
        console.error('getStats error:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// GET /api/habilitations/:id
exports.getOne = async (req, res) => {
    try {
        const [rows] = await appDB.execute(
            `SELECT * FROM habilitations WHERE id = ?`,
            [req.params.id]
        );
        if (rows.length === 0) return res.status(404).json({ message: 'Habilitation non trouvée' });
        res.json(rows[0]);
    } catch (error) {
        console.error('getOne error:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// GET /api/public/:token — public URL access
exports.getByPublicToken = async (req, res) => {
    try {
        const [rows] = await appDB.execute(
            `SELECT * FROM habilitations WHERE public_token = ?`,
            [req.params.token]
        );
        if (rows.length === 0) return res.status(404).json({ message: 'Document non trouvé' });
        const hab = rows[0];
        if (hab.visibilite === 'prive' && !req.user) {
            return res.status(401).json({ message: 'Ce document est privé. Veuillez vous connecter.' });
        }
        res.json(hab);
    } catch (error) {
        console.error('getByPublicToken error:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// POST /api/habilitations
exports.create = async (req, res) => {
    try {
        const { titre, nom, prenom, date_validite, visibilite } = req.body;
        if (!req.file) return res.status(400).json({ message: 'Fichier PDF requis' });
        if (!titre || !nom || !prenom || !date_validite || !visibilite) {
            return res.status(400).json({ message: 'Tous les champs sont requis' });
        }

        const public_token = uuidv4();
        const fichier_path = req.file.filename;
        const fichier_nom = req.file.originalname;

        const publicUrl = `${FRONTEND_URL}/habilitation/${public_token}`;
        const qr_code = await QRCode.toDataURL(publicUrl);

        await appDB.execute(
            `INSERT INTO habilitations (titre, nom, prenom, date_validite, visibilite, public_token, fichier_path, fichier_nom, public_url, qr_code)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [titre, nom, prenom, date_validite, visibilite, public_token, fichier_path, fichier_nom, publicUrl, qr_code]
        );

        const [newRows] = await appDB.execute(
            'SELECT * FROM habilitations WHERE public_token = ?', [public_token]
        );
        res.status(201).json(newRows[0]);
    } catch (error) {
        console.error('create error:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la création' });
    }
};

// PUT /api/habilitations/:id — update metadata
exports.update = async (req, res) => {
    try {
        const { titre, nom, prenom, date_validite, visibilite } = req.body;
        const { id } = req.params;

        await appDB.execute(
            `UPDATE habilitations SET titre = ?, nom = ?, prenom = ?, date_validite = ?, visibilite = ? WHERE id = ?`,
            [titre, nom, prenom, date_validite, visibilite, id]
        );

        const [rows] = await appDB.execute('SELECT * FROM habilitations WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Habilitation non trouvée' });
        res.json(rows[0]);
    } catch (error) {
        console.error('update error:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la mise à jour' });
    }
};

// PUT /api/habilitations/:id/fichier — replace PDF file
exports.updateFile = async (req, res) => {
    try {
        const { id } = req.params;
        if (!req.file) return res.status(400).json({ message: 'Fichier PDF requis' });

        const [rows] = await appDB.execute('SELECT * FROM habilitations WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Habilitation non trouvée' });

        const old = rows[0];
        // Delete old file
        const uploadsDir = process.env.UPLOADS_PATH || path.join(__dirname, '..', 'uploads');
        const oldFilePath = path.join(uploadsDir, old.fichier_path);
        if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);

        await appDB.execute(
            `UPDATE habilitations SET fichier_path = ?, fichier_nom = ? WHERE id = ?`,
            [req.file.filename, req.file.originalname, id]
        );

        const [updated] = await appDB.execute('SELECT * FROM habilitations WHERE id = ?', [id]);
        res.json(updated[0]);
    } catch (error) {
        console.error('updateFile error:', error);
        res.status(500).json({ message: 'Erreur serveur lors du remplacement du fichier' });
    }
};

// DELETE /api/habilitations/:id
exports.remove = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await appDB.execute('SELECT * FROM habilitations WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Habilitation non trouvée' });

        const hab = rows[0];
        const uploadsDir = process.env.UPLOADS_PATH || path.join(__dirname, '..', 'uploads');
        const filePath = path.join(uploadsDir, hab.fichier_path);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

        await appDB.execute('DELETE FROM habilitations WHERE id = ?', [id]);
        res.json({ message: 'Habilitation supprimée avec succès' });
    } catch (error) {
        console.error('remove error:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la suppression' });
    }
};

// POST /api/habilitations/:id/generate-url — regenerate public token + QR
exports.generateUrl = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await appDB.execute('SELECT * FROM habilitations WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Habilitation non trouvée' });

        const new_token = uuidv4();
        const publicUrl = `${FRONTEND_URL}/habilitation/${new_token}`;
        const qr_code = await QRCode.toDataURL(publicUrl);

        await appDB.execute(
            'UPDATE habilitations SET public_token = ?, public_url = ?, qr_code = ? WHERE id = ?',
            [new_token, publicUrl, qr_code, id]
        );

        const [updated] = await appDB.execute('SELECT * FROM habilitations WHERE id = ?', [id]);
        res.json(updated[0]);
    } catch (error) {
        console.error('generateUrl error:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la génération de l\'URL' });
    }
};

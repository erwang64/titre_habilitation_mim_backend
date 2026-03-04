const { appDB } = require('../config/db');
const { checkExpiringHabilitations } = require('../utils/alertService');

// GET /api/notifications/recipients
exports.getRecipients = async (req, res) => {
    try {
        const [rows] = await appDB.execute('SELECT * FROM email_recipients ORDER BY created_at DESC');
        res.json(rows);
    } catch (error) {
        console.error('getRecipients error:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// POST /api/notifications/recipients
exports.addRecipient = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ message: 'Adresse email invalide' });
        }

        const [existing] = await appDB.execute('SELECT id FROM email_recipients WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(409).json({ message: 'Cette adresse est déjà enregistrée' });
        }

        await appDB.execute('INSERT INTO email_recipients (email) VALUES (?)', [email]);
        const [rows] = await appDB.execute('SELECT * FROM email_recipients ORDER BY created_at DESC');
        res.status(201).json(rows);
    } catch (error) {
        console.error('addRecipient error:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// DELETE /api/notifications/recipients/:id
exports.removeRecipient = async (req, res) => {
    try {
        const { id } = req.params;
        await appDB.execute('DELETE FROM email_recipients WHERE id = ?', [id]);
        const [rows] = await appDB.execute('SELECT * FROM email_recipients ORDER BY created_at DESC');
        res.json(rows);
    } catch (error) {
        console.error('removeRecipient error:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// POST /api/notifications/test — manual trigger
exports.testSend = async (req, res) => {
    try {
        await checkExpiringHabilitations({ force: true });
        res.json({ message: 'Alertes envoyées avec succès' });
    } catch (error) {
        console.error('testSend error:', error);
        res.status(500).json({ message: 'Erreur lors de l\'envoi des alertes', detail: error.message });
    }
};

// GET /api/notifications/preview — habilitations qui déclencheraient une alerte
exports.getAlertPreview = async (req, res) => {
    try {
        const [rows] = await appDB.execute(
            `SELECT id, titre, nom, prenom, date_validite, visibilite, last_alert_sent, alert_expired_sent,
                DATEDIFF(date_validite, CURDATE()) AS jours_restants,
                CASE 
                    WHEN date_validite < CURDATE() THEN 'expire'
                    WHEN date_validite <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 'bientot'
                    ELSE 'valide'
                END AS statut
             FROM habilitations
             WHERE date_validite <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
             ORDER BY date_validite ASC`
        );
        res.json(rows);
    } catch (error) {
        console.error('getAlertPreview error:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

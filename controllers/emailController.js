const { appDB } = require('../config/db');
const { checkExpiringHabilitations, sendNotificationTest } = require('../utils/alertService');

// GET /api/notifications/recipients
exports.getRecipients = async (req, res) => {
    try {
        const [rows] = await appDB.execute('SELECT * FROM email_recipients ORDER BY created_at DESC');
        res.json(rows);
    } catch (error) {
        console.error('getRecipients error:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des destinataires.' });
    }
};

// POST /api/notifications/recipients
exports.addRecipient = async (req, res) => {
    const { email, name } = req.body;
    if (!email || !name) {
        return res.status(400).json({ message: 'Email et nom sont requis.' });
    }
    try {
        await appDB.execute('INSERT INTO email_recipients (email, name) VALUES (?, ?)', [email, name]);
        const [rows] = await appDB.execute('SELECT * FROM email_recipients WHERE email = ?', [email]);
        res.status(201).json(rows[0]);
    } catch (error) {
        console.error('addRecipient error:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Cet email est déjà enregistré.' });
        }
        res.status(500).json({ message: "Erreur lors de l'ajout du destinataire." });
    }
};

// DELETE /api/notifications/recipients/:id
exports.deleteRecipient = async (req, res) => {
    const { id } = req.params;
    try {
        await appDB.execute('DELETE FROM email_recipients WHERE id = ?', [id]);
        res.json({ message: 'Destinataire supprimé avec succès.' });
    } catch (error) {
        console.error('deleteRecipient error:', error);
        res.status(500).json({ message: 'Erreur lors de la suppression.' });
    }
};

// POST /api/notifications/run-check
exports.runNotificationCheck = async (req, res) => {
    try {
        const report = await checkExpiringHabilitations({ force: true });
        res.json({ message: 'Vérification lancée', report });
    } catch (error) {
        console.error('runNotificationCheck error:', error);
        res.status(500).json({ message: 'Erreur lors de la vérification', detail: error.message });
    }
};

// POST /api/notifications/test
exports.sendTestNotification = async (req, res) => {
    try {
        const result = await sendNotificationTest();
        res.json({ message: 'Test email exécuté', result });
    } catch (error) {
        console.error('sendTestNotification error:', error);
        res.status(500).json({ message: 'Erreur lors du test email', detail: error.message });
    }
};

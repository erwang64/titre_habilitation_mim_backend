const { appDB } = require('../config/db');

// Utility: create a log entry (called from other controllers)
exports.createLog = async ({ action, habilitation, raison, user }) => {
    await appDB.execute(
        `INSERT INTO action_logs (action, habilitation_id, habilitation_titre, habilitation_titulaire, raison, user_email, user_nom)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
            action,
            habilitation.id || null,
            habilitation.titre,
            `${habilitation.prenom} ${habilitation.nom}`,
            raison,
            user.email,
            `${user.prenom || ''} ${user.nom || ''}`.trim()
        ]
    );
};

// GET /api/logs — all logs, newest first
exports.getAll = async (req, res) => {
    try {
        const [rows] = await appDB.execute(
            `SELECT * FROM action_logs ORDER BY created_at DESC`
        );
        res.json(rows);
    } catch (error) {
        console.error('logs getAll error:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

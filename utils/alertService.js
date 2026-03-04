const nodemailer = require('nodemailer');
const { appDB } = require('../config/db');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || ''
    }
});

async function sendExpiryAlert(habilitation, daysLeft) {
    const to = process.env.ALERT_EMAIL || process.env.SMTP_USER;
    if (!to) return;

    const subject = daysLeft <= 0
        ? `⛔ Habilitation EXPIRÉE — ${habilitation.prenom} ${habilitation.nom}`
        : `⚠️ Habilitation expire dans ${daysLeft} jour(s) — ${habilitation.prenom} ${habilitation.nom}`;

    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #FF9900; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="color: white; margin: 0;">Alerte Habilitation — MIM Foselev</h2>
        </div>
        <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #ddd;">
            <p><strong>Titre :</strong> ${habilitation.titre}</p>
            <p><strong>Nom :</strong> ${habilitation.prenom} ${habilitation.nom}</p>
            <p><strong>Date de validité :</strong> ${new Date(habilitation.date_validite).toLocaleDateString('fr-FR')}</p>
            <p style="color: ${daysLeft <= 0 ? '#dc2626' : '#d97706'}; font-weight: bold;">
                ${daysLeft <= 0 ? 'Cette habilitation est EXPIRÉE.' : `Cette habilitation expire dans ${daysLeft} jour(s).`}
            </p>
            ${habilitation.public_url ? `<p><a href="${habilitation.public_url}" style="color: #FF9900;">Voir le document</a></p>` : ''}
        </div>
    </div>`;

    await transporter.sendMail({
        from: `"MIM Habilitations" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html
    });
}

exports.checkExpiringHabilitations = async () => {
    try {
        // Fetch expiring in 30 days or already expired (send once per check cycle)
        const [rows] = await appDB.execute(
            `SELECT * FROM habilitations 
             WHERE date_validite <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
             AND (last_alert_sent IS NULL OR last_alert_sent < CURDATE())`
        );

        for (const hab of rows) {
            const validite = new Date(hab.date_validite);
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            const daysLeft = Math.ceil((validite - now) / (1000 * 60 * 60 * 24));

            try {
                await sendExpiryAlert(hab, daysLeft);
                await appDB.execute(
                    'UPDATE habilitations SET last_alert_sent = CURDATE() WHERE id = ?',
                    [hab.id]
                );
                console.log(`[ALERT] Alerte envoyée pour: ${hab.prenom} ${hab.nom} (${daysLeft} jours)`);
            } catch (err) {
                console.error(`[ALERT] Erreur envoi alerte pour ${hab.id}:`, err.message);
            }
        }

        console.log(`[ALERT] ${rows.length} alerte(s) traitée(s).`);
    } catch (error) {
        console.error('[ALERT] Erreur vérification habilitations:', error);
    }
};

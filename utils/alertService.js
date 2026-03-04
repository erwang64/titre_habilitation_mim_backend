const nodemailer = require('nodemailer');
const { appDB } = require('../config/db');

// ── Gmail transporter ──────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASS || ''
    }
});

// ── HTML email templates ───────────────────────────────────────────────────────
function buildEmailHtml(habilitation, daysLeft, recipientName) {
    const isExpired = daysLeft <= 0;
    const accentColor   = isExpired ? '#dc2626' : '#f97316';
    const bgBadge       = isExpired ? '#fef2f2' : '#fff7ed';
    const borderBadge   = isExpired ? '#fecaca' : '#fed7aa';
    const badgeLabel    = isExpired
        ? `⛔ EXPIRÉE depuis ${Math.abs(daysLeft)} jour${Math.abs(daysLeft) > 1 ? 's' : ''}`
        : `⚠️ Expire dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''}`;
    const statusMessage = isExpired
        ? `Le titre d'habilitation de <strong>${habilitation.prenom} ${habilitation.nom}</strong> est arrivé à échéance. Veuillez procéder au renouvellement dès que possible.`
        : `Le titre d'habilitation de <strong>${habilitation.prenom} ${habilitation.nom}</strong> expire dans <strong>${daysLeft} jour${daysLeft > 1 ? 's' : ''}</strong>. Pensez à anticiper son renouvellement.`;
    const validiteStr = new Date(habilitation.date_validite).toLocaleDateString('fr-FR', {
        day: '2-digit', month: 'long', year: 'numeric'
    });

    return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#ea580c 0%,#f97316 60%,#fb923c 100%);padding:32px 36px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <p style="margin:0 0 4px 0;font-size:11px;font-weight:700;letter-spacing:2px;color:rgba(255,255,255,0.75);text-transform:uppercase;">MIM Foselev</p>
                  <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;line-height:1.3;">
                    ${isExpired ? '⛔ Titre d\'Habilitation Expiré' : '⚠️ Titre d\'Habilitation — Alerte Expiration'}
                  </h1>
                </td>
                <td align="right" style="padding-left:16px;">
                  <div style="background:rgba(255,255,255,0.2);border-radius:50%;width:52px;height:52px;display:inline-flex;align-items:center;justify-content:center;font-size:26px;line-height:52px;text-align:center;">
                    ${isExpired ? '🔴' : '🟠'}
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Status badge -->
        <tr>
          <td style="padding:0 36px;">
            <div style="margin-top:-1px;background:${bgBadge};border:1.5px solid ${borderBadge};border-radius:0 0 10px 10px;padding:12px 20px;text-align:center;">
              <span style="font-size:15px;font-weight:700;color:${accentColor};">${badgeLabel}</span>
            </div>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:28px 36px 0 36px;">
            <p style="margin:0 0 20px 0;font-size:15px;color:#374151;line-height:1.6;">
              Bonjour ${recipientName ? `<strong>${recipientName}</strong>` : ''},
            </p>
            <p style="margin:0 0 24px 0;font-size:15px;color:#374151;line-height:1.6;">${statusMessage}</p>
          </td>
        </tr>

        <!-- Card details -->
        <tr>
          <td style="padding:0 36px 28px 36px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
              <tr style="border-bottom:1px solid #e5e7eb;">
                <td style="padding:14px 20px;font-size:13px;font-weight:600;color:#6b7280;width:140px;">Titre</td>
                <td style="padding:14px 20px;font-size:14px;font-weight:700;color:#111827;">${habilitation.titre}</td>
              </tr>
              <tr style="border-bottom:1px solid #e5e7eb;">
                <td style="padding:14px 20px;font-size:13px;font-weight:600;color:#6b7280;">Titulaire</td>
                <td style="padding:14px 20px;font-size:14px;color:#111827;">${habilitation.prenom} ${habilitation.nom}</td>
              </tr>
              <tr>
                <td style="padding:14px 20px;font-size:13px;font-weight:600;color:#6b7280;">Date de validité</td>
                <td style="padding:14px 20px;font-size:14px;font-weight:700;color:${accentColor};">${validiteStr}</td>
              </tr>
            </table>
          </td>
        </tr>

        ${habilitation.public_url ? `
        <!-- CTA Button -->
        <tr>
          <td style="padding:0 36px 32px 36px;text-align:center;">
            <a href="${habilitation.public_url}"
               style="display:inline-block;background:linear-gradient(135deg,#ea580c,#f97316);color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 32px;border-radius:10px;box-shadow:0 4px 12px rgba(249,115,22,0.35);">
              Voir le document
            </a>
          </td>
        </tr>` : ''}

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 36px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
              Cet email a été envoyé automatiquement par le système <strong style="color:#f97316;">MIM Foselev — Titres d'Habilitation</strong>.<br>
              Pour gérer les destinataires, connectez-vous à l'application.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Send to all DB recipients ──────────────────────────────────────────────────
async function sendAlertToAll(habilitation, daysLeft) {
    const senderEmail = process.env.EMAIL_USER;
    if (!senderEmail) {
        console.warn('[ALERT] EMAIL_USER non configuré, envoi ignoré.');
        return;
    }

    const [recipients] = await appDB.execute('SELECT * FROM email_recipients');
    if (recipients.length === 0) {
        console.log('[ALERT] Aucun destinataire configuré.');
        return;
    }

    const isExpired = daysLeft <= 0;
    const subject = isExpired
        ? `⛔ Titre expiré — ${habilitation.titre} (${habilitation.prenom} ${habilitation.nom})`
        : `⚠️ Expiration dans ${daysLeft}j — ${habilitation.titre} (${habilitation.prenom} ${habilitation.nom})`;

    for (const recipient of recipients) {
        try {
            await transporter.sendMail({
                from: `"MIM Habilitations" <${senderEmail}>`,
                to: recipient.email,
                subject,
                html: buildEmailHtml(habilitation, daysLeft, recipient.name || '')
            });
            console.log(`[ALERT] Email envoyé à ${recipient.email} pour "${habilitation.titre}"`);
        } catch (err) {
            console.error(`[ALERT] Échec envoi à ${recipient.email}:`, err.message);
        }
    }
}

// ── Daily cron check ───────────────────────────────────────────────────────────
exports.checkExpiringHabilitations = async () => {
    try {
        // Fetch all habilitations expiring within 30 days (not yet alerted)
        const [bientotRows] = await appDB.execute(
            `SELECT * FROM habilitations
             WHERE date_validite > CURDATE()
               AND date_validite <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
               AND (alert_bientot_sent IS NULL OR alert_bientot_sent < DATE_SUB(CURDATE(), INTERVAL 7 DAY))`
        );

        for (const hab of bientotRows) {
            const daysLeft = Math.ceil((new Date(hab.date_validite) - new Date().setHours(0,0,0,0)) / 86400000);
            try {
                await sendAlertToAll(hab, daysLeft);
                await appDB.execute('UPDATE habilitations SET alert_bientot_sent = CURDATE() WHERE id = ?', [hab.id]);
            } catch (err) {
                console.error(`[ALERT] Erreur traitement habilitation ${hab.id}:`, err.message);
            }
        }

        // Fetch all expired habilitations not yet alerted as "expired"
        const [expiredRows] = await appDB.execute(
            `SELECT * FROM habilitations
             WHERE date_validite < CURDATE()
               AND (alert_expired_sent IS NULL OR alert_expired_sent < DATE_SUB(CURDATE(), INTERVAL 30 DAY))`
        );

        for (const hab of expiredRows) {
            const daysLeft = Math.ceil((new Date(hab.date_validite) - new Date().setHours(0,0,0,0)) / 86400000);
            try {
                await sendAlertToAll(hab, daysLeft);
                await appDB.execute('UPDATE habilitations SET alert_expired_sent = CURDATE() WHERE id = ?', [hab.id]);
            } catch (err) {
                console.error(`[ALERT] Erreur traitement habilitation expirée ${hab.id}:`, err.message);
            }
        }

        const total = bientotRows.length + expiredRows.length;
        console.log(`[ALERT] Vérification terminée — ${bientotRows.length} bientôt expiré(s), ${expiredRows.length} expiré(s).`);
    } catch (error) {
        console.error('[ALERT] Erreur vérification habilitations:', error);
    }
};

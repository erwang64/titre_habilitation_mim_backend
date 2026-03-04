const nodemailer = require('nodemailer');
const path = require('path');
const { appDB } = require('../config/db');

// ── Gmail transporter ──────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASS || ''
    }
});

const logoPath = path.join(__dirname, '../assets/logo_MIM.png');
const rawFrontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
const FRONTEND_URL = rawFrontendUrl.replace(/\/+$/, '').replace(/(https?:\/\/[^/]+).*/, '$1');

// ── HTML email templates ───────────────────────────────────────────────────────
function buildEmailHtml(habilitation, daysLeft, recipientName, documentUrl) {
    const isExpired = daysLeft <= 0;
    const accentColor = isExpired ? '#dc2626' : '#f97316';
    const accentLight = isExpired ? '#fef2f2' : '#fff7ed';
    const accentBorder = isExpired ? '#fecaca' : '#fed7aa';
    const badgeLabel = isExpired
        ? `EXPIRÉE depuis ${Math.abs(daysLeft)} jour${Math.abs(daysLeft) > 1 ? 's' : ''}`
        : `Expire dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''}`;
    const statusMessage = isExpired
        ? `Le titre d'habilitation de <strong>${habilitation.prenom} ${habilitation.nom}</strong> est arrivé à échéance. Veuillez procéder au renouvellement dès que possible.`
        : `Le titre d'habilitation de <strong>${habilitation.prenom} ${habilitation.nom}</strong> expire dans <strong>${daysLeft} jour${daysLeft > 1 ? 's' : ''}</strong>. Pensez à anticiper son renouvellement.`;
    const validiteStr = new Date(habilitation.date_validite).toLocaleDateString('fr-FR', {
        day: '2-digit', month: 'long', year: 'numeric'
    });

    return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Arial',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;">

        <!-- Header with logo -->
        <tr>
          <td style="background:#ffffff;padding:24px 36px;text-align:center;border-bottom:3px solid #f97316;">
            <img src="cid:logo_mim" alt="MIM Foselev" style="max-width:80px;height:auto;" />
          </td>
        </tr>

        <!-- Title -->
        <tr>
          <td style="padding:28px 36px 0 36px;">
            <h2 style="margin:0;color:#c2410c;font-size:20px;font-weight:bold;border-left:4px solid #f97316;padding-left:12px;">
              ${isExpired ? 'Titre d\'Habilitation Expiré' : 'Alerte — Expiration Prochaine'}
            </h2>
          </td>
        </tr>

        <!-- Status badge -->
        <tr>
          <td style="padding:20px 36px 0 36px;">
            <div style="background:${accentLight};border:1.5px solid ${accentBorder};border-radius:8px;padding:14px 20px;text-align:center;">
              <span style="font-size:15px;font-weight:700;color:${accentColor};letter-spacing:0.3px;">
                ${isExpired ? '⛔' : '⚠️'} ${badgeLabel}
              </span>
            </div>
          </td>
        </tr>

        <!-- Body text -->
        <tr>
          <td style="padding:24px 36px 0 36px;">
            <p style="margin:0 0 16px 0;font-size:14px;color:#333;line-height:1.6;">
              Bonjour${recipientName ? ` <strong>${recipientName}</strong>` : ''},
            </p>
            <p style="margin:0 0 24px 0;font-size:14px;color:#333;line-height:1.6;">
              ${statusMessage}
            </p>
          </td>
        </tr>

        <!-- Details card -->
        <tr>
          <td style="padding:0 36px 24px 36px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f8f8;border:1px solid #eee;border-radius:6px;overflow:hidden;">
              <tr style="border-bottom:1px solid #eee;">
                <td style="padding:14px 20px;font-size:12px;font-weight:bold;color:#777;text-transform:uppercase;letter-spacing:0.5px;width:140px;">Titre</td>
                <td style="padding:14px 20px;font-size:14px;font-weight:700;color:#333;">${habilitation.titre}</td>
              </tr>
              <tr style="border-bottom:1px solid #eee;">
                <td style="padding:14px 20px;font-size:12px;font-weight:bold;color:#777;text-transform:uppercase;letter-spacing:0.5px;">Titulaire</td>
                <td style="padding:14px 20px;font-size:14px;font-weight:500;color:#333;">${habilitation.prenom} ${habilitation.nom}</td>
              </tr>
              <tr>
                <td style="padding:14px 20px;font-size:12px;font-weight:bold;color:#777;text-transform:uppercase;letter-spacing:0.5px;">Date de validité</td>
                <td style="padding:14px 20px;font-size:14px;font-weight:700;color:${accentColor};">${validiteStr}</td>
              </tr>
            </table>
          </td>
        </tr>

        ${documentUrl ? `
        <!-- CTA Button -->
        <tr>
          <td style="padding:0 36px 32px 36px;text-align:center;">
            <a href="${documentUrl}"
               style="display:inline-block;background-color:#f97316;color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;padding:12px 24px;border-radius:6px;">
              Voir le document
            </a>
          </td>
        </tr>` : ''}

        <!-- Footer -->
        <tr>
          <td style="background:#f8f8f8;border-top:1px solid #eee;padding:16px 36px;text-align:center;">
            <p style="margin:0;font-size:11px;color:#999;line-height:1.6;">
              Notification automatique — <strong style="color:#f97316;">MIM Foselev — Titres d'Habilitation</strong><br>
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
    return { sent: 0, failed: 0, skippedReason: 'EMAIL_USER non configuré' };
    }

    const [recipients] = await appDB.execute('SELECT * FROM email_recipients');
    if (recipients.length === 0) {
        console.log('[ALERT] Aucun destinataire configuré.');
    return { sent: 0, failed: 0, skippedReason: 'Aucun destinataire configuré' };
    }

    const isExpired = daysLeft <= 0;
    const subject = isExpired
        ? `⛔ Titre expiré — ${habilitation.titre} (${habilitation.prenom} ${habilitation.nom})`
        : `⚠️ Expiration dans ${daysLeft}j — ${habilitation.titre} (${habilitation.prenom} ${habilitation.nom})`;

    let sent = 0;
    let failed = 0;

    for (const recipient of recipients) {
        try {
        const managementUrl = `${FRONTEND_URL}/gestion/${habilitation.id}`;
            await transporter.sendMail({
                from: `"MIM Habilitations" <${senderEmail}>`,
                to: recipient.email,
                subject,
          html: buildEmailHtml(habilitation, daysLeft, recipient.name || '', managementUrl),
                attachments: [
                    {
                        filename: 'logo_MIM.png',
                        path: logoPath,
                        cid: 'logo_mim'
                    }
                ]
            });
        sent += 1;
            console.log(`[ALERT] Email envoyé à ${recipient.email} pour "${habilitation.titre}"`);
        } catch (err) {
        failed += 1;
            console.error(`[ALERT] Échec envoi à ${recipient.email}:`, err.message);
        }
    }

    return { sent, failed, skippedReason: null };
}

// ── Daily cron check ───────────────────────────────────────────────────────────
  exports.checkExpiringHabilitations = async (options = {}) => {
    const force = !!options.force;
    const report = {
      bientotCandidates: 0,
      expiredCandidates: 0,
      mailsSent: 0,
      mailsFailed: 0,
      skipped: [],
      errors: []
    };

    try {
        // Fetch all habilitations expiring within 30 days (not yet alerted)
      const bientotFilter = force
        ? ''
        : 'AND (alert_bientot_sent IS NULL OR alert_bientot_sent < DATE_SUB(CURDATE(), INTERVAL 7 DAY))';

        const [bientotRows] = await appDB.execute(
            `SELECT * FROM habilitations
             WHERE date_validite > CURDATE()
               AND date_validite <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
           ${bientotFilter}`
        );
      report.bientotCandidates = bientotRows.length;

        for (const hab of bientotRows) {
            const daysLeft = Math.ceil((new Date(hab.date_validite) - new Date().setHours(0,0,0,0)) / 86400000);
            try {
          const sendResult = await sendAlertToAll(hab, daysLeft);
          report.mailsSent += sendResult.sent;
          report.mailsFailed += sendResult.failed;
          if (sendResult.skippedReason) {
            report.skipped.push({ id: hab.id, type: 'bientot', reason: sendResult.skippedReason });
          }
          if (sendResult.sent > 0) {
            await appDB.execute('UPDATE habilitations SET alert_bientot_sent = CURDATE() WHERE id = ?', [hab.id]);
          }
            } catch (err) {
          report.errors.push({ id: hab.id, type: 'bientot', message: err.message });
                console.error(`[ALERT] Erreur traitement habilitation ${hab.id}:`, err.message);
            }
        }

        // Fetch all expired habilitations not yet alerted as "expired"
      const expiredFilter = force
        ? ''
        : 'AND (alert_expired_sent IS NULL OR alert_expired_sent < DATE_SUB(CURDATE(), INTERVAL 30 DAY))';

        const [expiredRows] = await appDB.execute(
            `SELECT * FROM habilitations
             WHERE date_validite < CURDATE()
           ${expiredFilter}`
        );
      report.expiredCandidates = expiredRows.length;

        for (const hab of expiredRows) {
            const daysLeft = Math.ceil((new Date(hab.date_validite) - new Date().setHours(0,0,0,0)) / 86400000);
            try {
          const sendResult = await sendAlertToAll(hab, daysLeft);
          report.mailsSent += sendResult.sent;
          report.mailsFailed += sendResult.failed;
          if (sendResult.skippedReason) {
            report.skipped.push({ id: hab.id, type: 'expired', reason: sendResult.skippedReason });
          }
          if (sendResult.sent > 0) {
            await appDB.execute('UPDATE habilitations SET alert_expired_sent = CURDATE() WHERE id = ?', [hab.id]);
          }
            } catch (err) {
          report.errors.push({ id: hab.id, type: 'expired', message: err.message });
                console.error(`[ALERT] Erreur traitement habilitation expirée ${hab.id}:`, err.message);
            }
        }

        console.log(`[ALERT] Vérification terminée — ${bientotRows.length} bientôt expiré(s), ${expiredRows.length} expiré(s).`);
      return report;
    } catch (error) {
        console.error('[ALERT] Erreur vérification habilitations:', error);
      report.errors.push({ id: null, type: 'global', message: error.message });
      return report;
    }
};

  exports.sendNotificationTest = async () => {
    const [rows] = await appDB.execute(
      `SELECT * FROM habilitations ORDER BY date_validite ASC LIMIT 1`
    );

    if (rows.length === 0) {
      return {
        mailsSent: 0,
        mailsFailed: 0,
        skipped: [{ reason: 'Aucune habilitation disponible pour test' }]
      };
    }

    const hab = rows[0];
    const daysLeft = Math.ceil((new Date(hab.date_validite) - new Date().setHours(0, 0, 0, 0)) / 86400000);
    const sendResult = await sendAlertToAll(hab, daysLeft);

    return {
      mailsSent: sendResult.sent,
      mailsFailed: sendResult.failed,
      skipped: sendResult.skippedReason ? [{ reason: sendResult.skippedReason }] : [],
      testHabilitation: {
        id: hab.id,
        titre: hab.titre,
        titulaire: `${hab.prenom} ${hab.nom}`,
        date_validite: hab.date_validite
      }
    };
  };

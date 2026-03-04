-- ============================================================
-- 005_notifications_upgrade.sql
-- Ajoute la colonne name aux destinataires
-- + colonne alert_bientot_sent pour tracker l'alerte "bientôt"
-- ============================================================

USE MIM_Habilitations;

-- Ajout colonne name dans email_recipients (si absente)
SET @col1 = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = 'MIM_Habilitations'
      AND TABLE_NAME   = 'email_recipients'
      AND COLUMN_NAME  = 'name'
);
SET @sql1 = IF(
    @col1 = 0,
    'ALTER TABLE email_recipients ADD COLUMN name VARCHAR(255) NOT NULL DEFAULT '''' AFTER id',
    'SELECT ''Column name already exists, skipping.'''
);
PREPARE stmt1 FROM @sql1;
EXECUTE stmt1;
DEALLOCATE PREPARE stmt1;

-- Ajout colonne alert_bientot_sent dans habilitations (si absente)
SET @col2 = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = 'MIM_Habilitations'
      AND TABLE_NAME   = 'habilitations'
      AND COLUMN_NAME  = 'alert_bientot_sent'
);
SET @sql2 = IF(
    @col2 = 0,
    'ALTER TABLE habilitations ADD COLUMN alert_bientot_sent DATE DEFAULT NULL',
    'SELECT ''Column alert_bientot_sent already exists, skipping.'''
);
PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

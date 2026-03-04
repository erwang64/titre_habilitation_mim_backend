-- ============================================================
-- 004_email_recipients.sql
-- Table des destinataires d'alertes email
-- + colonne alert_expired_sent pour suivre l'alerte "expiré"
-- ============================================================

USE MIM_Habilitations;

-- Table email_recipients
CREATE TABLE IF NOT EXISTS email_recipients (
    id         INT          NOT NULL AUTO_INCREMENT,
    email      VARCHAR(255) NOT NULL UNIQUE,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Colonne pour tracker l'alerte "expiré" séparément de "bientôt"
SET @col_exists = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = 'MIM_Habilitations'
      AND TABLE_NAME   = 'habilitations'
      AND COLUMN_NAME  = 'alert_expired_sent'
);

SET @sql = IF(
    @col_exists = 0,
    'ALTER TABLE habilitations ADD COLUMN alert_expired_sent DATE DEFAULT NULL COMMENT ''Date d''''envoi de l''''alerte expiration définitive''',
    'SELECT ''Column alert_expired_sent already exists, skipping.'''
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

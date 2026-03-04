-- ============================================================
-- 003_add_alert_column.sql
-- Ajoute la colonne last_alert_sent si elle est manquante
-- (utile si la table a été créée avant cette colonne)
-- ============================================================

USE MIM_Habilitations;

SET @col_exists = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = 'MIM_Habilitations'
      AND TABLE_NAME   = 'habilitations'
      AND COLUMN_NAME  = 'last_alert_sent'
);

SET @sql = IF(
    @col_exists = 0,
    'ALTER TABLE habilitations ADD COLUMN last_alert_sent DATE DEFAULT NULL COMMENT ''Date du dernier envoi d''''alerte email''',
    'SELECT ''Column last_alert_sent already exists, skipping.'''
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================
-- 003_add_alert_column.sql
-- Ajoute la colonne last_alert_sent si elle est manquante
-- (utile si la table a été créée avant cette colonne)
-- ============================================================

USE MIM_Habilitations;

ALTER TABLE habilitations
    ADD COLUMN IF NOT EXISTS last_alert_sent DATE DEFAULT NULL
        COMMENT 'Date du dernier envoi d\'alerte email';

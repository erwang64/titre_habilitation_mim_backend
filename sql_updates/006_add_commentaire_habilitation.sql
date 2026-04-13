-- ============================================================
-- 006_add_commentaire_habilitation.sql
-- Ajoute une colonne commentaire sur les habilitations
-- ============================================================

USE MIM_Habilitations;

SET @col = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = 'MIM_Habilitations'
      AND TABLE_NAME   = 'habilitations'
      AND COLUMN_NAME  = 'commentaire'
);

SET @sql = IF(
    @col = 0,
    'ALTER TABLE habilitations ADD COLUMN commentaire TEXT DEFAULT NULL COMMENT ''Commentaire interne (ex: manque signature, photo manquante)'' AFTER visibilite',
    'SELECT ''Column commentaire already exists, skipping.'''
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

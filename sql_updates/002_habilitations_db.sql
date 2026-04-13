-- ============================================================
-- 002_habilitations_db.sql
-- Base de données principale : MIM_Habilitations
-- Contient les titres d'habilitation, fichiers PDF et métadonnées
-- ============================================================

CREATE DATABASE IF NOT EXISTS MIM_Habilitations
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE MIM_Habilitations;

-- Table principale des habilitations
CREATE TABLE IF NOT EXISTS habilitations (
    id              INT             NOT NULL AUTO_INCREMENT,
    titre           VARCHAR(255)    NOT NULL                    COMMENT 'Titre de l\'habilitation (ex: CACES R489)',
    nom             VARCHAR(100)    NOT NULL                    COMMENT 'Nom du titulaire',
    prenom          VARCHAR(100)    NOT NULL                    COMMENT 'Prénom du titulaire',
    fichier_path    VARCHAR(500)    NOT NULL                    COMMENT 'Nom du fichier sur le volume (UUID.pdf)',
    fichier_nom     VARCHAR(500)    NOT NULL                    COMMENT 'Nom original du fichier PDF',
    date_validite   DATE            NOT NULL                    COMMENT 'Date d\'expiration de l\'habilitation',
    visibilite      ENUM('public','prive') NOT NULL DEFAULT 'prive'
                                                                COMMENT 'public = accès sans login | prive = login requis',
    commentaire     TEXT            DEFAULT NULL                COMMENT 'Commentaire interne (ex: manque signature, photo manquante)',
    public_token    VARCHAR(36)     NOT NULL UNIQUE             COMMENT 'UUID pour l\'URL publique',
    public_url      VARCHAR(1000)   DEFAULT NULL                COMMENT 'URL complète de la page publique',
    qr_code         MEDIUMTEXT      DEFAULT NULL                COMMENT 'QR code en base64 (data:image/png;base64,...)',
    last_alert_sent DATE            DEFAULT NULL                COMMENT 'Date du dernier envoi d\'alerte',
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_date_validite (date_validite),
    INDEX idx_public_token (public_token),
    INDEX idx_visibilite (visibilite)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

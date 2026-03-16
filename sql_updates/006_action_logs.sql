-- ============================================================
-- 006_action_logs.sql
-- Table des logs d'actions (suppression, régénération QR)
-- ============================================================

USE MIM_Habilitations;

CREATE TABLE IF NOT EXISTS action_logs (
    id                      INT             NOT NULL AUTO_INCREMENT,
    action                  ENUM('suppression', 'regeneration_qr') NOT NULL
                                                                    COMMENT 'Type d''action effectuée',
    habilitation_id         INT             DEFAULT NULL            COMMENT 'ID de l''habilitation (NULL si supprimée)',
    habilitation_titre      VARCHAR(255)    NOT NULL                COMMENT 'Titre de l''habilitation au moment de l''action',
    habilitation_titulaire  VARCHAR(200)    NOT NULL                COMMENT 'Nom complet du titulaire',
    raison                  TEXT            NOT NULL                COMMENT 'Motif obligatoire saisi par l''utilisateur',
    user_email              VARCHAR(255)    NOT NULL                COMMENT 'Email de l''utilisateur ayant effectué l''action',
    user_nom                VARCHAR(200)    NOT NULL                COMMENT 'Nom complet de l''utilisateur',
    created_at              DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at),
    INDEX idx_habilitation_id (habilitation_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

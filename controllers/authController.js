const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { authDB } = require('../config/db');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_mim_habilitation_2026';

async function verifyPassword(password, storedHash) {
    if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$')) {
        return bcrypt.compare(password, storedHash);
    }
    // SHA256 hex (C# format used in MIM_Logiciel)
    const sha256Hash = crypto.createHash('sha256').update(password).digest('hex');
    return sha256Hash.toLowerCase() === storedHash.toLowerCase();
}

exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const [rows] = await authDB.execute(
            'SELECT * FROM Utilisateurs WHERE Email = ?',
            [email]
        );

        if (rows.length === 0) {
            return res.status(401).json({ message: 'Identifiants invalides' });
        }

        const user = rows[0];
        const validPassword = await verifyPassword(password, user.MotDePasseHashe);

        if (!validPassword) {
            return res.status(401).json({ message: 'Identifiants invalides' });
        }

        const token = jwt.sign(
            { id: user.IdUtilisateur, role: user.Role, email: user.Email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.IdUtilisateur,
                nom: user.Nom,
                prenom: user.Prenom,
                email: user.Email,
                role: user.Role
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la connexion' });
    }
};

exports.me = async (req, res) => {
    try {
        const [rows] = await authDB.execute(
            'SELECT IdUtilisateur, Nom, Prenom, Email, Role FROM Utilisateurs WHERE IdUtilisateur = ?',
            [req.user.id]
        );
        if (rows.length === 0) return res.status(404).json({ message: 'Utilisateur non trouvé' });
        const u = rows[0];
        res.json({ id: u.IdUtilisateur, nom: u.Nom, prenom: u.Prenom, email: u.Email, role: u.Role });
    } catch (error) {
        console.error('Me error:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

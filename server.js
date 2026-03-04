const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const apiRoutes = require('./routes/api');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');
const { checkExpiringHabilitations } = require('./utils/alertService');

// Ensure uploads directory exists
const uploadsDir = process.env.UPLOADS_PATH || path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
const rawFrontendUrl = process.env.FRONTEND_URL;
const allowedOrigin = rawFrontendUrl
    ? rawFrontendUrl.replace(/\/+$/, '').replace(/(https?:\/\/[^/]+).*/, '$1')
    : '*';

app.use(cors({
    origin: allowedOrigin,
    credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api', apiRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'Bienvenue sur l\'API Titres d\'Habilitation MIM Foselev' });
});

// Cron job: check expiring habilitations every day at 08:00
cron.schedule('0 8 * * *', async () => {
    console.log('[CRON] Vérification des habilitations expirantes...');
    await checkExpiringHabilitations();
});

app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// 1. L'Imports kollhom f l'wjeh
const authRoutes = require('./routes/auth');
const panneauRoutes = require('./routes/panneaux');
const detectRoutes = require('./routes/detect');
const userRoutes = require('./routes/users');
const maintenanceRoutes = require('./routes/maintenance');
const reportRoutes = require('./routes/reports');
const app = express();
const chatRoutes = require('./routes/chat');

// 2. Les Middlewares (Cors w JSON)
app.use(cors());
app.use(express.json());

// 3. L'Dossier dyal l'tsawir (Static)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 4. Les Routes kollhom
app.use('/api/auth', authRoutes);
app.use('/api/panneaux', panneauRoutes);
app.use('/api/detect', detectRoutes);
app.use('/api/users', userRoutes);         // <-- Route dyal l'Users (mrat wa7da)
app.use('/api/maintenance', maintenanceRoutes); // <-- Route dyal l'Maintenance
app.use('/api/reports', reportRoutes);
app.use('/api/chat', chatRoutes);
// 5. Ch3el l'serveur
app.listen(process.env.PORT, () =>
  console.log(`Server running on port ${process.env.PORT}`)
);
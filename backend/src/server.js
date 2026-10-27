const express = require('express');
const cors = require('cors');
const path = require('path'); // <-- Zid hada
require('dotenv').config();

const authRoutes = require('./routes/auth');
const panneauRoutes = require('./routes/panneaux');
const detectRoutes = require('./routes/detect');

const app = express();
app.use(cors());
app.use(express.json());

// Zid hada bach l'tsawir tban f l'navigateur
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/panneaux', panneauRoutes);
app.use('/api/detect', detectRoutes);

app.listen(process.env.PORT, () =>
  console.log(`Server running on port ${process.env.PORT}`)
);
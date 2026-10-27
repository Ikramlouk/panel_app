const router = require('express').Router();
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const auth = require('../middleware/auth');

const upload = multer({ storage: multer.memoryStorage() });

router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Ma kaynach tswira' });

    const formData = new FormData();
    formData.append('file', req.file.buffer, req.file.originalname);

    const yoloResponse = await axios.post('http://localhost:8000/detect', formData, {
      headers: { ...formData.getHeaders() }
    });

    const detections = yoloResponse.data.detections;
    res.json({ success: true, detections });

  } catch (error) {
    console.error("Erreur Backend:", error.message);
    res.status(500).json({ error: 'Mochkil f l\'connexion m3a l\'IA' });
  }
});

module.exports = router;
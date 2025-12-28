const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/detect-pothole', upload.single('image'), async (req, res) => {
  try {
    const formData = new FormData();
    formData.append(
      'image',
      fs.createReadStream(req.file.path)
    );

    const aiRes = await axios.post(
      'http://127.0.0.1:8000/detect',
      formData,
      { headers: formData.getHeaders() }
    );

    fs.unlinkSync(req.file.path);

    res.json(aiRes.data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'AI detection failed' });
  }
});

router.post('/generate-text', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ message: 'Prompt is required' });
    }

    const geminiRes = await axios.post(
      'http://127.0.0.1:8001/generate',
      { prompt }
    );

    res.json(geminiRes.data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gemini text generation failed' });
  }
});

module.exports = router;

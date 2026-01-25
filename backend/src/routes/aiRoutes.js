const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const router = express.Router();
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

<<<<<<< Updated upstream
=======
const AI_SERVICE_URL = process.env.AI_SERVICE_URL;
const OPENROUTER_API_URL = process.env.OPENROUTER_API_URL;

if (!AI_SERVICE_URL) {
  console.error('ERROR: AI_SERVICE_URL environment variable is not set');
}
if (!OPENROUTER_API_URL) {
  console.error('ERROR: OPENROUTER_API_URL environment variable is not set');
}

console.log('AI_SERVICE_URL:', AI_SERVICE_URL);
console.log('OPENROUTER_API_URL:', OPENROUTER_API_URL);

>>>>>>> Stashed changes
router.post('/detect-pothole', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      console.error('❌ No file received in request');
      console.error('Headers:', req.headers);
      console.error('Body:', req.body);
      return res.status(400).json({ 
        message: 'No image file provided',
        details: 'Ensure Content-Type is multipart/form-data and image field name is "image"'
      });
    }

    console.log('✓ File received:', req.file.filename, 'Size:', req.file.size, 'bytes');

    const formData = new FormData();
    const stream = fs.createReadStream(req.file.path);
    formData.append('image', stream, { filename: req.file.originalname });

    console.log('→ Sending to AI service:', `${AI_SERVICE_URL}/detect`);

    const aiRes = await axios.post(
      'http://127.0.0.1:8000/detect',
      formData,
      { 
        headers: formData.getHeaders(),
        timeout: 30000,
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );

    console.log('✓ AI response received:', aiRes.status);
    console.log('AI response data:', aiRes.data);
    
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.json(aiRes.data);
  } catch (err) {
    console.error('❌ AI detection error:', err.message);
    if (err.response?.data) {
      console.error('AI Service Response:', err.response.data);
    }
    console.error('Error code:', err.code);
    
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        console.error('Failed to delete temp file:', e.message);
      }
    }
    
    res.status(500).json({ 
      message: 'AI detection failed',
      error: err.message,
      code: err.code,
      aiServiceUrl: AI_SERVICE_URL
    });
  }
});

module.exports = router;

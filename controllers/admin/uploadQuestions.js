const express = require('express');
const fs = require('fs');
const path = require('path');




// Soruları JSON dosyasına yükleme
exports.uploadQuestions = async (req, res) => {
  try {
    const { questions } = req.body;

    if (!questions || !Array.isArray(questions)) {
      return res.status(400).json({ error: 'Invalid questions data' });
    }

    
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // upload.json dosyasına yaz
    const uploadPath = path.join(uploadsDir, 'upload.json');
    fs.writeFileSync(uploadPath, JSON.stringify(questions, null, 2), 'utf8');

    console.log(`✅ ${questions.length} soru upload.json dosyasına kaydedildi`);

    res.status(200).json({
      success: true,
      message: `${questions.length} soru başarıyla kaydedildi`,
      filePath: 'uploads/upload.json',
      questionCount: questions.length
    });

  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({
      error: 'Upload failed',
      message: error.message
    });
  }
};
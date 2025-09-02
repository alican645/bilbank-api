const Question = require('../../db/models/Question');
const { HTTP_CODES } = require('../../config/Enum'); // kendi yapına göre

exports.bulkInsertQuestions = async (req, res) => {
  const questionList = req.body;

  if (!Array.isArray(questionList) || questionList.length === 0) {
    return res.status(HTTP_CODES.BAD_REQUEST).json({
      message: 'Geçerli bir soru listesi gönderilmedi.',
    });
  }

  try {
    const insertData = questionList.map((item) => ({
      question: item.question,
      answer: item.answer,
      multiplier: item.multiplier ?? 1, // varsayılan 1
    }));

    const result = await Question.insertMany(insertData, { ordered: false });

    return res.status(HTTP_CODES.CREATED).json({
      insertedCount: result.length,
      message: 'Sorular başarıyla yüklendi.',
    });
  } catch (error) {
    console.error('Soru ekleme hatası:', error);
    return res.status(HTTP_CODES.INTERNAL_SERVER_ERROR).json({
      message: 'Soru eklenirken hata oluştu.',
      error: error.message,
    });
  }
};

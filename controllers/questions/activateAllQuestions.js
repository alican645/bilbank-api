const Question = require('../../db/models/Question');
const { HTTP_CODES } = require('../../config/Enum'); // kendi yapına göre


/**
 * Tüm soruları yeniden aktif hale getirir (is_active = true)
 * POST /questions/activateAll
 */
exports.activateAllQuestions = async (req, res) => {
  try {
    const result = await Question.updateMany(
      {}, // bütün sorular
      { $set: { is_active: true } }
    );

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} soru aktif hale getirildi.`,
    });
  } catch (error) {
    console.error('activateAllQuestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Soru güncelleme sırasında hata oluştu.',
      error: error.message,
    });
  }
};

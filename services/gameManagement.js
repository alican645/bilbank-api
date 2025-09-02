const Question = require('../db/models/Question');

exports.gameManagement = async (app, room_id) => {
    const quizService = app.get('quizService');

    console.log(`📦 [${room_id}] Soru havuzu hazırlanıyor...`);

    // --- 1. AŞAMA: Soru çekimi ve işaretleme ---
    const questionsInGame = await Question.aggregate([
        { $match: { is_active: true } },
        { $sample: { size: 50 } }
    ]);

    if (!questionsInGame || questionsInGame.length === 0) {
        console.log(`🚨 [${room_id}] Aktif soru bulunamadı!`);
        return;
    }

    const questionIds = questionsInGame.map(q => q._id);

    await Question.updateMany(
        { _id: { $in: questionIds } },
        { $set: { is_active: false } }
    );

    console.log(`✅ [${room_id}] ${questionsInGame.length} soru çekildi ve işaretlendi (is_active: false).`);

    quizService.startRoom(room_id, { startedBy: "ADMIN" });
    console.log(`🚀 [${room_id}] Oda başlatıldı, 30 saniyelik geri sayım başlıyor.`);

    // --- 2. AŞAMA: 30 saniyelik geri sayım ---
    let preStartCounter = 0;
    const preStartInterval = setInterval(() => {
        preStartCounter++;
        const timeLeft = 30 - preStartCounter;
        quizService.send(room_id, 'timeLeft', { timeLeft });
        console.log(`⏱️ [${room_id}] Başlangıca kalan: ${timeLeft}s`);

        if (preStartCounter >= 30) {
            clearInterval(preStartInterval);
            console.log(`🟢 [${room_id}] Geri sayım bitti. Oyun başlıyor.`);

            // --- 3. AŞAMA: Soruları sırayla 15 saniyede bir gönder ---
            let questionIndex = 0;
            let innerCounter = 0;

            const sendQuestion = () => {
                const currentQuestion = questionsInGame[questionIndex];
                quizService.send(room_id, 'intervalPing', {
                    id: currentQuestion._id,
                    question: currentQuestion.question,
                    multiplier: currentQuestion.multiplier
                });

                console.log(`❓ [${room_id}] (${questionIndex + 1}. Soru) "${currentQuestion.question}" [x${currentQuestion.multiplier}]`);
            };

            // İlk soruyu hemen gönder
            sendQuestion();

            const roundInterval = setInterval(() => {
                innerCounter++;

                if (innerCounter < 15) {
                    const timeLeft = 15 - innerCounter;
                    quizService.send(room_id, 'intervalTimeLeft', { timeLeft });
                    console.log(`⏳ [${room_id}] (${questionIndex + 1}. Soru) kalan süre: ${timeLeft}s`);
                }

                if (innerCounter === 15) {
                    questionIndex++;
                    innerCounter = 0;

                    if (questionIndex >= questionsInGame.length) {
                        clearInterval(roundInterval);
                        quizService.send(room_id, 'gameFinished', {
                            message: 'Tüm sorular tamamlandı.',
                        });
                        console.log(`🏁 [${room_id}] Oyun tamamlandı. ${questionsInGame.length} soru gönderildi.`);
                        return;
                    }

                    sendQuestion();
                }
            }, 1000);
        }
    }, 1000);
};

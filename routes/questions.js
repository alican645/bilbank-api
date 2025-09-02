// routes/rooms.js
const express = require('express');
const router = express.Router();

const {bulkInsertQuestions} = require('../controllers/questions/bulkInsertQuestions');
const {activateAllQuestions} = require('../controllers/questions/activateAllQuestions');



router.post('/bulkInsertQuestions',bulkInsertQuestions)
router.post('/activateAllQuestions',activateAllQuestions)



module.exports = router;



// routes/rooms.js
const express = require('express');
const router = express.Router();
const Auth = require('../lib/auth')();

const {getUserNotifications} = require('../controllers/notification/getUserNotifications');
const {dismissNotification} = require('../controllers/notification/dismissNotification');
const {getNotificationCount} = require('../controllers/notification/getNotificationCount');





router.all('*', Auth.authenticate(), (req, res, next) => next());

router.get('/',getUserNotifications);

router.post('/dismissNotification',dismissNotification);
router.post('/getNotificationCount',getNotificationCount);




module.exports = router;


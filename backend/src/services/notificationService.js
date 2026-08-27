const Notification = require('../models/Notification');
const { emitToUser } = require('../socket');

exports.createNotification = async (userId, type, title, body, data = {}) => {
  try {
    const notif = await Notification.create({ user: userId, type, title, body, data });
    // Push real-time to specific user's socket room
    emitToUser(userId.toString(), 'notification:new', { notification: notif });
    return notif;
  } catch (err) {
    console.error('Notification creation error:', err.message);
  }
};

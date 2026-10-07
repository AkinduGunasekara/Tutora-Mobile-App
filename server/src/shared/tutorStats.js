// Adds real rating, review count and "available today" to tutor records returned to students,
// so the app never has to show placeholder ratings.
const mongoose = require('mongoose');
const Review = require('../modules/discovery/Review');
const TutorSettings = require('../modules/tutor/TutorSettings');
const Session = require('../modules/session/Session');

const attachTutorStats = async (tutors) => {
  const list = tutors.map((t) => (typeof t.toObject === 'function' ? t.toObject() : t));
  if (!list.length) return list;
  const ids = list.map((t) => new mongoose.Types.ObjectId(String(t._id)));

  const [ratings, settings, sessions] = await Promise.all([
    Review.aggregate([
      { $match: { tutor: { $in: ids } } },
      { $group: { _id: '$tutor', average: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]),
    TutorSettings.find({ tutor: { $in: ids } }).lean(),
    Session.aggregate([
      { $match: { tutor: { $in: ids }, sessionStatus: 'completed' } },
      { $group: { _id: '$tutor', count: { $sum: 1 } } },
    ]),
  ]);
  const sessionsBy = new Map(sessions.map((x) => [String(x._id), x.count]));
  const ratingBy = new Map(ratings.map((r) => [String(r._id), r]));
  const today = new Date().getDay();
  const openToday = new Set(settings
    .filter((s) => s.weekly?.some((d) => d.day === today && d.slots?.length))
    .map((s) => String(s.tutor)));

  return list.map((t) => {
    const r = ratingBy.get(String(t._id));
    return {
      ...t,
      rating: r ? Math.round(r.average * 10) / 10 : 0,
      reviewCount: r ? r.count : 0,
      availableToday: openToday.has(String(t._id)),
      completedSessions: sessionsBy.get(String(t._id)) ?? 0,
    };
  });
};

module.exports = { attachTutorStats };

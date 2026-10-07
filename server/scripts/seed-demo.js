// Demo data for the Tutora prototype (tutors, students, requests, sessions, payments, messages, reviews).
//
//   node scripts/seed-demo.js                     create/refresh demo data
//   node scripts/seed-demo.js --for you@mail.com  also give YOUR tutor account requests, sessions,
//                                                 payments, messages and reviews from demo students
//   node scripts/seed-demo.js --clean             remove all demo (@tutora.demo) and test (@tutora.test) data
//
// Demo accounts use the password Demo@1234. Dates are relative to today, so the data always looks current.
require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');
const User = require('../src/modules/auth/User');
const Booking = require('../src/modules/booking/Booking');
const Session = require('../src/modules/session/Session');
const Review = require('../src/modules/discovery/Review');
const CustomSessionRequest = require('../src/modules/discovery/CustomSessionRequest');
const TutorSettings = require('../src/modules/tutor/TutorSettings');
const { ensureSessionForBooking } = require('../src/shared/bookingSessionSync');
const { parseDateKey, localDateKey, formatTime } = require('../src/shared/time');

const PASSWORD = 'Demo@1234';
const DEMO = /@tutora\.(demo|test)$/;

const TUTORS = [
  { name: 'Sachini Wijesinghe', email: 'sachini@tutora.demo', hourlyRate: 2500, subjects: ['Software Engineering', 'Programming', 'Algorithms', 'Data Structures'],
    bio: 'Final-year Software Engineering undergraduate who loves breaking down tough concepts into simple steps.',
    qualifications: ['BSc (Hons) Software Engineering - SLIIT (reading)', "Dean's List 2025", '2+ Years Tutoring Experience'], f2f: true },
  { name: 'Tharindu Senanayake', email: 'tharindu@tutora.demo', hourlyRate: 2000, subjects: ['Mathematics', 'Calculus', 'Linear Algebra', 'Statistics'],
    bio: 'Mathematics tutor focused on exam preparation and past-paper practice.',
    qualifications: ['BSc Mathematics - University of Colombo', '3 Years Tutoring Experience'], f2f: true },
  { name: 'Ishara Madushani', email: 'ishara@tutora.demo', hourlyRate: 1800, subjects: ['Database Systems', 'SQL', 'Web Development'],
    bio: 'Full-stack developer helping students with databases and web projects.',
    qualifications: ['BSc IT - SLIIT', 'Oracle Certified Associate'], f2f: false },
  { name: 'Ravindu Fernando', email: 'ravindu@tutora.demo', hourlyRate: 3000, subjects: ['Python', 'Data Science', 'Machine Learning'],
    bio: 'Data science intern who teaches Python from basics to ML projects.',
    qualifications: ['BSc Data Science - SLIIT (reading)', 'Kaggle Expert'], f2f: false },
  { name: 'Nadeesha Gunawardena', email: 'nadeesha@tutora.demo', hourlyRate: 1500, subjects: ['Physics', 'Mechanics', 'Electronics'],
    bio: 'Engineering student making physics intuitive with real-world examples.',
    qualifications: ['BSc Engineering - University of Moratuwa (reading)', '2 Years Tutoring Experience'], f2f: true },
  { name: 'Chamath Rajapaksha', email: 'chamath@tutora.demo', hourlyRate: 1200, subjects: ['English', 'Academic Writing', 'IELTS Preparation'],
    bio: 'IELTS 8.0 scorer helping students write clear academic English.',
    qualifications: ['BA English - University of Kelaniya', 'IELTS Band 8.0'], f2f: true },
];

const STUDENTS = [
  ['Kavindu Perera', 'kavindu@tutora.demo', '2nd Year Undergraduate', 'Dept. of Computer Science'],
  ['Nethmi Silva', 'nethmi@tutora.demo', '1st Year Undergraduate', 'Dept. of Information Technology'],
  ['Kasun Perera', 'kasun@tutora.demo', '3rd Year Undergraduate', 'Dept. of Software Engineering'],
  ['Shahan Wickramasinghe', 'shahan@tutora.demo', '2nd Year Undergraduate', 'Dept. of Computer Science'],
  ['Minoli Fernando', 'minoli@tutora.demo', '2nd Year Undergraduate', 'Dept. of Data Science'],
  ['Dinuka Jayawardena', 'dinuka@tutora.demo', '3rd Year Undergraduate', 'Dept. of Information Technology'],
  ['Dilshan Kumara', 'dilshan@tutora.demo', '2nd Year Undergraduate', 'Dept. of Software Engineering'],
].map(([name, email, year, degree]) => ({ name, email, year, degree }));

const REVIEW_TEXT = [
  [5, 'Very helpful explanation and made the difficult concepts easier to understand.', ['Clear Explanation', 'Patient']],
  [4.5, 'Good session with practical exercises. Felt much more confident afterwards.', ['Problem Solving']],
  [5, 'Great tutor! Explained complex topics clearly with practical examples. Highly recommended.', ['Clear Explanation', 'Great Material']],
  [4, 'Great session. Would like more examples next time.', ['Great Material']],
  [5, 'Always on time and well prepared. Helped me a lot before my exam.', ['Punctual', 'Exam-Prep']],
];

const WEEKLY = [
  { day: 1, slots: [{ start: '09:00', end: '12:00' }] },
  { day: 2, slots: [{ start: '16:00', end: '20:00' }] },
  { day: 3, slots: [{ start: '15:00', end: '16:00' }] },
  { day: 4, slots: [{ start: '16:00', end: '20:00' }] },
  { day: 5, slots: [{ start: '09:00', end: '17:00' }] },
  { day: 6, slots: [{ start: '10:00', end: '13:00' }] },
];

// ── helpers ───────────────────────────────────────────────────────────────────

const dayKey = (offset) => { const d = new Date(); d.setDate(d.getDate() + offset); return localDateKey(d); };
const initials = (name) => name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
const daysAgo = (n) => new Date(Date.now() - n * 86400000);

const upsertUser = async (data, role) => {
  let user = await User.findOne({ email: data.email });
  if (!user) user = new User({ email: data.email, password: PASSWORD, role, name: data.name });
  Object.assign(user, data, { role });
  await user.save();
  return user;
};

const makeBooking = async ({ tutor, student, offset, time, minutes = 60, subject, format = 'Microsoft Teams', message = '', status = 'confirmed', customRequest = null }) => {
  const fee = Math.round(tutor.hourlyRate * minutes / 60);
  return Booking.create({
    student: student._id,
    tutor: { userId: tutor._id, name: tutor.name, subtitle: tutor.subjects[0], initials: initials(tutor.name), hourlyRate: tutor.hourlyRate },
    sessionDate: parseDateKey(dayKey(offset)),
    startTime: time,
    durationMinutes: minutes,
    meetingType: format,
    message,
    fees: { session: fee, platform: 0, total: fee },
    status,
    subject,
    customRequest,
  });
};

// Runs a confirmed booking through the real payment states
const pay = async (booking, paymentStatus, method = 'card') => {
  const session = await ensureSessionForBooking(booking);
  session.paymentMethod = method;
  session.paymentStatus = paymentStatus;
  if (paymentStatus === 'released') {
    session.sessionStatus = 'completed';
    session.startedAt = session.scheduledDate;
    session.completedAt = new Date(session.scheduledDate.getTime() + booking.durationMinutes * 60000);
    booking.status = 'completed';
    await booking.save();
  }
  await session.save();
  return session;
};

const backdate = (Model, id, date) =>
  Model.collection.updateOne({ _id: id }, { $set: { createdAt: date, updatedAt: date } });

// ── activity for one tutor (the screens in the Hi-Fi) ─────────────────────────

const seedTutorActivity = async (tutor, s, { full }) => {
  await TutorSettings.findOneAndUpdate({ tutor: tutor._id }, { tutor: tutor._id, weekly: WEEKLY }, { upsert: true });

  // Completed + paid sessions earlier this month, each reviewed once per student
  const reviewers = full ? [s.kavindu, s.nethmi, s.kasun, s.dilshan, s.dinuka] : [s.kavindu, s.nethmi, s.kasun, s.minoli].slice(0, 2 + (tutor.hourlyRate % 3));
  for (const [i, student] of reviewers.entries()) {
    const subject = tutor.subjects[i % tutor.subjects.length];
    const b = await makeBooking({ tutor, student, offset: -(2 + i * 2), time: '10:00 AM', subject });
    const session = await pay(b, 'released', i % 2 ? 'bank_transfer' : 'card');
    const [rating, comment, tags] = REVIEW_TEXT[i % REVIEW_TEXT.length];
    const review = await Review.create({ tutor: tutor._id, student: student._id, sessionId: session._id, rating, comment, tags });
    await backdate(Review, review._id, daysAgo(1 + i * 2));
  }
  if (!full) return;

  // Pending custom requests (Session Requests / Request Details)
  const requests = [
    [s.shahan, 'Algorithms (SWE-302)', 1, '3:00 PM', 'Online', 'Understand dynamic programming patterns for the upcoming assignment.', 'I keep getting stuck on DP problems. Could we go through a few together?'],
    [s.minoli, 'Database Systems (CS-201)', 4, '10:30 AM', 'In-Person', 'Normalisation and complex SQL joins.', 'Exam next week. Would love to practise past paper questions.'],
    [s.nethmi, 'Programming Fundamentals', 5, '2:00 PM', 'Online', 'Get comfortable with loops and functions.', 'New to programming and would like a patient walkthrough.'],
    [s.kavindu, 'Calculus & Linear Algebra (MATH-201)', 8, '4:00 PM', 'Online', 'Prepare for upcoming mid-term assessment and clarify multiple integrals & matrix transformations.',
      "Hi! I'm struggling with multiple integrals and integration by parts before mid-terms. Would appreciate working through some past paper problem sets together."],
  ];
  for (const [i, [student, subject, offset, time, format, objective, note]] of requests.entries()) {
    const r = await CustomSessionRequest.create({
      tutor: tutor._id, student: student._id, subject, preferredDate: parseDateKey(dayKey(offset)), preferredTime: time,
      duration: 1, description: note, estimatedBudget: tutor.hourlyRate, academicLevel: student.year,
      learningObjective: objective, preferredFormat: format,
    });
    await backdate(CustomSessionRequest, r._id, new Date(Date.now() - (i + 1) * 3600000));
  }

  // A standard booking request waiting for the tutor
  await makeBooking({ tutor, student: s.kasun, offset: 6, time: '11:00 AM', subject: 'Data Structures', format: 'In-Person Study', message: 'Trees and graphs revision please.', status: 'pending' });

  // Today: one finished session this morning + one paid session later today (if there is time left)
  const morning = await makeBooking({ tutor, student: s.dinuka, offset: 0, time: '9:00 AM', subject: 'Web Development' });
  await pay(morning, 'released');
  const nextHour = Math.min(new Date().getHours() + 1, 22);
  const today = await makeBooking({
    tutor, student: s.kavindu, offset: nextHour >= 22 ? 1 : 0, time: nextHour >= 22 ? '10:00 AM' : formatTime(nextHour * 60),
    subject: 'Software Engineering Tutoring', message: 'Improve understanding of software architecture, specifically clean architecture layers and dependency inversion before mid-terms.',
  });
  const todaySession = await pay(today, 'in_escrow');
  const t0 = Date.now() - 50 * 60000;
  const chat = [
    [tutor, "Hi! Are you ready for today's focus on binary search trees?", 0],
    [s.kavindu, 'Yes, definitely. I brought some sample assignments as well.', 2],
    [tutor, 'Perfect. Share them with me using the attachment menu.', 3],
  ];
  todaySession.messages.push(...chat.map(([who, text, min]) => ({ sender: who._id, text, sentAt: new Date(t0 + min * 60000) })));
  todaySession.messages.push({ sender: s.kavindu._id, text: '', attachment: { name: 'Assignment.pdf', type: 'pdf', size: 1468006 }, sentAt: new Date(t0 + 5 * 60000) });
  todaySession.files.push(
    { name: 'Assignment.pdf', type: 'pdf', size: 1468006, uploadedBy: s.kavindu._id, uploadedAt: new Date(t0 + 5 * 60000) },
    { name: 'SampleCode.zip', type: 'document', size: 3355443, uploadedBy: s.kavindu._id, uploadedAt: new Date(t0 + 6 * 60000) },
  );
  await todaySession.save();

  // Upcoming: one paid, one waiting for payment
  const paidLater = await makeBooking({ tutor, student: s.nethmi, offset: 3, time: '2:00 PM', subject: 'Python Tutoring', message: 'Lists, dictionaries and file handling.' });
  const paidSession = await pay(paidLater, 'in_escrow', 'bank_transfer');
  paidSession.messages.push(
    { sender: s.nethmi._id, text: 'Hi! Looking forward to the Python session.', sentAt: daysAgo(1) },
    { sender: tutor._id, text: 'Me too! Bring any questions from your lab sheet.', sentAt: daysAgo(0.9) },
  );
  await paidSession.save();
  const unpaid = await makeBooking({ tutor, student: s.dilshan, offset: 7, time: '4:00 PM', subject: 'Database Systems', message: 'ER diagrams and normalisation.' });
  await ensureSessionForBooking(unpaid);
};

// ── clean ─────────────────────────────────────────────────────────────────────

const removeData = async (filterUsers) => {
  const users = await User.find(filterUsers).select('_id').lean();
  const ids = users.map((u) => u._id);
  if (!ids.length) return 0;
  const bookings = await Booking.find({ $or: [{ student: { $in: ids } }, { 'tutor.userId': { $in: ids } }] }).select('_id').lean();
  await Promise.all([
    Session.deleteMany({ $or: [{ student: { $in: ids } }, { tutor: { $in: ids } }, { bookingId: { $in: bookings.map((b) => String(b._id)) } }] }),
    Booking.deleteMany({ _id: { $in: bookings.map((b) => b._id) } }),
    Review.deleteMany({ $or: [{ student: { $in: ids } }, { tutor: { $in: ids } }] }),
    CustomSessionRequest.deleteMany({ $or: [{ student: { $in: ids } }, { tutor: { $in: ids } }] }),
    TutorSettings.deleteMany({ tutor: { $in: ids } }),
  ]);
  await User.deleteMany({ _id: { $in: ids } });
  return ids.length;
};

// Removes only the demo students' activity with a real tutor (keeps the tutor's own account)
const removeDemoActivityFor = async (tutor) => {
  const demoStudents = (await User.find({ email: DEMO }).select('_id').lean()).map((u) => u._id);
  const bookings = await Booking.find({ 'tutor.userId': tutor._id, student: { $in: demoStudents } }).select('_id').lean();
  await Promise.all([
    Session.deleteMany({ bookingId: { $in: bookings.map((b) => String(b._id)) } }),
    Booking.deleteMany({ _id: { $in: bookings.map((b) => b._id) } }),
    Review.deleteMany({ tutor: tutor._id, student: { $in: demoStudents } }),
    CustomSessionRequest.deleteMany({ tutor: tutor._id, student: { $in: demoStudents } }),
  ]);
};

// ── main ──────────────────────────────────────────────────────────────────────

(async () => {
  const args = process.argv.slice(2);
  await mongoose.connect(process.env.MONGODB_URI);

  if (args.includes('--clean')) {
    const n = await removeData({ email: DEMO });
    console.log(`Removed ${n} demo/test accounts and all their bookings, sessions, requests and reviews.`);
    return mongoose.disconnect();
  }

  // Fresh demo data every run
  await removeData({ email: /@tutora\.demo$/ });

  const tutors = [];
  for (const t of TUTORS) {
    tutors.push(await upsertUser({
      name: t.name, email: t.email, bio: t.bio, subjects: t.subjects, qualifications: t.qualifications,
      hourlyRate: t.hourlyRate, onlineSessions: true, faceToFaceSessions: t.f2f, isVerified: true,
    }, 'tutor'));
  }
  const s = {};
  for (const st of STUDENTS) {
    s[st.email.split('@')[0]] = await upsertUser({ ...st, university: 'SLIIT' }, 'student');
  }

  await seedTutorActivity(tutors[0], s, { full: true });
  for (const t of tutors.slice(1)) await seedTutorActivity(t, s, { full: false });

  const forIdx = args.indexOf('--for');
  if (forIdx >= 0 && args[forIdx + 1]) {
    const own = await User.findOne({ email: args[forIdx + 1].toLowerCase(), role: 'tutor' });
    if (!own) {
      console.log(`No tutor account found for ${args[forIdx + 1]} (it must be registered as a tutor).`);
    } else {
      if (!own.hourlyRate) own.hourlyRate = 2500;
      if (!own.subjects?.length) own.subjects = ['Software Engineering', 'Programming', 'Algorithms', 'Mathematics'];
      if (!own.bio) own.bio = 'Software engineering student with experience tutoring university students.';
      if (!own.qualifications?.length) own.qualifications = ['Software Engineering', 'University Student', '2+ Years Tutoring Experience'];
      own.isVerified = true;
      await own.save();
      await removeDemoActivityFor(own);
      await seedTutorActivity(own, s, { full: true });
      console.log(`Added demo activity for your tutor account ${own.email}.`);
    }
  }

  console.log(`Seeded ${tutors.length} tutors and ${STUDENTS.length} students (password: ${PASSWORD}).`);
  console.log('Main demo tutor: sachini@tutora.demo | demo student: kavindu@tutora.demo');
  await mongoose.disconnect();
})().catch(async (err) => {
  console.error('Seed failed:', err.message);
  await mongoose.disconnect();
  process.exit(1);
});

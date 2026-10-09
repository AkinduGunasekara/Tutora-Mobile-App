// Shapes Booking / Session / CustomSessionRequest records into what the tutor screens display.

const { feesFor } = require('../../shared/bookingSessionSync');
const {
  parseTime,
  formatTime,
  normalizeTime,
  dateKeyFromSessionDate,
  combineDateTime,
} = require('../../shared/time');
const { initials, snapDuration, tutorAmount } = require('./tutorService');

const endTimeOf = (startTime, durationMinutes) => {
  const start = parseTime(startTime);
  return start === null ? '' : formatTime(start + durationMinutes);
};

const formatOf = (meetingType) => (meetingType === 'In-Person Study' ? 'In-Person' : 'Online');

const studentView = (s) => {
  if (!s || typeof s !== 'object') return { id: String(s || ''), name: 'Student', initials: 'S' };
  return {
    id: String(s._id),
    name: s.name,
    initials: initials(s.name),
    email: s.email || '',
    avatar: s.avatar || null,
    year: s.year || '',
    degree: s.degree || '',
    university: s.university || '',
    isVerified: !!s.isVerified,
  };
};

const proposalView = (p, durationMinutes) =>
  p ? {
    date: dateKeyFromSessionDate(p.sessionDate),
    startTime: p.startTime,
    endTime: endTimeOf(p.startTime, durationMinutes),
    reason: p.reason || '',
    status: p.status,
    createdAt: p.createdAt,
    respondedAt: p.respondedAt,
  } : null;

const paymentView = (session) =>
  session ? {
    sessionId: String(session._id),
    paymentStatus: session.paymentStatus,
    sessionStatus: session.sessionStatus,
    paymentMethod: session.paymentMethod,
    amount: tutorAmount(session),
    serviceFee: session.serviceFee,
    totalAmount: session.totalAmount,
  } : null;

const fileView = (f, booking) => {
  const uploader = String(f.uploadedBy || '');
  const byTutor = uploader === String(booking.tutor?.userId);
  return {
    name: f.name,
    type: f.type || 'document',
    uri: f.uri || '',
    size: f.size || 0,
    uploadedAt: f.uploadedAt,
    uploadedBy: byTutor ? 'tutor' : 'student',
    uploaderName: byTutor ? booking.tutor.name : (booking.student?.name || 'Student'),
  };
};

// booking (student populated), session (may be null), request (custom request, may be null)
const sessionView = (booking, session, request = null) => {
  const student = studentView(booking.student);
  return {
    bookingId: String(booking._id),
    sessionId: session ? String(session._id) : null,
    subject: booking.subject || request?.subject || booking.tutor?.subtitle || 'Tutoring Session',
    status: booking.status,
    cancelledBy: booking.cancelledBy || '',
    student,
    date: dateKeyFromSessionDate(booking.sessionDate),
    startTime: booking.startTime,
    endTime: endTimeOf(booking.startTime, booking.durationMinutes),
    startsAt: combineDateTime(booking.sessionDate, booking.startTime).toISOString(),
    durationMinutes: booking.durationMinutes,
    meetingType: booking.meetingType,
    format: formatOf(booking.meetingType),
    message: booking.message || '',
    learningObjective: request?.learningObjective || '',
    academicLevel: request?.academicLevel || student.year || '',
    rescheduleRequest: proposalView(booking.rescheduleRequest, booking.durationMinutes),
    payment: paymentView(session),
    files: (session?.files ?? []).map((f) => fileView(f, booking)),
    createdAt: booking.createdAt,
  };
};

const requestRef = (id) => `REQ-${String(id).slice(-4).toUpperCase()}`;

const customRequestView = (req, tutorRate) => {
  const durationMinutes = snapDuration(req.duration);
  const startTime = normalizeTime(req.preferredTime) || req.preferredTime;
  const fees = feesFor(durationMinutes / 60, tutorRate);
  const statusMap = {
    pending: 'pending',
    alternative_proposed: 'proposed',
    accepted: 'accepted',
    rejected: 'declined',
    cancelled: 'cancelled',
  };
  const student = studentView(req.student);
  return {
    kind: 'custom',
    id: String(req._id),
    ref: requestRef(req._id),
    status: statusMap[req.status] || req.status,
    subject: req.subject,
    student,
    academicLevel: req.academicLevel || student.year || '',
    format: req.preferredFormat || 'Online',
    date: dateKeyFromSessionDate(req.preferredDate),
    startTime,
    endTime: endTimeOf(startTime, durationMinutes),
    durationMinutes,
    learningObjective: req.learningObjective || '',
    note: req.description || '',
    budget: req.estimatedBudget ?? null,
    fees: { session: fees.subtotal, serviceFee: fees.serviceFee, total: fees.totalAmount },
    alternative: req.alternative ? {
      date: dateKeyFromSessionDate(req.alternative.sessionDate),
      startTime: req.alternative.startTime,
      endTime: endTimeOf(req.alternative.startTime, durationMinutes),
      note: req.alternative.note || '',
    } : null,
    declineReason: req.declineReason || '',
    bookingId: req.booking ? String(req.booking) : null,
    createdAt: req.createdAt,
  };
};

const bookingRequestView = (booking) => {
  const pendingProposal = booking.rescheduleRequest?.status === 'pending' ? booking.rescheduleRequest : null;
  let status = 'pending';
  if (booking.status === 'pending' && pendingProposal) status = 'proposed';
  else if (['confirmed', 'completed'].includes(booking.status)) status = 'accepted';
  else if (booking.status === 'cancelled') status = booking.cancelledBy === 'student' ? 'cancelled' : 'declined';
  const fees = feesFor(booking.durationMinutes / 60, booking.tutor.hourlyRate);
  const student = studentView(booking.student);
  return {
    kind: 'booking',
    id: String(booking._id),
    ref: requestRef(booking._id),
    status,
    subject: booking.subject || booking.tutor?.subtitle || 'Tutoring Session',
    student,
    academicLevel: student.year || '',
    format: formatOf(booking.meetingType),
    date: dateKeyFromSessionDate(booking.sessionDate),
    startTime: booking.startTime,
    endTime: endTimeOf(booking.startTime, booking.durationMinutes),
    durationMinutes: booking.durationMinutes,
    learningObjective: '',
    note: booking.message || '',
    budget: null,
    fees: { session: fees.subtotal, serviceFee: fees.serviceFee, total: fees.totalAmount },
    alternative: pendingProposal ? {
      date: dateKeyFromSessionDate(pendingProposal.sessionDate),
      startTime: pendingProposal.startTime,
      endTime: endTimeOf(pendingProposal.startTime, booking.durationMinutes),
      note: pendingProposal.reason || '',
    } : null,
    declineReason: booking.cancelledBy === 'tutor' ? booking.cancellationReason : '',
    bookingId: String(booking._id),
    createdAt: booking.createdAt,
  };
};

module.exports = {
  endTimeOf,
  formatOf,
  studentView,
  sessionView,
  customRequestView,
  bookingRequestView,
};

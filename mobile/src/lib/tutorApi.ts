// Typed client for the tutor-side API (/api/tutor). Uses the shared axios instance.
import api from '@/lib/api';

export type PaymentStatus = 'pending' | 'in_escrow' | 'released' | 'refunded';
export type SessionStatus = 'confirmed' | 'active' | 'completed' | 'cancelled';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type RequestStatus = 'pending' | 'proposed' | 'accepted' | 'declined' | 'cancelled';

export interface StudentInfo {
  id: string;
  name: string;
  initials: string;
  email?: string;
  avatar?: string | null;
  year?: string;
  degree?: string;
  university?: string;
  isVerified?: boolean;
}

export interface PaymentInfo {
  sessionId: string;
  paymentStatus: PaymentStatus;
  sessionStatus: SessionStatus;
  paymentMethod: string;
  amount: number;
  serviceFee: number;
  totalAmount: number;
}

export interface SharedFile {
  name: string;
  type: string;
  uri: string;
  size: number;
  uploadedAt: string;
  uploadedBy: 'tutor' | 'student';
  uploaderName: string;
}

export interface Proposal {
  date: string;
  startTime: string;
  endTime: string;
  reason?: string;
  note?: string;
  status?: 'pending' | 'approved' | 'rejected' | 'withdrawn';
}

export interface SessionView {
  bookingId: string;
  sessionId: string | null;
  subject: string;
  status: BookingStatus;
  cancelledBy: '' | 'student' | 'tutor';
  student: StudentInfo;
  date: string;
  startTime: string;
  endTime: string;
  startsAt: string;
  durationMinutes: number;
  meetingType: string;
  format: 'Online' | 'In-Person';
  message: string;
  learningObjective: string;
  academicLevel: string;
  rescheduleRequest: Proposal | null;
  payment: PaymentInfo | null;
  files: SharedFile[];
}

export interface RequestView {
  kind: 'custom' | 'booking';
  id: string;
  ref: string;
  status: RequestStatus;
  subject: string;
  student: StudentInfo;
  academicLevel: string;
  format: 'Online' | 'In-Person';
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  learningObjective: string;
  note: string;
  budget: number | null;
  fees: { session: number; serviceFee: number; total: number };
  alternative: Proposal | null;
  declineReason: string;
  bookingId: string | null;
  createdAt: string;
}

export interface ReviewItem {
  id: string;
  rating: number;
  comment: string;
  tags: string[];
  subject: string;
  student: { id: string; name: string };
  createdAt: string;
}

export interface ReviewSummary {
  average: number;
  count: number;
  distribution: Record<'1' | '2' | '3' | '4' | '5', number>;
  label: string;
}

export interface AvailabilityDay {
  day: number; // 0 = Sunday
  slots: { start: string; end: string }[];
  status: 'open' | 'closed' | 'booked';
}

export interface EarningItem {
  sessionId: string;
  bookingId: string;
  subject: string;
  student: { id: string; name: string };
  date: string;
  amount: number;
  serviceFee: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  statusLabel: string;
  sessionStatus: SessionStatus;
  completedAt: string | null;
}

export interface Earnings {
  month: string;
  total: number;
  pending: number;
  settled: number;
  counts: { all: number; paid: number; pending: number };
  items: EarningItem[];
  payout: { nextPayoutDate: string; bankName: string; accountLast4: string };
}

export interface Dashboard {
  nextSession: SessionView | null;
  requests: { pendingCount: number; items: RequestView[] };
  today: SessionView[];
  earnings: { month: string; total: number; pending: number; settled: number };
  reviews: ReviewSummary & { latest: ReviewItem | null };
}

export interface Conversation {
  sessionId: string;
  bookingId: string;
  subject: string;
  student: StudentInfo;
  scheduledDate: string;
  sessionStatus: SessionStatus;
  paymentStatus: PaymentStatus;
  messageCount: number;
  lastMessage: { text: string; sentAt: string; mine: boolean } | null;
  lastActivity: string;
}

export const errorMessage = (err: any, fallback: string) =>
  err?.response?.data?.message ?? fallback;

export const tutorApi = {
  dashboard: () => api.get<Dashboard>('/tutor/dashboard').then((r) => r.data),

  calendar: (month: string) =>
    api.get<{ month: string; bookedDates: string[]; sessions: SessionView[]; upcoming: SessionView[]; availability: AvailabilityDay[] }>(
      `/tutor/calendar?month=${month}`,
    ).then((r) => r.data),

  availability: () =>
    api.get<{ weekly: AvailabilityDay[] }>('/tutor/availability').then((r) => r.data),
  saveAvailability: (weekly: { day: number; slots: { start: string; end: string }[] }[]) =>
    api.put<{ weekly: AvailabilityDay[] }>('/tutor/availability', { weekly }).then((r) => r.data),
  availableSlots: (date: string, durationMinutes: number, bookingId?: string) =>
    api.get<{ slots: string[]; hasAvailability: boolean }>(
      `/tutor/available-slots?date=${date}&durationMinutes=${durationMinutes}${bookingId ? `&bookingId=${bookingId}` : ''}`,
    ).then((r) => r.data),

  requests: (status: 'all' | 'pending' | 'accepted' = 'all') =>
    api.get<{ counts: { all: number; pending: number; accepted: number }; items: RequestView[] }>(
      `/tutor/requests?status=${status}`,
    ).then((r) => r.data),
  request: (kind: string, id: string) =>
    api.get<RequestView>(`/tutor/requests/${kind}/${id}`).then((r) => r.data),
  // Standard bookings reuse the existing booking endpoints
  acceptRequest: (kind: string, id: string) =>
    kind === 'custom'
      ? api.patch(`/tutor/requests/custom/${id}/accept`).then((r) => r.data)
      : api.patch(`/bookings/${id}/accept`).then((r) => r.data),
  declineRequest: (kind: string, id: string, reason: string) =>
    kind === 'custom'
      ? api.patch(`/tutor/requests/custom/${id}/decline`, { reason }).then((r) => r.data)
      : api.patch(`/bookings/${id}/reject`, { reason }).then((r) => r.data),
  proposeAlternative: (kind: string, id: string, date: string, time: string, note: string) =>
    api.patch(`/tutor/requests/${kind}/${id}/propose`, { date, time, note }).then((r) => r.data),

  session: (bookingId: string) =>
    api.get<SessionView>(`/tutor/sessions/${bookingId}`).then((r) => r.data),
  requestReschedule: (bookingId: string, date: string, time: string, reason: string) =>
    api.post<{ session: SessionView }>(`/tutor/sessions/${bookingId}/reschedule`, { date, time, reason }).then((r) => r.data),
  withdrawReschedule: (bookingId: string) =>
    api.delete<{ session: SessionView }>(`/tutor/sessions/${bookingId}/reschedule`).then((r) => r.data),
  cancelSession: (bookingId: string, reason: string) =>
    api.patch<{ session: SessionView }>(`/tutor/sessions/${bookingId}/cancel`, { reason }).then((r) => r.data),
  // Files and messages reuse the existing session endpoints
  addFile: (sessionId: string, file: { name: string; type: string; size: number }) =>
    api.post(`/session/${sessionId}/file`, file).then((r) => r.data),

  earnings: (month: string) =>
    api.get<Earnings>(`/tutor/earnings?month=${month}`).then((r) => r.data),

  reviews: (page = 1, sort: 'recent' | 'highest' | 'lowest' = 'recent') =>
    api.get<ReviewSummary & { page: number; items: ReviewItem[]; hasMore: boolean }>(
      `/tutor/reviews?page=${page}&limit=10&sort=${sort}`,
    ).then((r) => r.data),

  conversations: () =>
    api.get<{ items: Conversation[] }>('/tutor/conversations').then((r) => r.data),
};

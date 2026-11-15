export type RoomListItem = {
  id: number;
  name: string;
  imageName: string | null;
  description: string;
  postalCode: string;
  address: string;
  price: number;
  averageScore: number | null;
  reviewCount: number;
};
export type RoomListResponse = {
  items: RoomListItem[];
  page: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
};
export type BusinessHour = {
  dayOfWeek: number;
  startTime: string | null;
  endTime: string | null;
  isHoliday: boolean;
};
export type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  type: 'open' | 'closure' | 'reservation';
};
export type RoomReview = {
  id: number;
  score: number | null;
  content: string;
  userName: string;
  hostReply: string | null;
  hostReplyAt: string | null;
  createdAtUtc: string;
};
export type RoomDetail = RoomListItem & {
  capacity: number;
  hostName: string;
  businessHours: BusinessHour[];
  calendarEvents: CalendarEvent[];
  reviews: RoomReview[];
  hiddenHostReplies: RoomReview[];
  priceRules?: Array<{ id: number; note: string | null }>;
};
export type Member = {
  id: number;
  name: string;
  kana: string;
  email: string;
  postalCode: string;
  address: string;
  phoneNumber: string;
  usageType: string;
  roles: string[];
};
export type MeResponse = { isAuthenticated: boolean; user?: Member };
export type LoginResponse = { token?: string; message?: string; redirectTo?: string };
export type Reservation = {
  reservationId: number;
  roomId: number;
  roomName: string;
  roomImageName: string | null;
  roomAddress: string;
  startAt: string;
  endAt: string;
  amount: number;
  status: string;
  isUsed: boolean;
  createdAtUtc: string;
};
export type ReservationsResponse = {
  items: Reservation[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};
export type ConfirmResponse = {
  roomId: number;
  roomName: string;
  startAt: string;
  endAt: string;
  hourlyPrice: number;
  hours: number;
  subtotal: number;
  taxRatePercent: number;
  tax: number | null;
  platformFeeRatePercent: number;
  platformFee: number | null;
  amount: number;
  items: Array<{
    label: string; amount: number; sliceStart: string | null;
    sliceEnd: string | null; unitRatePerHour: number | null;
  }>;
  stripePublishableKey: string;
  sessionId: string;
  checkoutUrl: string;
};
export type EditMember = Pick<Member, 'name' | 'kana' | 'postalCode' | 'address' | 'phoneNumber' | 'email'>;

// 既存 Next.js 版（/rooms/ai-search）の API レスポンスと同じ契約。
export type AiRequestedSlot = {
  startAt: string;
  endAt: string;
  durationAssumed: boolean;
};
export type AiRoomSearchConditions = {
  keyword: string | null;
  area: string | null;
  price: number | null;
  capacity: number | null;
  capacityCondition: 'min' | 'max' | 'exact' | null;
  purpose: string | null;
  atmosphere: string | null;
  timePreference: string | null;
  date?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  durationMinutes?: number | null;
  keywords: string[];
};
export type AiRoomAvailability = {
  status: string;
  label: string;
  isAvailable: boolean;
};
export type AiRoomSearchItem = RoomListItem & {
  capacity: number;
  reason: string;
  reasons?: string[];
  availability?: AiRoomAvailability | null;
};
export type AiRoomSearchResponse = {
  query: string;
  interpretedConditions: AiRoomSearchConditions;
  rooms: AiRoomSearchItem[];
  requestedSlot?: AiRequestedSlot | null;
  relaxed?: boolean;
  notices?: string[];
};

// Web版 /api/rooms/{roomId}/reviews/new のレスポンス契約。
export type ReviewListItem = {
  id: number;
  score: number;
  content: string;
  userName: string;
  createdAtUtc: string;
};
export type ReviewPageResponse = {
  roomId: number;
  roomName: string;
  roomImageName: string | null;
  roomAddress: string;
  averageScore: number;
  reviewCount: number;
  reviews: ReviewListItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  alreadyReviewed: boolean;
  canReview: boolean;
};
export type AiReviewAssistResponse = { assistedContent: string };

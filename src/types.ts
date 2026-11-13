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
};
export type RoomDetail = RoomListItem & {
  capacity: number;
  hostName: string;
  businessHours: BusinessHour[];
  calendarEvents: CalendarEvent[];
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

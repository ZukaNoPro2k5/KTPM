export interface Booking {
  BookingID: number;
  UserID: number;
  FlightID: number;
  BookingStatus: 'confirmed' | 'cancelled';
  PaymentStatus: 'paid' | 'unpaid';
  BookingDate: Date;
}

export interface Payment {
  PaymentID: number;
  BookingID: number;
  Amount: number;
  PaymentDate: Date;
  PaymentStatus: 'completed' | 'pending' | 'failed';
}

export interface CreateBookingRequest {
  userID: number;
  flightID: number;
}

export interface ProcessPaymentRequest {
  bookingId: number;
  amount: number;
}
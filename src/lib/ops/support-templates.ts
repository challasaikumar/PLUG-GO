export const SUPPORT_TEMPLATES = [
  {
    id: "charger_offline",
    category: "charger_offline",
    title: "Charger appears offline",
    body: "Thank you for reporting this. We can see the station on our operations board and a technician workflow can be raised if the charger stays offline. We will not ask you for card details or OTPs.",
  },
  {
    id: "session_failed",
    category: "session_failed",
    title: "Session did not start",
    body: "We logged this against the session reference you gave. Protocol acceptance is not the same as charging. If the connector did not meter energy, we treat it as not charged.",
  },
  {
    id: "booking_hold",
    category: "booking",
    title: "Booking hold",
    body: "A booking hold is not a completed payment. If the hold expires without capture, the reservation is released. Reply with your booking reference only — not OTPs or card numbers.",
  },
  {
    id: "refund_state",
    category: "payment",
    title: "Refund status",
    body: "Refunds are processed by finance against the original payment method. We will not collect CVV, UPI PIN, or OTP in this thread. Check the booking receipt for the refund state.",
  },
] as const;

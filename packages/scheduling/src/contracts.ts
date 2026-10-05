export interface Appointment {
  id: string;
  tenantId: string;
  customerId: string;
  projectId?: string;
  startsAt: string;
  endsAt: string;
  timezone: string;
  status: "PROPOSED" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  externalEventId?: string;
}

export interface CalendarAdapter {
  listAvailability(input: { tenantId: string; from: string; to: string }): Promise<Appointment[]>;
  createAppointment(input: Omit<Appointment, "id" | "status">): Promise<Appointment>;
}

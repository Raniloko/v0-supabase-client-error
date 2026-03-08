export type TableStatus = "free" | "reserved" | "occupied" | "blocked"
export type ReservationStatus = "confirmed" | "occupied" | "cancelled" | "completed" | "waitlist"
export type EmailType = "confirmation" | "cancellation" | "waitlist" | "reminder"

export interface Area {
  id: string
  name: string
  enabled: boolean
  sort_order: number
}

export interface Table {
  id: string
  number: string
  area_id: string
  capacity: number
  status: TableStatus
  blocked_reason: string | null
  pos_x: number
  pos_y: number
  width: number
  height: number
  table_type: "restaurant" | "billiard"
}

export interface Reservation {
  id: string
  cancellation_token: string
  guest_name: string
  guest_email: string | null
  guest_phone: string | null
  area_id: string
  table_id: string
  reservation_date: string
  start_time: string
  end_time: string
  party_size: number
  /** @deprecated use party_size */
  persons?: number
  status: ReservationStatus
  internal_note: string | null
  /** @deprecated use internal_note */
  staff_notes?: string | null
  checked_in_at: string | null
  recurring_id: string | null
  created_at: string
  updated_at: string
  // joined
  table?: Table
  area?: Area
}

export interface WaitlistEntry {
  id: string
  guest_name: string
  guest_email: string | null
  guest_phone: string | null
  area_id: string
  desired_date: string
  desired_time: string
  party_size: number
  /** @deprecated use party_size */
  persons?: number
  notified: boolean
  promoted: boolean
  created_at: string
  area?: Area
}

export interface RecurringReservation {
  id: string
  guest_name: string
  guest_email: string | null
  guest_phone: string | null
  area_id: string
  table_id: string
  weekday: number
  start_time: string
  end_time: string
  party_size: number
  start_date: string
  end_date: string | null
  is_active: boolean
  internal_note: string | null
  created_at: string
  table?: Table
  area?: Area
}

export interface ActivityLog {
  id: string
  admin_name: string
  action: string
  details: string | null
  reservation_id: string | null
  created_at: string
}

export interface EmailLog {
  id: string
  guest_name: string | null
  guest_email: string
  email_type: EmailType
  reservation_id: string | null
  status: "sent" | "failed"
  sent_at: string
}

export interface TableNote {
  id: string
  table_id: string
  note: string | null
  updated_at: string
}

export interface Settings {
  id: string
  opening_hours: {
    [key: string]: { open: string; close: string; enabled: boolean }
  }
  booking_rules: {
    min_lead_minutes: number
    max_duration_minutes: number
    default_duration_minutes: number
  }
  notification_settings: {
    admin_email_alerts: boolean
    manager_email: string
  }
  email_sender: {
    name: string
    address: string
  }
  updated_at: string
}

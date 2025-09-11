export type NotificationType = 
  | 'game' 
  | 'tournament' 
  | 'booking_confirmation' 
  | 'booking_reminder' 
  | 'booking_cancelled';

export type NotificationStatus = 'pending' | 'accepted' | 'declined' | 'read' | 'unread';

export interface Notification {
  id: string;
  type: NotificationType;
  entity_id?: string | null;
  booking_id?: string | null;
  sender_id?: string | null;
  recipient_id: string;
  status: NotificationStatus;
  message?: string | null;
  metadata?: {
    venue_name?: string;
    venue_address?: string;
    start_time?: string;
    end_time?: string;
    table_number?: number;
    total_amount?: number;
    booking_status?: string;
    sender_name?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface BookingNotificationData {
  venue_name: string;
  venue_address: string;
  start_time: string;
  end_time: string;
  table_number: number;
  total_amount: number;
  booking_status: string;
}

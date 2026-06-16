export interface Poll {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  start_date: string;
  num_days: number;
  start_hour: number;
  end_hour: number;
  closes_at: string | null;
  created_at: string;
}

export interface Respondent {
  id: string;
  poll_id: string;
  name: string;
  email: string;
  timezone: string;
  created_at: string;
}

export interface Availability {
  id: string;
  respondent_id: string;
  slot_utc: string;
}

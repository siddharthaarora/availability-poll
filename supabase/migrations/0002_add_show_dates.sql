-- Add show_dates flag to polls.
-- When false, the grid labels columns by weekday only (no calendar dates).
alter table polls
  add column if not exists show_dates boolean not null default true;

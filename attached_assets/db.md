## Supabase DB

```
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5ZXpqZXFmdXd6em1nYWZuenBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyNzU1MzYsImV4cCI6MjA1ODg1MTUzNn0.V0MmGonfDKt3qHjkc89L3pHzYAgMv-1PegjGmewIhAI
SUPABASE_URL=https://iyezjeqfuwzzmgafnzpi.supabase.co
DATABASE_URL=postgresql://postgres.iyezjeqfuwzzmgafnzpi:Lise3517351@aws-0-us-east-1.pooler.supabase.com:5432/postgres

```

| table_name         | column_name          | data_type                | character_maximum_length | column_default                  | is_nullable |
| ------------------ | -------------------- | ------------------------ | ------------------------ | ------------------------------- | ----------- |
| booking_history    | id                   | uuid                     | null                     | gen_random_uuid()               | NO          |
| booking_history    | booking_id           | uuid                     | null                     | null                            | NO          |
| booking_history    | status               | text                     | null                     | null                            | NO          |
| booking_history    | changed_at           | timestamp with time zone | null                     | now()                           | NO          |
| booking_history    | notes                | text                     | null                     | null                            | YES         |
| bookings           | id                   | uuid                     | null                     | gen_random_uuid()               | NO          |
| bookings           | restaurant_id        | uuid                     | null                     | null                            | NO          |
| bookings           | customer_id          | uuid                     | null                     | null                            | NO          |
| bookings           | schedule_service_id  | uuid                     | null                     | null                            | NO          |
| bookings           | floor_plan_id        | uuid                     | null                     | null                            | NO          |
| bookings           | booking_time         | timestamp with time zone | null                     | null                            | NO          |
| bookings           | party_size           | integer                  | null                     | null                            | NO          |
| bookings           | table_reference      | text                     | null                     | null                            | YES         |
| bookings           | status               | text                     | null                     | 'pending'::text                 | NO          |
| bookings           | notes                | text                     | null                     | null                            | YES         |
| bookings           | created_at           | timestamp with time zone | null                     | now()                           | NO          |
| bookings           | updated_at           | timestamp with time zone | null                     | now()                           | NO          |
| customers          | id                   | uuid                     | null                     | gen_random_uuid()               | NO          |
| customers          | first_name           | text                     | null                     | null                            | NO          |
| customers          | last_name            | text                     | null                     | null                            | NO          |
| customers          | email                | text                     | null                     | null                            | YES         |
| customers          | phone                | text                     | null                     | null                            | YES         |
| customers          | preferences          | jsonb                    | null                     | null                            | YES         |
| customers          | created_at           | timestamp with time zone | null                     | now()                           | NO          |
| customers          | updated_at           | timestamp with time zone | null                     | now()                           | NO          |
| floor_plans        | id                   | uuid                     | null                     | gen_random_uuid()               | NO          |
| floor_plans        | restaurant_id        | uuid                     | null                     | null                            | NO          |
| floor_plans        | name                 | text                     | null                     | null                            | NO          |
| floor_plans        | layout               | jsonb                    | null                     | null                            | NO          |
| floor_plans        | is_default           | boolean                  | null                     | false                           | NO          |
| floor_plans        | created_by           | uuid                     | null                     | null                            | NO          |
| floor_plans        | created_at           | timestamp with time zone | null                     | now()                           | NO          |
| floor_plans        | updated_at           | timestamp with time zone | null                     | now()                           | NO          |
| restaurant_users   | id                   | uuid                     | null                     | gen_random_uuid()               | NO          |
| restaurant_users   | restaurant_id        | uuid                     | null                     | null                            | NO          |
| restaurant_users   | user_id              | uuid                     | null                     | null                            | NO          |
| restaurant_users   | role                 | text                     | null                     | null                            | NO          |
| restaurant_users   | created_at           | timestamp with time zone | null                     | now()                           | NO          |
| restaurant_users   | updated_at           | timestamp with time zone | null                     | now()                           | NO          |
| restaurant_users   | extra_properties     | json                     | null                     | null                            | YES         |
| restaurants        | id                   | uuid                     | null                     | gen_random_uuid()               | NO          |
| restaurants        | owner_id             | uuid                     | null                     | null                            | NO          |
| restaurants        | name                 | text                     | null                     | null                            | NO          |
| restaurants        | address              | text                     | null                     | null                            | YES         |
| restaurants        | phone                | text                     | null                     | null                            | YES         |
| restaurants        | email                | text                     | null                     | null                            | YES         |
| restaurants        | created_at           | timestamp with time zone | null                     | now()                           | NO          |
| restaurants        | updated_at           | timestamp with time zone | null                     | now()                           | NO          |
| schedule_services  | id                   | uuid                     | null                     | gen_random_uuid()               | NO          |
| schedule_services  | restaurant_id        | uuid                     | null                     | null                            | NO          |
| schedule_services  | floor_plan_id        | uuid                     | null                     | null                            | NO          |
| schedule_services  | name                 | text                     | null                     | null                            | NO          |
| schedule_services  | service_type         | text                     | null                     | null                            | NO          |
| schedule_services  | recurrence_pattern   | text                     | null                     | null                            | YES         |
| schedule_services  | applicable_days      | ARRAY                    | null                     | null                            | YES         |
| schedule_services  | service_date         | date                     | null                     | null                            | YES         |
| schedule_services  | start_time           | time without time zone   | null                     | null                            | NO          |
| schedule_services  | end_time             | time without time zone   | null                     | null                            | NO          |
| schedule_services  | reservation_duration | integer                  | null                     | null                            | NO          |
| schedule_services  | created_at           | timestamp with time zone | null                     | now()                           | NO          |
| schedule_services  | updated_at           | timestamp with time zone | null                     | now()                           | NO          |
| seating_areas      | id                   | bigint                   | null                     | null                            | NO          |
| seating_areas      | id_floor_plan        | uuid                     | null                     | null                            | NO          |
| seating_areas      | name                 | text                     | null                     | null                            | YES         |
| seating_areas      | capacity_range       | json                     | null                     | null                            | YES         |
| seating_areas      | description          | text                     | null                     | null                            | YES         |
| seating_areas      | x                    | numeric                  | null                     | null                            | YES         |
| seating_areas      | y                    | numeric                  | null                     | null                            | YES         |
| seating_areas      | properties           | json                     | null                     | null                            | YES         |
| seating_areas      | created_at           | timestamp with time zone | null                     | now()                           | NO          |
| subscription_plans | id                   | uuid                     | null                     | gen_random_uuid()               | NO          |
| subscription_plans | name                 | text                     | null                     | null                            | NO          |
| subscription_plans | description          | text                     | null                     | null                            | YES         |
| subscription_plans | price_monthly        | numeric                  | null                     | null                            | NO          |
| subscription_plans | price_yearly         | numeric                  | null                     | null                            | NO          |
| subscription_plans | features             | jsonb                    | null                     | null                            | YES         |
| subscription_plans | is_active            | boolean                  | null                     | true                            | NO          |
| subscription_plans | created_at           | timestamp with time zone | null                     | now()                           | NO          |
| subscription_plans | updated_at           | timestamp with time zone | null                     | now()                           | NO          |
| subscriptions      | id                   | uuid                     | null                     | gen_random_uuid()               | NO          |
| subscriptions      | restaurant_id        | uuid                     | null                     | null                            | NO          |
| subscriptions      | plan_id              | uuid                     | null                     | null                            | YES         |
| subscriptions      | next_plan_id         | uuid                     | null                     | null                            | YES         |
| subscriptions      | status               | USER-DEFINED             | null                     | 'trialing'::subscription_status | NO          |
| subscriptions      | trial_ends_at        | timestamp with time zone | null                     | null                            | YES         |
| subscriptions      | current_period_start | timestamp with time zone | null                     | now()                           | NO          |
| subscriptions      | current_period_end   | timestamp with time zone | null                     | null                            | NO          |
| subscriptions      | canceled_at          | timestamp with time zone | null                     | null                            | YES         |
| subscriptions      | payment_method_id    | text                     | null                     | null                            | YES         |
| subscriptions      | is_trial             | boolean                  | null                     | false                           | NO          |
| subscriptions      | created_at           | timestamp with time zone | null                     | now()                           | NO          |
| subscriptions      | updated_at           | timestamp with time zone | null                     | now()                           | NO          |

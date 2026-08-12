/**Types for eMAR */

export type TaskPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type ScheduleStatus =
    | 'PENDING'
    | 'IN_PROGRESS'
    | 'COMPLETED'
    | 'CANCELLED'
    | 'SKIPPED'
    | 'OVERDUE';

export type ActionType =
    | 'CREATED'
    | 'SCHEDULED'
    | 'RESCHEDULED'
    | 'REASSIGNED'
    | 'STARTED'
    | 'COMPLETED'
    | 'SKIPPED'
    | 'CANCELLED'
    | 'BLOCKED';

export interface TaskScheduleViewItem {
    schedule_id: string;
    pet_id: string;
    pet_name: string;
    pet_slug: string;
    species: string;
    wakeup_default_time: string | null;
    breakfast_default_time: string | null;
    dinner_default_time: string | null;
    bedtime_default_time: string | null;
    task_id: string;
    task_title: string;
    task_type: string;
    task_priority: TaskPriority;
    description?: string;
    total_amount: string | null;
    expected_amount: string | null;
    expected_amount_value?: number | null;
    expected_amount_unit?: string | null;
    delivered_amount: string | null;
    delivered_amount_value?: number | null;
    delivered_amount_unit?: string | null;
    due_on: string;
    scheduled_time_range?: string;
    schedule_modifier: string;
    schedule_routine_periods: string;
    schedule_frequency_summary: string;
    schedule_status: ScheduleStatus;
    is_overdue: boolean;
    responsible_owner_id: string | null;
    last_action_taken?: string | null;
}

export interface EMARRowData {
    task_id: string;
    pet_name: string;
    title: string;
    description: string;
    priority: TaskPriority;
    due_date_formatted: string;
    schedule_summary: string;
    // Keyed by time slot, e.g., "08:00", "12:00", "17:00", "19:30"
    timeSlots: Record<string, TaskScheduleViewItem | undefined>;
}
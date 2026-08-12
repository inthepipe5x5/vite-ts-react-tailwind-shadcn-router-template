import React, { useMemo, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  useTable,
  createCoreRowModel,
  tableFeatures,
  flexRender,
  sortFns,
  rowSortingFeature,
  createSortedRowModel,
} from '@tanstack/react-table';
import type { ColumnDef } from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import supabase from '@/data/supabase'; // Adjust path as needed
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CompleteTaskModal } from './CompleteTaskModal';
import type {
  EMARRowData,
  TaskScheduleViewItem,
  ScheduleStatus,
  ActionType
} from '@/data/emar-types';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  SkipForward,
  Calendar,
  MessageSquare,
  Plus,
} from 'lucide-react';
import { DEFAULT_MEAL_TIMES } from '@/data/sampleData';

interface PetEMARGridProps {
  selectedDate?: string; // YYYY-MM-DD,
  lookbackDays?: number; // Number of days to look back for overdue tasks
  statusFilter?: ScheduleStatus[]; // Filter tasks by status
}
const priorityColors: Record<string, string> = {
  CRITICAL: 'bg-red-100 text-red-800 border-red-300',
  HIGH: 'bg-orange-100 text-orange-800 border-orange-300',
  MEDIUM: 'bg-blue-100 text-blue-800 border-blue-300',
  LOW: 'bg-slate-100 text-slate-800 border-slate-300',
};
// 1. Define the shape of your data //TODO: CHANGE THIS TO TASK
type Person = {
  firstName: string
  lastName: string
  age: number
}

// 2. Give your data a stable reference (module scope, useState, useQuery, etc.)
const data: Array<Person> = [
  { firstName: 'tanner', lastName: 'linsley', age: 24 },
  { firstName: 'tandy', lastName: 'miller', age: 40 },
  { firstName: 'joe', lastName: 'dirte', age: 45 },
]

// 3. New in v9: declare which features this table uses 
/**TODO: make sure the following table feature are enabled:
 * - Sort
 * - Filter
 * - Row Selection
 * - Pagination
 * 
 */
const features = tableFeatures({
  rowSortingFeature, // enables sorting APIs and state
  sortedRowModel: createSortedRowModel(), // client-side sorting
  sortFns,
})

const queryKey = ['pet_emar_schedule'];

export const PetEMARGrid: React.FC<PetEMARGridProps> = ({
  selectedDate = new Date().toISOString().split('T')[0],
}) => {
  const queryClient = useQueryClient();
  const parentRef = useRef<HTMLDivElement>(null);

  // Modal States
  const [completeModalItem, setCompleteModalItem] =
    useState<TaskScheduleViewItem | null>(null);

  // 1. Fetch Task Schedule Details from PostgreSQL View
  const { data: rawScheduleData = [], isLoading } = useQuery<
    TaskScheduleViewItem[]
  >({
    queryKey: ['pet_emar_schedule', selectedDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_pet_task_details')
        .select('*')
        .gte('due_on', `${selectedDate}T00:00:00Z`)
        .lte('due_on', `${selectedDate}T23:59:59Z`)
        .order('due_on', { ascending: true });

      if (error) throw error;
      return data as TaskScheduleViewItem[];
    },
  });

  // 2. Compute Dynamic Time Slot Header Columns
  const dynamicTimeSlots = useMemo(() => {
    const timeSet = new Set<string>(DEFAULT_MEAL_TIMES);

    rawScheduleData.forEach((item) => {
      const timeStr = new Date(item.due_on).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      timeSet.add(timeStr);
    });

    return Array.from(timeSet).sort();
  }, [rawScheduleData]);

  // 3. Transform Raw Schedule Data into Row-per-Task Format
  const tableData: EMARRowData[] = useMemo(() => {
    const taskMap = new Map<string, EMARRowData>();

    rawScheduleData.forEach((item) => {
      const timeStr = new Date(item.due_on).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

      if (!taskMap.has(item.task_id)) {
        taskMap.set(item.task_id, {
          task_id: item.task_id,
          pet_name: item.pet_name,
          title: item.task_title,
          description: item.description || 'No special instructions provided.',
          priority: item.task_priority,
          due_date_formatted: new Date(item.due_on).toLocaleDateString([], {
            month: 'short',
            day: 'numeric',
          }),
          schedule_summary:
            item.schedule_frequency_summary || 'SCHEDULED ROUTINE',
          timeSlots: {},
        });
      }

      const row = taskMap.get(item.task_id)!;
      row.timeSlots[timeStr] = item;
    });

    return Array.from(taskMap.values());
  }, [rawScheduleData]);

  // 4. Mutations for Database Updates
  const completeTaskMutation = useMutation({
    mutationFn: async (payload: {
      schedule_id: string;
      pet_id: string;
      delivered_amount_value: number;
      delivered_amount_unit: string;
      user_comment: string;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      const currentUserId = userData.user?.id;

      // Update Schedule Record
      const { error: updateError } = await supabase
        .schema('pets')
        .from('pet_task_schedule')
        .update({
          status: 'COMPLETED',
          delivered_amount_value: payload.delivered_amount_value,
          delivered_amount_unit: payload.delivered_amount_unit,
          updated_at: new Date().toISOString(),
        })
        .eq('schedule_id', payload.schedule_id);

      if (updateError) throw updateError;

      // Insert Audit Action Record
      if (currentUserId) {
        const { error: actionError } = await supabase
          .schema('pets')
          .from('pet_task_actions')
          .insert({
            schedule_id: payload.schedule_id,
            pet_id: payload.pet_id,
            user_id: currentUserId,
            action_name: 'COMPLETED',
            user_comment: payload.user_comment,
            task_amount_value: payload.delivered_amount_value,
            task_amount_unit: payload.delivered_amount_unit,
          });

        if (actionError) throw actionError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setCompleteModalItem(null);
    },
  });

  const quickStatusMutation = useMutation({
    mutationFn: async ({
      item,
      status,
      actionName,
      comment = '',
    }: {
      item: TaskScheduleViewItem;
      status: ScheduleStatus;
      actionName: ActionType;
      comment?: string;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      const currentUserId = userData.user?.id;

      const { error: updateError } = await supabase
        .schema('pets')
        .from('pet_task_schedule')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('schedule_id', item.schedule_id);

      if (updateError) throw updateError;

      if (currentUserId) {
        await supabase
          .schema('pets')
          .from('pet_task_actions')
          .insert({
            schedule_id: item.schedule_id,
            pet_id: item.pet_id,
            user_id: currentUserId,
            action_name: actionName,
            user_comment: comment,
          });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // 5. TanStack Table Column Definitions
  const columns = useMemo<ColumnDef<EMARRowData>[]>(() => {
    // Leftmost Column: Task Metadata
    const mainCol: ColumnDef<EMARRowData> = {
      id: 'task_info',
      header: 'Task & Schedule Info',
      size: 320,
      cell: ({ row }) => {

        return (
          <div className="flex flex-col gap-1 p-2">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-sm text-foreground truncate">
                {row.original.title}
              </span>
              <Badge
                variant="outline"
                className={`text-[10px] px-1.5 py-0 ${priorityColors[row.original.priority]
                  }`}
              >
                {row.original.priority}
              </Badge>
            </div>

            <p className="text-xs text-muted-foreground line-clamp-1 italic">
              {row.original.pet_name} — {row.original.description}
            </p>

            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                <Calendar className="w-3 h-3 text-primary" />
                {row.original.due_date_formatted}
              </span>
              <span>•</span>
              <span className="truncate bg-muted px-1.5 py-0.5 rounded text-[10px]">
                {row.original.schedule_summary}
              </span>
            </div>
          </div>
        );
      },
    };

    // Top Header Columns: Time Slots
    const timeCols: ColumnDef<EMARRowData>[] = dynamicTimeSlots.map(
      (timeSlot) => ({
        id: `slot_${timeSlot}`,
        header: () => (
          <div className="flex items-center justify-center gap-1 text-xs font-semibold">
            <Clock className="w-3 h-3 text-muted-foreground" />
            {timeSlot}
          </div>
        ),
        size: 140,
        cell: ({ row }) => {
          const item = row.original.timeSlots[timeSlot];
          if (!item) {
            return (
              <div className="h-full w-full flex items-center justify-center text-slate-300 dark:text-slate-700">
                —
              </div>
            );
          }

          const isCompleted = item.schedule_status === 'COMPLETED';
          const isOverdue = item.is_overdue || item.schedule_status === 'OVERDUE';
          const isSkipped = item.schedule_status === 'SKIPPED';
          const isCancelled = item.schedule_status === 'CANCELLED';

          return (
            <ContextMenu>
              <ContextMenuTrigger className="w-full h-full block">
                <div
                  onClick={() => {
                    if (!isCompleted && !isCancelled) {
                      setCompleteModalItem(item);
                    }
                  }}
                  className={`w-full h-full p-2 rounded-md border text-xs cursor-pointer transition-all flex flex-col justify-between ${isCompleted
                    ? 'bg-emerald-50 border-emerald-300 dark:bg-emerald-950/30 dark:border-emerald-800'
                    : isOverdue
                      ? 'bg-rose-50 border-rose-300 hover:bg-rose-100 dark:bg-rose-950/30'
                      : isSkipped
                        ? 'bg-slate-100 border-slate-300 text-muted-foreground'
                        : isCancelled
                          ? 'bg-gray-100 border-gray-200 opacity-60'
                          : 'bg-amber-50/60 border-amber-200 hover:bg-amber-100 dark:bg-amber-950/20'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[11px]">
                      {item.expected_amount || item.total_amount || '1 dose'}
                    </span>

                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : isOverdue ? (
                      <AlertCircle className="w-4 h-4 text-rose-600 animate-pulse" />
                    ) : isSkipped ? (
                      <SkipForward className="w-4 h-4 text-slate-500" />
                    ) : isCancelled ? (
                      <XCircle className="w-4 h-4 text-gray-400" />
                    ) : (
                      <Clock className="w-4 h-4 text-amber-600" />
                    )}
                  </div>

                  <div className="mt-1 flex items-center justify-between text-[10px]">
                    <span
                      className={`font-medium ${isCompleted
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : isOverdue
                          ? 'text-rose-700 dark:text-rose-400'
                          : 'text-slate-600 dark:text-slate-400'
                        }`}
                    >
                      {item.schedule_status}
                    </span>
                    {item.delivered_amount && (
                      <span className="text-emerald-800 font-bold dark:text-emerald-300">
                        {item.delivered_amount}
                      </span>
                    )}
                  </div>
                </div>
              </ContextMenuTrigger>

              {/* Context Menu on Right Click */}
              <ContextMenuContent className="w-48">
                {!isCompleted && (
                  <ContextMenuItem
                    onClick={() => setCompleteModalItem(item)}
                    className="gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Complete / Administer
                  </ContextMenuItem>
                )}
                <ContextMenuItem
                  onClick={() =>
                    quickStatusMutation.mutate({
                      item,
                      status: 'SKIPPED',
                      actionName: 'SKIPPED',
                      comment: 'Skipped via quick context menu',
                    })
                  }
                  className="gap-2"
                >
                  <SkipForward className="w-4 h-4 text-slate-500" />
                  Skip Dose
                </ContextMenuItem>
                <ContextMenuItem
                  onClick={() =>
                    quickStatusMutation.mutate({
                      item,
                      status: 'CANCELLED',
                      actionName: 'CANCELLED',
                      comment: 'Cancelled via eMAR menu',
                    })
                  }
                  className="gap-2 text-rose-600"
                >
                  <XCircle className="w-4 h-4" />
                  Cancel Task
                </ContextMenuItem>

                <ContextMenuSeparator />

                <ContextMenuItem
                  onClick={() => {
                    const promptComment = prompt('Enter comment / audit note:');
                    if (promptComment) {
                      quickStatusMutation.mutate({
                        item,
                        status: item.schedule_status,
                        actionName: 'REASSIGNED',
                        comment: promptComment,
                      });
                    }
                  }}
                  className="gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Add Audit Comment
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          );
        },
      })
    );

    return [mainCol, ...timeCols];
  }, [dynamicTimeSlots, quickStatusMutation]);

  // 6. TanStack Table Instance
  const table = useTable({
    data: tableData,
    columns,
    createCoreRowModel: createCoreRowModel(),
  });

  const { rows } = table.getRowModel();

  // 7. Virtualization Setup
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 76,
    overscan: 5,
  });

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Header Toolbar */}
      <div className="flex items-center justify-between bg-card p-4 rounded-lg border shadow-sm">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Pet eMAR Board</h2>
          <p className="text-xs text-muted-foreground">
            Electronic Medication & Task Administration for {selectedDate}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Plus className="w-4 h-4" />
            Add Time Slot
          </Button>
        </div>
      </div>

      {/* Grid Table Wrapper */}
      <div
        ref={parentRef}
        className="w-full overflow-auto rounded-lg border bg-background max-h-[650px] shadow-sm"
      >
        <table className="w-full border-collapse text-left">
          <thead className="sticky top-0 z-20 bg-muted/90 backdrop-blur border-b">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    style={{ width: header.getSize() }}
                    className="p-3 text-xs font-bold text-muted-foreground border-r last:border-r-0"
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              position: 'relative',
            }}
            className="divide-y"
          >
            {isLoading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="p-8 text-center text-muted-foreground"
                >
                  Loading eMAR Schedule...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="p-8 text-center text-muted-foreground"
                >
                  No pet task schedules found for this date.
                </td>
              </tr>
            ) : (
              rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const row = rows[virtualRow.index];
                return (
                  <tr
                    key={row.id}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        style={{ width: cell.column.getSize() }}
                        className="p-1 border-r last:border-r-0 align-middle"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Completion Modal */}
      <CompleteTaskModal
        item={completeModalItem}
        isOpen={!!completeModalItem}
        onClose={() => setCompleteModalItem(null)}
        onSubmit={(payload) => completeTaskMutation.mutate(payload)}
        isSubmitting={completeTaskMutation.isPending}
      />
    </div>
  );
};
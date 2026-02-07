import React, { useEffect, useState } from 'react';
import { Bot, CheckCircle, Clock, FileText, ShoppingBag, Calendar, XCircle, Loader2, Search, Edit } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useStore } from '../../lib/store';
import { supabase } from '../../lib/supabase';

interface TaskLogItem {
  id: string;
  task_type: string;
  task_title: string;
  task_details: any;
  task_status: 'pending' | 'success' | 'failed';
  created_at: string;
}

export const TaskLog: React.FC = () => {
  const { selectedConversationId } = useStore();
  const [tasks, setTasks] = useState<TaskLogItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedConversationId) {
      setTasks([]);
      return;
    }

    const fetchTasks = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('ai_task_logs')
        .select('*')
        .eq('conversation_id', selectedConversationId)
        .order('created_at', { ascending: false }); // Newest first

      if (data) {
        setTasks(data);
      }
      setLoading(false);
    };

    fetchTasks();

    // Subscribe to new logs
    const channel = supabase
      .channel(`task-logs-${selectedConversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ai_task_logs',
          filter: `conversation_id=eq.${selectedConversationId}`,
        },
        (payload) => {
          setTasks((prev) => [payload.new as TaskLogItem, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversationId]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'booking': return Calendar;
      case 'update_booking': return Edit;
      case 'check_availability': return Search;
      case 'order': return ShoppingBag;
      case 'product': return ShoppingBag;
      case 'faq': return FileText;
      default: return CheckCircle;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <div className="h-2 w-2 rounded-full bg-green-500" />;
      case 'failed': return <div className="h-2 w-2 rounded-full bg-red-500" />;
      case 'pending': return <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />;
      default: return <div className="h-2 w-2 rounded-full bg-gray-500" />;
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!selectedConversationId) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex justify-between items-center">
        <span>AI Task Log</span>
        {loading && <Loader2 className="h-3 w-3 animate-spin" />}
      </h3>
      
      {tasks.length === 0 && !loading ? (
        <p className="text-xs text-gray-400 italic ml-3">No AI actions recorded yet.</p>
      ) : (
        <div className="relative border-l-2 border-gray-100 ml-3 space-y-6">
          {tasks.map((task) => {
            const Icon = getIcon(task.task_type);
            return (
              <div key={task.id} className="relative pl-6 animate-in fade-in slide-in-from-left-2 duration-300">
                <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-white border-2 border-gray-100 flex items-center justify-center">
                  {getStatusIcon(task.task_status)}
                </div>
                
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">{task.task_title}</span>
                    <span className="text-xs text-gray-400">{formatTime(task.created_at)}</span>
                  </div>
                  <div className="flex items-start gap-2 bg-gray-50 p-2 rounded text-xs text-gray-600 border border-gray-100">
                    <Icon className="h-3 w-3 mt-0.5 text-gray-500 flex-shrink-0" />
                    <span className="break-words">
                        {/* Display relevant details based on type */}
                        {task.task_type === 'booking' && `Booking for ${task.task_details.customer_name} on ${task.task_details.date} at ${task.task_details.time}`}
                        {task.task_type === 'create_booking' && `Booking for ${task.task_details.customer_name} on ${task.task_details.date} at ${task.task_details.time}`}
                        {task.task_type === 'update_booking' && `Update Booking ${task.task_details.booking_id} to ${task.task_details.date || 'same date'} at ${task.task_details.time || 'same time'}`}
                        {task.task_type === 'check_availability' && `Check slots for ${task.task_details.date}`}
                        {task.task_type === 'order' && `Order: ${task.task_details.quantity}x ${task.task_details.product_name} for ${task.task_details.customer_name}`}
                        {task.task_type === 'create_order' && `Order: ${task.task_details.items?.length} items for ${task.task_details.customer_name}`}
                        {!['booking', 'create_booking', 'update_booking', 'check_availability', 'order', 'create_order'].includes(task.task_type) && JSON.stringify(task.task_details)}
                        {task.task_status === 'failed' && <span className="text-red-500 block mt-1">Error: {task.task_details.error}</span>}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {tasks.length > 5 && (
        <div className="pt-2 text-center">
          <button className="text-xs text-blue-600 hover:underline">
            View full history
          </button>
        </div>
      )}
    </div>
  );
};

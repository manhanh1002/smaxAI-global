import React from 'react';
import { CheckCircle2, Circle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../common/Card';
import { Button } from '../common/Button';

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  isCompleted: boolean;
  link?: string;
  actionLabel?: string;
}

interface DashboardChecklistProps {
  items: ChecklistItem[];
}

export const DashboardChecklist: React.FC<DashboardChecklistProps> = ({ items }) => {
  const completedCount = items.filter(i => i.isCompleted).length;
  const progress = Math.round((completedCount / items.length) * 100);

  return (
    <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Setup Checklist</h2>
          <p className="text-sm text-gray-600">Complete these steps to get the most out of your AI assistant.</p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-4">
           <div className="text-right">
             <span className="text-sm font-medium text-blue-700">{progress}% Complete</span>
             <div className="w-32 h-2 bg-blue-200 rounded-full mt-1">
               <div 
                 className="h-full bg-blue-600 rounded-full transition-all duration-500"
                 style={{ width: `${progress}%` }}
               />
             </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((item) => (
          <div 
            key={item.id}
            className={`
              p-4 rounded-lg border transition-all
              ${item.isCompleted 
                ? 'bg-white border-green-100 shadow-sm' 
                : 'bg-white border-gray-200 hover:border-blue-300 shadow-sm'}
            `}
          >
            <div className="flex items-start gap-3">
              {item.isCompleted ? (
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              ) : (
                <Circle className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
              )}
              
              <div className="flex-1">
                <h3 className={`text-sm font-semibold ${item.isCompleted ? 'text-gray-900' : 'text-gray-700'}`}>
                  {item.label}
                </h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                  {item.description}
                </p>
                
                {!item.isCompleted && item.link && (
                  <Link to={item.link} className="inline-block mt-3">
                    <Button size="sm" variant="outline" className="h-7 text-xs px-2">
                      {item.actionLabel || 'Start'} <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

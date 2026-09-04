'use client';

import React from 'react';
import { RoadmapTask } from '@/lib/roadmap/types';
import { Button } from '@/components/ui/Button';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface TaskReopenModalProps {
  isOpen: boolean;
  task: RoadmapTask | null;
  onConfirm: () => void;
  onClose: () => void;
}

export const TaskReopenModal: React.FC<TaskReopenModalProps> = ({
  isOpen,
  task,
  onConfirm,
  onClose,
}) => {
  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">
              Reopen Roadmap Task?
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Are you sure you want to mark this task as incomplete?
            </p>
          </div>
        </div>

        {/* Task preview box */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            Task Selected
          </span>
          <p className="text-sm font-bold text-slate-800">
            {task.title}
          </p>
          {task.satisfiedByProfile && (
            <p className="text-[11px] text-amber-700 font-medium pt-1">
              Note: This task is linked to your business profile answers. Updating it manually will log a reopen activity.
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="border-slate-200 text-slate-700"
          >
            Cancel
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="bg-amber-600 hover:bg-amber-500 text-white gap-1.5 shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Yes, Mark Incomplete</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

'use client';

import { useRouter } from 'next/navigation';
import { ArrowRight, BarChart2 } from 'lucide-react';
import type { ModuleDefinition } from '../lib/modules';
import { MODULE_ICONS } from '../lib/module-icons';
import { cn } from '../lib/cn';

interface ModuleCardProps {
  module: ModuleDefinition;
  index: number;
}

export function ModuleCard({ module: mod, index }: ModuleCardProps) {
  const router = useRouter();
  const Icon = MODULE_ICONS[mod.id] ?? BarChart2;

  return (
    <button
      onClick={() => router.push(mod.route)}
      style={{ animationDelay: `${index * 60}ms` }}
      className={cn(
        'group relative flex w-full flex-col rounded-2xl border border-gray-200 bg-white p-6 text-left',
        'shadow-sm transition-all duration-200',
        'hover:shadow-md hover:-translate-y-0.5',
        mod.borderColor,
        'animate-slide-up opacity-0 [animation-fill-mode:forwards]',
      )}
    >
      {mod.badge && (
        <span className="absolute right-4 top-4 rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-500">
          {mod.badge}
        </span>
      )}

      <div className={cn('mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br shadow-sm', mod.gradient)}>
        <Icon size={20} className={mod.iconColor} />
      </div>

      <div className="flex-1">
        <h3 className="text-base font-semibold text-gray-900">{mod.name}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{mod.description}</p>
      </div>

      <div className="mt-5 flex items-center gap-1.5 text-sm font-medium text-indigo-600 opacity-0 translate-y-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0">
        Open module
        <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
      </div>
    </button>
  );
}

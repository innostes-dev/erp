'use client';

import { useState } from 'react';
import {
  KanbanBoard,
  KanbanColumn,
  moveKanbanItem,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  Badge,
  Button,
  Avatar,
  AvatarFallback,
  toast,
} from '@innostes/ui';
import { Briefcase, Star, Clock, IndianRupee, Mail, CheckCircle2 } from 'lucide-react';
import { NORTHWIND_CANDIDATES, Candidate } from '../_data/northwind';

export default function HiringPipelineExample() {
  const [columns, setColumns] = useState<KanbanColumn<Candidate>[]>([
    {
      id: 'Applied',
      title: 'Applied',
      tone: 'neutral',
      items: NORTHWIND_CANDIDATES.filter((c) => c.stage === 'Applied'),
    },
    {
      id: 'Screening',
      title: 'HR Screening',
      tone: 'info',
      items: NORTHWIND_CANDIDATES.filter((c) => c.stage === 'Screening'),
    },
    {
      id: 'Technical',
      title: 'Technical Evaluation',
      tone: 'warning',
      items: NORTHWIND_CANDIDATES.filter((c) => c.stage === 'Technical'),
    },
    {
      id: 'Offer',
      title: 'Offer Extended',
      tone: 'primary',
      items: NORTHWIND_CANDIDATES.filter((c) => c.stage === 'Offer'),
    },
    {
      id: 'Hired',
      title: 'Onboarded',
      tone: 'success',
      items: NORTHWIND_CANDIDATES.filter((c) => c.stage === 'Hired'),
    },
  ]);

  const [activeCandidate, setActiveCandidate] = useState<Candidate | null>(null);

  const handleCardMove = (newCols: KanbanColumn<Candidate>[], move: any) => {
    setColumns(newCols);
    toast('Candidate stage updated', {
      description: `Moved candidate to ${move.toColumnId}.`,
    });
  };

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('');

  return (
    <div className="p-6 space-y-6 bg-background border rounded-lg">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Talent acquisition pipeline</h2>
          <p className="text-sm text-muted-foreground">
            Northwind Traders Pvt Ltd supply chain and logistics recruitment Kanban board.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => toast('Opening candidate requisition form')}>
          Add candidate
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="overflow-x-auto pb-4">
        <KanbanBoard
          aria-label="Recruitment candidate pipeline"
          value={columns}
          onValueChange={handleCardMove}
          getItemLabel={(item) => `${item.name} - ${item.role}`}
          onCardOpen={(candidate) => setActiveCandidate(candidate)}
          renderCard={(candidate) => (
            <div className="p-3 space-y-2.5 cursor-pointer">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-semibold text-sm text-foreground">{candidate.name}</h4>
                  <p className="text-xs text-muted-foreground">{candidate.role}</p>
                </div>
                <Avatar className="h-7 w-7 text-[10px]">
                  <AvatarFallback>{getInitials(candidate.name)}</AvatarFallback>
                </Avatar>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t">
                <span className="font-medium text-foreground">
                  ₹{(candidate.expectedSalary / 100000).toFixed(1)}L CTC
                </span>
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  {candidate.rating}.0
                </span>
              </div>
            </div>
          )}
        />
      </div>

      {/* Candidate Inspector Drawer */}
      <Sheet open={Boolean(activeCandidate)} onOpenChange={(open) => !open && setActiveCandidate(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md p-6 space-y-6">
          <SheetHeader>
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 text-base font-bold">
                <AvatarFallback>{activeCandidate ? getInitials(activeCandidate.name) : ''}</AvatarFallback>
              </Avatar>
              <div>
                <SheetTitle className="text-xl">{activeCandidate?.name}</SheetTitle>
                <SheetDescription>{activeCandidate?.role}</SheetDescription>
              </div>
            </div>
          </SheetHeader>

          {activeCandidate && (
            <div className="space-y-5 text-sm">
              <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted/40 border">
                <div>
                  <span className="text-xs text-muted-foreground block">Experience</span>
                  <span className="font-semibold text-foreground">{activeCandidate.experienceYears} Years</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Expected CTC</span>
                  <span className="font-semibold text-foreground">
                    ₹{(activeCandidate.expectedSalary / 100000).toFixed(2)} Lakhs
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Notice Period</span>
                  <span className="font-semibold text-foreground">{activeCandidate.noticePeriodDays} Days</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Interviewer Rating</span>
                  <span className="font-semibold text-foreground flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    {activeCandidate.rating}.0 / 5.0
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Assessment Notes
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed bg-card p-3 rounded-md border">
                  {activeCandidate.notes}
                </p>
              </div>

              <div className="pt-4 flex gap-2">
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={() => {
                    toast(`Advancing ${activeCandidate.name} to next stage`);
                    setActiveCandidate(null);
                  }}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1.5" />
                  Advance stage
                </Button>
                <Button variant="outline" onClick={() => setActiveCandidate(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

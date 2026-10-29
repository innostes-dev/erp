'use client';

import React, { useState } from 'react';
import { Button } from '@innostes/ui';
import { CheckCircle2, XCircle, ArrowUpRight, FileText, Building2 } from 'lucide-react';

export function HeroDemo() {
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');

  return (
    <div className="not-prose my-8 overflow-hidden rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Building2 className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">Purchase Order PO-2026-0881</h3>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  status === 'approved'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                    : status === 'rejected'
                      ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                      : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                }`}
              >
                {status === 'approved' ? 'Approved' : status === 'rejected' ? 'Rejected' : 'Pending Approval'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Northwind Traders Pvt Ltd • Karnataka Warehouse</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {status === 'pending' ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStatus('rejected')}
              >
                <XCircle className="size-3.5 me-1.5 text-destructive" />
                Reject
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setStatus('approved')}
              >
                <CheckCircle2 className="size-3.5 me-1.5" />
                Approve PO
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStatus('pending')}
            >
              Reset Demo
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 pt-5 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-muted/20 p-3">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Total Value</span>
          <div className="mt-1 text-lg font-semibold text-foreground">₹1,45,280.00</div>
          <div className="mt-0.5 flex items-center text-[11px] text-emerald-700 dark:text-emerald-400">
            <ArrowUpRight className="size-3 me-0.5" />
            +8.4% vs last procurement run
          </div>
        </div>

        <div className="rounded-lg border border-border bg-muted/20 p-3">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Vendor Details</span>
          <div className="mt-1 text-sm font-semibold text-foreground">Hindustan Industrial Spares</div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">GSTIN: 29AAAAA0000A1Z5</div>
        </div>

        <div className="rounded-lg border border-border bg-muted/20 p-3">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Payment Terms</span>
          <div className="mt-1 text-sm font-semibold text-foreground">Net 30 Days</div>
          <div className="mt-0.5 flex items-center text-[11px] text-muted-foreground">
            <FileText className="size-3 me-1" />
            Invoice attached (#INV-4902)
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  MetricCard,
  MetricGrid,
} from '@innostes/ui';
import { MoreHorizontal, RefreshCw, ShoppingCart, Users } from 'lucide-react';

export default function MetricCardStatesDemo() {
  const [loading, setLoading] = useState(false);

  return (
    <div className="flex w-full flex-col gap-4">
      <Button
        size="sm"
        variant="outline"
        className="w-fit"
        startIcon={<RefreshCw />}
        loading={loading}
        onClick={() => {
          setLoading(true);
          setTimeout(() => setLoading(false), 1500);
        }}
      >
        Reload
      </Button>
      <MetricGrid>
        {/* Clickable: the whole card is a link */}
        <MetricCard
          render={<a href="#metric-card" />}
          label="Orders"
          value="1,284"
          icon={<ShoppingCart />}
          delta={0.041}
          comparison="vs last month"
          loading={loading}
          footer="Click the card to open the orders list"
        />
        {/* With a menu */}
        <MetricCard
          label="Active users"
          value="3,912"
          icon={<Users />}
          tone="chart-2"
          delta="+214"
          comparison="this week"
          loading={loading}
          action={
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="sm"
                    iconOnly
                    aria-label="Metric options"
                  />
                }
              >
                <MoreHorizontal />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>View report</DropdownMenuItem>
                <DropdownMenuItem>Export CSV</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          }
        />
      </MetricGrid>
    </div>
  );
}

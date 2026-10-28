'use client';

import { Stat } from '@innostes/ui';
import { CreditCard, IndianRupee, Package, RotateCcw } from 'lucide-react';

export default function StatDemo() {
  return (
    <div className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Stat
        label="Monthly revenue"
        value="₹48,25,000"
        delta="+14.2%"
        helper="vs previous month"
        icon={<IndianRupee />}
      />
      <Stat
        label="Dispatched orders"
        value="2,480"
        delta="+6.8%"
        helper="vs previous month"
        icon={<Package />}
      />
      <Stat
        label="Average PO value"
        value="₹19,450"
        delta="-1.5%"
        helper="vs previous month"
        icon={<CreditCard />}
      />
      <Stat
        label="Return rate"
        value="1.2%"
        delta="+0.3%"
        upIsGood={false}
        helper="vs target of 1.0%"
        icon={<RotateCcw />}
      />
    </div>
  );
}

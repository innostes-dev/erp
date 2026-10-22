'use client';

import { Stat } from '@innostes/ui';
import { CreditCard, Euro, ShoppingCart, UserMinus } from 'lucide-react';

export default function StatDemo() {
  return (
    <div className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Stat
        label="Revenue"
        value="€48,250"
        delta="+12.5%"
        helper="vs last month"
        icon={<Euro />}
      />
      <Stat
        label="Orders"
        value="1,284"
        delta="+4.1%"
        helper="vs last month"
        icon={<ShoppingCart />}
      />
      <Stat
        label="Avg. order"
        value="€37.58"
        delta="-2.3%"
        helper="vs last month"
        icon={<CreditCard />}
      />
      <Stat
        label="Churn"
        value="2.1%"
        delta="+0.4%"
        upIsGood={false}
        helper="vs last month"
        icon={<UserMinus />}
      />
    </div>
  );
}

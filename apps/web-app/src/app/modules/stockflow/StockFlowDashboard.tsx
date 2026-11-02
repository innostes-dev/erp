import { Badge, Button, Card } from '@innostes/ui';
import {
  Boxes,
  AlertTriangle,
  Plus,
  RotateCcw,
} from 'lucide-react';

export function StockFlowDashboard() {
  return (
    <div className="flex flex-col gap-6">
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-rose-500/10 via-rose-500/5 to-transparent border border-rose-500/20">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">StockFlow Cockpit 📦</h1>
            <Badge variant="outline" className="border-rose-500/30 text-rose-600 bg-rose-500/5">
              Multi-Warehouse Flow
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Cost Valuation: Moving Average (AVCO) • 3 Warehouses (Bangalore Central, Mumbai 3PL, Delhi Hub)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="primary" startIcon={<Plus className="size-4" />}>
            New Purchase Order
          </Button>
          <Button size="sm" variant="outline" startIcon={<RotateCcw className="size-4" />}>
            Stock Adjustment
          </Button>
        </div>
      </div>

      {/* 2. Core Stock Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border-border bg-card shadow-xs">
          <span className="text-xs text-muted-foreground uppercase font-semibold">Total Stock Valuation</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-foreground">$890,400</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">1,240 Total Stocked SKUs</p>
        </Card>

        <Card className="p-4 border-border bg-card shadow-xs">
          <span className="text-xs text-muted-foreground uppercase font-semibold">Low Stock Warnings</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-rose-600">6 Items</span>
          </div>
          <p className="text-[11px] text-rose-600 font-semibold mt-2">Below Reorder Point (ROP)</p>
        </Card>

        <Card className="p-4 border-border bg-card shadow-xs">
          <span className="text-xs text-muted-foreground uppercase font-semibold">Open Purchase Orders</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-foreground">14 Orders</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">$142,000 committed</p>
        </Card>

        <Card className="p-4 border-border bg-card shadow-xs">
          <span className="text-xs text-muted-foreground uppercase font-semibold">Receiving Dock Queue</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-foreground">3 GRN Due</span>
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold mt-2">Expected today</p>
        </Card>
      </div>

      {/* 3. Critical Low Stock Table & Warehouse Utilization */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Low Stock Items Requiring Reorder */}
        <Card className="lg:col-span-2 p-6 border-border bg-card shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-rose-500" />
              <h2 className="text-sm font-semibold text-foreground">Critical Reorder Alerts</h2>
            </div>
            <Badge variant="destructive">Immediate Action</Badge>
          </div>

          <div className="flex flex-col gap-3">
            <div className="p-3 rounded-xl border border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-foreground">ARM-CORTEX-M4 Microcontroller (MCU-402)</span>
                  <Badge variant="destructive" className="text-[10px]">Stock Critical</Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Available: <strong className="text-rose-600 font-bold">45 units</strong> • Reorder Point: 200 units • Supplier Lead Time: 14 Days
                </p>
              </div>
              <Button size="sm" variant="primary">
                + Create PO
              </Button>
            </div>

            <div className="p-3 rounded-xl border border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-foreground">Lithium-Ion Battery Pack 5000mAh (BAT-50)</span>
                  <Badge variant="warning" className="text-[10px]">Low Stock</Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Available: <strong className="text-amber-600 font-bold">82 units</strong> • Reorder Point: 150 units • Supplier Lead Time: 7 Days
                </p>
              </div>
              <Button size="sm" variant="primary">
                + Create PO
              </Button>
            </div>

            <div className="p-3 rounded-xl border border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-foreground">CNC Aluminum Enclosure V2 (ENC-ALU-02)</span>
                  <Badge variant="warning" className="text-[10px]">Low Stock</Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Available: <strong className="text-amber-600 font-bold">18 units</strong> • Reorder Point: 50 units • Supplier Lead Time: 10 Days
                </p>
              </div>
              <Button size="sm" variant="primary">
                + Create PO
              </Button>
            </div>
          </div>
        </Card>

        {/* Warehouse Storage Capacities */}
        <Card className="p-6 border-border bg-card shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
              <div className="flex items-center gap-2">
                <Boxes className="size-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">Warehouse Locations</h2>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="p-3 rounded-xl bg-muted/20 border border-border">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground">Bangalore Central Warehouse</span>
                  <span className="font-semibold text-foreground">84% Full</span>
                </div>
                <div className="w-full bg-muted/60 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-primary h-full rounded-full" style={{ width: '84%' }} />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1.5">Aisle A1–D4 • 840 Pallet Bins</p>
              </div>

              <div className="p-3 rounded-xl bg-muted/20 border border-border">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground">Mumbai 3PL Distribution Center</span>
                  <span className="font-semibold text-foreground">58% Full</span>
                </div>
                <div className="w-full bg-muted/60 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-primary h-full rounded-full" style={{ width: '58%' }} />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1.5">Dock Bays 1–3 • 400 Pallet Bins</p>
              </div>

              <div className="p-3 rounded-xl bg-muted/20 border border-border">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground">Delhi North Regional Transit</span>
                  <span className="font-semibold text-foreground">32% Full</span>
                </div>
                <div className="w-full bg-muted/60 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-primary h-full rounded-full" style={{ width: '32%' }} />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1.5">Cross-Docking • 200 Pallet Bins</p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>Perpetual GL Valuation:</span>
            <strong className="text-emerald-600 font-semibold">100% Invariant Pass</strong>
          </div>
        </Card>
      </div>
    </div>
  );
}

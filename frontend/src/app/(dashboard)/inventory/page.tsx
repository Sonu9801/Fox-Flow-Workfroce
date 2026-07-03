"use client";

import React, { useState, useMemo } from "react";
import type { ColumnDef } from "@/components/ui/DataTable";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useInventory, useAdjustStock } from "@/hooks/useQueries";
import type { InventoryItem } from "@/types";
import { AlertTriangle, Download, PackageOpen, RefreshCw } from "lucide-react";
import { toast } from "sonner";

function StockLevel({ item }: { item: InventoryItem }) {
  const ratio = item.stockLevel / Math.max(item.reorderLevel * 3, 1);
  const isLow = item.stockLevel <= item.reorderLevel;
  const isWarn = item.stockLevel <= item.reorderLevel * 1.5 && !isLow;
  const barCls = isLow
    ? "bg-destructive"
    : isWarn
      ? "bg-warning"
      : "bg-success";
  const textCls = isLow
    ? "text-destructive"
    : isWarn
      ? "text-warning"
      : "text-success";
  return (
    <div className="flex items-center gap-2 min-w-24">
      <span className={cn("tabular-nums font-bold", textCls)}>
        {item.stockLevel}
      </span>
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full", barCls)}
          style={{ width: `${Math.min(100, ratio * 100)}%` }}
        />
      </div>
    </div>
  );
}

function StockStatusBadge({ item }: { item: InventoryItem }) {
  const isLow = item.stockLevel <= item.reorderLevel;
  const isWarn = item.stockLevel <= item.reorderLevel * 1.5 && !isLow;
  if (isLow)
    return (
      <span className="text-[10px] font-semibold px-2 py-0.5 bg-destructive/15 text-destructive rounded border border-destructive/20">
        Reorder
      </span>
    );
  if (isWarn)
    return (
      <span className="text-[10px] font-semibold px-2 py-0.5 bg-warning/15 text-warning rounded border border-warning/20">
        Low
      </span>
    );
  return (
    <span className="text-[10px] font-semibold px-2 py-0.5 bg-success/15 text-success rounded border border-success/20">
      OK
    </span>
  );
}

function InventoryExpand({ item }: { item: InventoryItem }) {
  const adjustMutation = useAdjustStock();
  const [orderQty, setOrderQty] = useState(item.reorderLevel * 3);

  const handlePlaceOrder = () => {
    adjustMutation.mutate({ id: item.id, quantity: orderQty }, {
      onSuccess: () => {
        toast.success(`Reorder placed for ${orderQty} units of ${item.partName}`);
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.detail || "Failed to place reorder");
      }
    });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-muted/10 rounded-xl border border-border/50">
      <div>
        <p className="text-xs font-semibold text-foreground mb-1">
          Usage History (30d)
        </p>
        <div className="flex items-end gap-1 h-10">
          {[
            { v: 65, k: "w1" },
            { v: 80, k: "w2" },
            { v: 45, k: "w3" },
            { v: 90, k: "w4" },
            { v: 60, k: "w5" },
            { v: 75, k: "w6" },
            { v: item.stockLevel, k: "now" },
          ].map(({ v, k }) => (
            <div
              key={k}
              className="flex-1 bg-primary/30 rounded-sm"
              style={{ height: `${Math.min(100, Math.max(10, (v / 250) * 100))}%` }}
            />
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">Past 7 weeks</p>
      </div>
      <div>
        <p className="text-xs font-semibold text-foreground mb-1">
          Supplier Info
        </p>
        <p className="text-xs text-muted-foreground">
          Indo Steel Suppliers Pvt. Ltd.
        </p>
        <p className="text-xs text-muted-foreground">Lead time: 3-5 days</p>
        <p className="text-xs text-muted-foreground">Min order: 50 units</p>
      </div>
      <div>
        <p className="text-xs font-semibold text-foreground mb-1">Reorder</p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={orderQty}
            onChange={(e) => setOrderQty(Number(e.target.value))}
            className="w-20 h-7 text-xs bg-muted/40 border border-border rounded-lg px-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <Button
            type="button"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={handlePlaceOrder}
            disabled={adjustMutation.isPending}
          >
            <RefreshCw size={11} className={adjustMutation.isPending ? "animate-spin" : ""} />
            Place Order
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">
          Last updated: {new Date(item.updatedAt).toLocaleDateString("en-IN")}
        </p>
      </div>
    </div>
  );
}

export default function InventoryPage() {
  const { data: inventoryItems = [], isLoading: isLoadingInventory } = useInventory();
  const [lowStockOnly, setLowStockOnly] = useState(false);

  const lowCount = useMemo(() => {
    return inventoryItems.filter(
      (i: InventoryItem) => i.stockLevel <= i.reorderLevel,
    ).length;
  }, [inventoryItems]);

  const displayItems = useMemo(() => {
    return lowStockOnly
      ? inventoryItems.filter((i: InventoryItem) => i.stockLevel <= i.reorderLevel * 1.5)
      : inventoryItems;
  }, [inventoryItems, lowStockOnly]);

  const columns: ColumnDef<InventoryItem>[] = useMemo(() => [
    {
      id: "partName",
      header: "Part Name",
      accessor: (i: InventoryItem) => (
        <span className="font-semibold text-foreground">{i.partName}</span>
      ),
      sortable: true,
    },
    {
      id: "sku",
      header: "SKU",
      accessor: (i: InventoryItem) => (
        <span className="font-mono text-muted-foreground text-[11px]">
          {i.sku}
        </span>
      ),
      sortable: true,
    },
    {
      id: "stock",
      header: "Stock Level",
      accessor: (i: InventoryItem) => <StockLevel item={i} />,
      sortable: true,
    },
    {
      id: "reorderLevel",
      header: "Reorder At",
      accessor: (i: InventoryItem) => (
        <span className="tabular-nums text-muted-foreground">
          {i.reorderLevel}
        </span>
      ),
      sortable: true,
    },
    {
      id: "location",
      header: "Location",
      accessor: (i: InventoryItem) => (
        <span className="text-muted-foreground">{i.location}</span>
      ),
      sortable: true,
    },
    {
      id: "updatedAt",
      header: "Last Updated",
      accessor: (i: InventoryItem) => (
        <span className="tabular-nums text-muted-foreground">
          {new Date(i.updatedAt).toLocaleDateString("en-IN")}
        </span>
      ),
      sortable: true,
    },
    {
      id: "status",
      header: "Status",
      accessor: (i: InventoryItem) => <StockStatusBadge item={i} />,
    },
  ], []);

  if (isLoadingInventory) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        <div className="h-10 w-48 bg-muted rounded-lg" />
        <div className="h-64 bg-card border border-border rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6" data-ocid="inventory.page">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-5 gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">
            Inventory
          </h1>
          <p className="text-sm text-muted-foreground">
            {inventoryItems.length} parts tracked
            {lowCount > 0 && (
              <span className="ml-2 text-warning font-semibold">
                · {lowCount} below reorder level
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lowCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-warning/10 border border-warning/30 rounded-lg">
              <AlertTriangle size={13} className="text-warning" />
              <span className="text-xs font-semibold text-warning">
                {lowCount} need reorder
              </span>
            </div>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => {
              toast.success("Inventory CSV exported");
            }}
            data-ocid="inventory.export_button"
          >
            <Download size={13} />
            Export CSV
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={displayItems}
        rowId={(i) => String(i.id)}
        searchKey={(i) => `${i.partName} ${i.sku}`}
        expandable={(i) => <InventoryExpand item={i} />}
        extraFilters={
          <label
            htmlFor="low-stock-toggle"
            className="flex items-center gap-2 text-xs cursor-pointer select-none"
            data-ocid="inventory.low_stock_toggle"
          >
            <div
              id="low-stock-toggle"
              role="switch"
              aria-checked={lowStockOnly}
              tabIndex={0}
              className={cn(
                "relative w-8 h-4 rounded-full transition-colors cursor-pointer",
                lowStockOnly ? "bg-warning" : "bg-muted-foreground/30",
              )}
              onClick={() => setLowStockOnly((v) => !v)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ")
                  setLowStockOnly((v) => !v);
              }}
            >
              <span
                className={cn(
                  "absolute top-0.5 w-3 h-3 rounded-full bg-card shadow transition-transform",
                  lowStockOnly ? "translate-x-4" : "translate-x-0.5",
                )}
              />
            </div>
            <span className="text-muted-foreground">Low stock only</span>
            {lowStockOnly && <PackageOpen size={12} className="text-warning" />}
          </label>
        }
      />
    </div>
  );
}

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Columns3,
  Search,
} from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";

export interface ColumnDef<T> {
  id: string;
  header: string;
  accessor: (row: T) => React.ReactNode;
  sortable?: boolean;
  visible?: boolean;
  className?: string;
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  searchKey?: (row: T) => string;
  onRowClick?: (row: T) => void;
  expandable?: (row: T) => React.ReactNode;
  bulkAction?: (selectedRows: T[]) => React.ReactNode;
  rowId: (row: T) => string;
  extraFilters?: React.ReactNode;
}

const PAGE_SIZE = 20;

function IndeterminateCheckbox({
  checked,
  indeterminate,
  onCheckedChange,
  "aria-label": ariaLabel,
  "data-ocid": ocid,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onCheckedChange: (v: boolean) => void;
  "aria-label"?: string;
  "data-ocid"?: string;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (ref.current) {
      (ref.current as HTMLInputElement).indeterminate = !!indeterminate;
    }
  }, [indeterminate]);
  return (
    <Checkbox
      ref={ref}
      checked={checked}
      onCheckedChange={(v) => onCheckedChange(!!v)}
      aria-label={ariaLabel}
      data-ocid={ocid}
      className="h-3.5 w-3.5"
    />
  );
}

export function DataTable<T>({
  columns: initialColumns,
  data,
  searchKey,
  onRowClick,
  expandable,
  bulkAction,
  rowId,
  extraFilters,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [colVisibility, setColVisibility] = useState<Record<string, boolean>>(
    () =>
      Object.fromEntries(
        initialColumns.map((c) => [c.id, c.visible !== false]),
      ),
  );
  const [colMenuOpen, setColMenuOpen] = useState(false);
  const colMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (colMenuRef.current && !colMenuRef.current.contains(e.target as Node))
        setColMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const visibleColumns = initialColumns.filter((c) => colVisibility[c.id]);

  const filtered = useMemo(() => {
    if (!search || !searchKey) return data;
    const q = search.toLowerCase();
    return data.filter((row) => searchKey(row).toLowerCase().includes(q));
  }, [data, search, searchKey]);

  const sorted = useMemo(() => {
    if (!sortCol) return filtered;
    const col = initialColumns.find((c) => c.id === sortCol);
    if (!col) return filtered;
    return [...filtered].sort((a, b) => {
      const av = String(col.accessor(a) ?? "");
      const bv = String(col.accessor(b) ?? "");
      const cmp = av.localeCompare(bv, undefined, { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortCol, sortDir, initialColumns]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageData = sorted.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );
  const startRow = sorted.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const endRow = Math.min(safePage * PAGE_SIZE, sorted.length);

  function handleSort(colId: string) {
    if (sortCol === colId) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(colId);
      setSortDir("asc");
    }
    setPage(1);
  }

  function handleSearch(val: string) {
    setSearch(val);
    setPage(1);
    setSelectedIds(new Set());
  }

  const pageIds = pageData.map(rowId);
  const allSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const someSelected =
    pageIds.some((id) => selectedIds.has(id)) && !allSelected;

  function toggleAll() {
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const id of pageIds) next.delete(id);
        return next;
      });
    } else {
      setSelectedIds((prev) => new Set([...prev, ...pageIds]));
    }
  }

  function toggleRow(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const selectedRows = data.filter((row) => selectedIds.has(rowId(row)));

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border flex-wrap">
        {searchKey && (
          <div className="relative flex-1 min-w-48 max-w-xs">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search..."
              data-ocid="datatable.search_input"
              className="pl-7 h-8 text-xs bg-muted/40 border-border"
            />
          </div>
        )}
        {extraFilters && (
          <div className="flex items-center gap-2">{extraFilters}</div>
        )}
        <div className="ml-auto flex items-center gap-2">
          {selectedIds.size > 0 && bulkAction && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {selectedIds.size} selected
              </Badge>
              {bulkAction(selectedRows)}
            </div>
          )}
          <div className="relative" ref={colMenuRef}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5"
              onClick={() => setColMenuOpen((o) => !o)}
              data-ocid="datatable.columns_toggle"
            >
              <Columns3 size={13} />
              Columns
            </Button>
            {colMenuOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 bg-popover border border-border rounded-lg shadow-lg py-1 min-w-40">
                {initialColumns.map((col) => (
                  <label
                    key={col.id}
                    htmlFor={`col-vis-${col.id}`}
                    className="flex items-center gap-2 px-3 py-1.5 hover:bg-muted/50 cursor-pointer"
                  >
                    <Checkbox
                      id={`col-vis-${col.id}`}
                      checked={colVisibility[col.id]}
                      onCheckedChange={(checked) =>
                        setColVisibility((prev) => ({
                          ...prev,
                          [col.id]: !!checked,
                        }))
                      }
                      className="h-3.5 w-3.5"
                    />
                    <span className="text-xs text-foreground">
                      {col.header}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="w-10 px-3 py-2.5">
                <IndeterminateCheckbox
                  checked={allSelected}
                  indeterminate={someSelected}
                  onCheckedChange={toggleAll}
                  aria-label="Select all"
                  data-ocid="datatable.select_all"
                />
              </th>
              {visibleColumns.map((col) => (
                <th
                  key={col.id}
                  className={cn(
                    "px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap",
                    col.sortable &&
                      "cursor-pointer select-none hover:text-foreground transition-colors",
                    col.className,
                  )}
                  onClick={() => col.sortable && handleSort(col.id)}
                  onKeyDown={(e) =>
                    (e.key === "Enter" || e.key === " ") &&
                    col.sortable &&
                    handleSort(col.id)
                  }
                  tabIndex={col.sortable ? 0 : undefined}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {col.sortable && (
                      <span className="text-muted-foreground/50">
                        {sortCol === col.id ? (
                          sortDir === "asc" ? (
                            <ChevronUp size={12} />
                          ) : (
                            <ChevronDown size={12} />
                          )
                        ) : (
                          <ChevronDown size={12} className="opacity-30" />
                        )}
                      </span>
                    )}
                  </span>
                </th>
              ))}
              {expandable && <th className="w-8 px-2" />}
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 ? (
              <tr>
                <td
                  colSpan={visibleColumns.length + 2}
                  className="px-4 py-12 text-center text-xs text-muted-foreground"
                  data-ocid="datatable.empty_state"
                >
                  No records found
                </td>
              </tr>
            ) : (
              pageData.map((row, i) => {
                const id = rowId(row);
                const isSelected = selectedIds.has(id);
                const isExpanded = expandedIds.has(id);
                return (
                  <React.Fragment key={id}>
                    <tr
                      data-ocid={`datatable.item.${
                        (safePage - 1) * PAGE_SIZE + i + 1
                      }`}
                      className={cn(
                        "border-b border-border/50 transition-colors",
                        isSelected ? "bg-primary/5" : "hover:bg-muted/30",
                        onRowClick && "cursor-pointer",
                      )}
                      onClick={() => onRowClick?.(row)}
                      onKeyDown={(e) =>
                        (e.key === "Enter" || e.key === " ") &&
                        onRowClick?.(row)
                      }
                      tabIndex={onRowClick ? 0 : undefined}
                    >
                      <td
                        className="w-10 px-3 py-2.5"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleRow(id)}
                          aria-label="Select row"
                          className="h-3.5 w-3.5"
                        />
                      </td>
                      {visibleColumns.map((col) => (
                        <td
                          key={col.id}
                          className={cn(
                            "px-3 py-2.5 text-xs text-foreground",
                            col.className,
                          )}
                        >
                          {col.accessor(row)}
                        </td>
                      ))}
                      {expandable && (
                        <td
                          className="w-8 px-2 py-2.5"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand(id);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.stopPropagation();
                              toggleExpand(id);
                            }
                          }}
                        >
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            data-ocid={`datatable.expand.${
                              (safePage - 1) * PAGE_SIZE + i + 1
                            }`}
                          >
                            {isExpanded ? (
                              <ChevronUp size={13} />
                            ) : (
                              <ChevronDown size={13} />
                            )}
                          </Button>
                        </td>
                      )}
                    </tr>
                    {expandable && isExpanded && (
                      <tr
                        key={`${id}-exp`}
                        className="bg-muted/20 border-b border-border/50"
                      >
                        <td
                          colSpan={visibleColumns.length + 2}
                          className="px-4 py-4"
                        >
                          {expandable(row)}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List */}
      <div className="md:hidden flex flex-col">
        {pageData.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-muted-foreground">
            No records found
          </div>
        ) : (
          pageData.map((row) => {
            const id = rowId(row);
            const isSelected = selectedIds.has(id);
            const isExpanded = expandedIds.has(id);
            
            // Try to find a primary column for the title (usually the first one, 'id' or 'name' or 'title')
            const primaryCol = visibleColumns[0];
            const secondaryCols = visibleColumns.slice(1);
            
            return (
              <div 
                key={id}
                className={cn(
                  "border-b border-border/50 p-4 transition-colors",
                  isSelected ? "bg-primary/5" : "bg-card hover:bg-muted/20"
                )}
                onClick={() => onRowClick?.(row)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="mt-1" onClick={e => e.stopPropagation()}>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleRow(id)}
                      className="h-4 w-4"
                    />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col gap-2">
                    <div className="text-sm font-semibold text-foreground">
                      {primaryCol?.accessor(row)}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-x-2 gap-y-3 mt-2">
                      {secondaryCols.map(col => (
                        <div key={col.id} className="flex flex-col gap-0.5">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            {col.header}
                          </span>
                          <div className="text-sm">
                            {col.accessor(row)}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {expandable && (
                      <div className="mt-3 pt-3 border-t border-border/50">
                        {isExpanded ? (
                          <div className="animate-in fade-in slide-in-from-top-2">
                            {expandable(row)}
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="w-full mt-3 h-8 text-xs bg-muted/50 text-muted-foreground"
                              onClick={(e) => { e.stopPropagation(); toggleExpand(id); }}
                            >
                              Show Less <ChevronUp size={14} className="ml-1" />
                            </Button>
                          </div>
                        ) : (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="w-full h-8 text-xs text-primary hover:text-primary hover:bg-primary/5"
                            onClick={(e) => { e.stopPropagation(); toggleExpand(id); }}
                          >
                            View Details <ChevronDown size={14} className="ml-1" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/10">
        <p className="text-xs text-muted-foreground">
          {sorted.length === 0
            ? "No results"
            : `Showing ${startRow}–${endRow} of ${sorted.length}`}
        </p>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => setPage(1)}
            disabled={safePage === 1}
            data-ocid="datatable.pagination_first"
          >
            <ChevronFirst size={13} />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage === 1}
            data-ocid="datatable.pagination_prev"
          >
            <ChevronLeft size={13} />
          </Button>
          <span className="px-2 text-xs text-muted-foreground tabular-nums">
            {safePage} / {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
            data-ocid="datatable.pagination_next"
          >
            <ChevronRight size={13} />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => setPage(totalPages)}
            disabled={safePage === totalPages}
            data-ocid="datatable.pagination_last"
          >
            <ChevronLast size={13} />
          </Button>
        </div>
      </div>
    </div>
  );
}

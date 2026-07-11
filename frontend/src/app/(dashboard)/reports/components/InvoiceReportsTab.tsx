import React, { useMemo } from "react";
import { DataTable, type ColumnDef } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/button";
import { Download, FileText, Printer, FileSpreadsheet } from "lucide-react";
import { cn } from "@/lib/utils";

interface InvoiceReportsTabProps {
  invoices: any[];
  dateRange: string;
  filters: any;
}

export function InvoiceReportsTab({ invoices, dateRange, filters }: InvoiceReportsTabProps) {
  
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // Date filtering logic could go here based on dateRange
      // Simple filtering for now
      return true;
    });
  }, [invoices, dateRange, filters]);

  const columns: ColumnDef<any>[] = useMemo(() => [
    {
      id: "invoice_number",
      header: "Invoice #",
      accessor: (d: any) => <span className="font-mono text-primary font-semibold text-[11px]">{d.invoice_number || "N/A"}</span>,
    },
    {
      id: "vendor_name",
      header: "Vendor",
      accessor: (d: any) => <span className="font-semibold text-sm">{d.vendor_name || "Unknown"}</span>,
    },
    {
      id: "invoice_date",
      header: "Date",
      accessor: (d: any) => <span className="tabular-nums text-muted-foreground">{d.invoice_date}</span>,
    },
    {
      id: "department",
      header: "Department",
      accessor: (d: any) => <span className="text-sm">{d.department || "-"}</span>,
    },
    {
      id: "expense_category",
      header: "Category",
      accessor: (d: any) => <span className="text-sm">{d.expense_category || "-"}</span>,
    },
    {
      id: "grand_total",
      header: "Total",
      accessor: (d: any) => <span className="font-semibold tabular-nums">₹{d.grand_total?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>,
    },
    {
      id: "status",
      header: "Approval / Payment",
      accessor: (d: any) => (
        <div className="flex flex-col gap-1">
          <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded w-max uppercase tracking-wider", 
            d.approval_status === "Approved" ? "bg-success/15 text-success" : 
            d.approval_status === "Rejected" ? "bg-destructive/15 text-destructive" : "bg-warning/15 text-warning")}>
            {d.approval_status}
          </span>
          <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded w-max uppercase tracking-wider", 
            d.payment_status === "Paid" ? "bg-success/15 text-success" : 
            d.payment_status === "Partial" ? "bg-warning/15 text-warning" : "bg-destructive/15 text-destructive")}>
            {d.payment_status}
          </span>
        </div>
      ),
    }
  ], []);

  const totalExpense = filteredInvoices.reduce((sum, inv) => sum + (inv.grand_total || 0), 0);
  const totalGst = filteredInvoices.reduce((sum, inv) => sum + (inv.gst_amount || 0), 0);
  const unpaidInvoices = filteredInvoices.filter(inv => inv.payment_status !== "Paid").length;

  const exportCSV = () => {
    const headers = ["Invoice Number", "Vendor Name", "Vendor GSTIN", "Date", "Department", "Category", "Subtotal", "GST Amount", "Grand Total", "Approval Status", "Payment Status"];
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + filteredInvoices.map(e => 
          `"${e.invoice_number}","${e.vendor_name}","${e.vendor_gstin}","${e.invoice_date}","${e.department}","${e.expense_category}","${e.subtotal}","${e.gst_amount}","${e.grand_total}","${e.approval_status}","${e.payment_status}"`
        ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Invoice_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPDF = () => {
    // We create a temporary hidden printable container for PDF/Print
    const printableArea = document.createElement('div');
    printableArea.innerHTML = `
      <style>
        body { font-family: sans-serif; color: #333; margin: 0; padding: 20px; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #ddd; padding-bottom: 20px; margin-bottom: 20px; }
        .logo-placeholder { width: 120px; height: 50px; background: #f0f0f0; border: 1px dashed #ccc; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; color: #888; }
        .company-info h1 { margin: 0 0 5px 0; font-size: 24px; color: #222; }
        .company-info p { margin: 0; color: #666; font-size: 12px; }
        .report-title h2 { margin: 0 0 5px 0; font-size: 20px; color: #0056b3; }
        .report-title p { margin: 0; color: #666; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f8f9fa; color: #333; font-weight: bold; }
        .summary { margin-top: 20px; padding: 15px; background-color: #f8f9fa; border: 1px solid #ddd; }
        .summary h3 { margin: 0 0 10px 0; font-size: 14px; }
        .summary p { margin: 5px 0; font-size: 12px; }
        .footer { margin-top: 40px; padding-top: 10px; border-top: 1px solid #ddd; text-align: center; font-size: 10px; color: #888; }
        @media print {
          @page { margin: 10mm; }
        }
      </style>
      <div class="header">
        <div class="company-info">
          <div class="logo-placeholder">COMPANY LOGO</div>
          <h1>FOXFLOW ERP</h1>
          <p>Enterprise Manufacturing Solutions</p>
        </div>
        <div class="report-title">
          <h2>Invoice & Expense Report</h2>
          <p>Generated: ${new Date().toLocaleString()}</p>
          <p>Date Range: ${dateRange}</p>
        </div>
      </div>
      
      <div class="summary">
        <h3>Report Summary</h3>
        <p><strong>Total Invoices:</strong> ${filteredInvoices.length}</p>
        <p><strong>Total Expenses:</strong> ₹${totalExpense.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
        <p><strong>Total GST Paid:</strong> ₹${totalGst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
        <p><strong>Unpaid Invoices:</strong> ${unpaidInvoices}</p>
      </div>

      <table>
        <thead>
          <tr>
            <th>Invoice #</th>
            <th>Vendor</th>
            <th>Date</th>
            <th>Department</th>
            <th>Total (₹)</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${filteredInvoices.map(inv => `
            <tr>
              <td>${inv.invoice_number || 'N/A'}</td>
              <td>${inv.vendor_name || 'Unknown'}</td>
              <td>${inv.invoice_date || '-'}</td>
              <td>${inv.department || '-'}</td>
              <td>${inv.grand_total?.toLocaleString('en-IN') || '0'}</td>
              <td>${inv.approval_status} / ${inv.payment_status}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="footer">
        Generated by FoxFlow ERP Invoice Management System • Page 1 of 1
      </div>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printableArea.innerHTML);
      printWindow.document.close();
      printWindow.focus();
      // Give images/styles time to load
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 shadow-subtle">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Invoices</p>
          <p className="text-2xl font-bold text-foreground">{filteredInvoices.length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 shadow-subtle">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Expenses</p>
          <p className="text-2xl font-bold text-foreground">₹{totalExpense.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 shadow-subtle">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total GST</p>
          <p className="text-2xl font-bold text-foreground">₹{totalGst.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 shadow-subtle">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Unpaid Count</p>
          <p className="text-2xl font-bold text-destructive">{unpaidInvoices}</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-subtle overflow-hidden">
        <div className="p-4 border-b border-border flex flex-wrap items-center justify-between gap-4 bg-muted/10">
          <h3 className="font-semibold text-foreground">Invoice Records</h3>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportCSV} className="gap-2">
              <FileSpreadsheet size={16} /> Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={exportPDF} className="gap-2">
              <FileText size={16} /> Export PDF
            </Button>
            <Button variant="outline" size="sm" onClick={exportPDF} className="gap-2">
              <Printer size={16} /> Print
            </Button>
          </div>
        </div>
        <div className="p-0">
          <DataTable 
            columns={columns} 
            data={filteredInvoices} 
            rowId={(d) => String(d.id)}
            searchKey={(d) => `${d.invoice_number} ${d.vendor_name} ${d.department}`}
          />
        </div>
      </div>
    </div>
  );
}

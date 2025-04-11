"use client"
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getSortedRowModel,
    SortingState,
    getPaginationRowModel,
    ColumnFiltersState,
    getFilteredRowModel,
} from "@tanstack/react-table";
import * as React from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@components/ui/input";
import { Download, Upload } from "lucide-react";

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    meta?: Record<string, unknown>;
    onImportCSV?: () => void; // Add a callback to open the import modal
}

export function DataTable<TData, TValue>({
    columns,
    data,
    meta,
    onImportCSV,
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [rowSelection, setRowSelection] = React.useState({});
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([
        { id: "jobTitle", value: "" },
        { id: "position", value: "" },
        { id: "applied_at", value: "" },
        { id: "status", value: "" },
        { id: "company", value: "" },
    ]);

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        onRowSelectionChange: setRowSelection,
        onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel: getFilteredRowModel(),
        state: {
            sorting,
            rowSelection,
            columnFilters,
        },
        meta,
    });

    const exportToCSV = () => {
        const headers = table
            .getAllColumns()
            .filter((column) => column.id !== "select" && column.id !== "actions")
            .map((column) => {
                const header = column.columnDef.header;
                return typeof header === "string" ? header : column.id;
            });

        const rows = table.getFilteredRowModel().rows.map((row) => {
            return table
                .getAllColumns()
                .filter((column) => column.id !== "select" && column.id !== "actions")
                .map((column) => {
                    const cellValue = row.getValue(column.id);
                    if (column.id === "applied_at" || column.id === "updated_at") {
                        return cellValue ? `"${cellValue}"` : "Not set";
                    }
                    if (column.id === "status") {
                        return cellValue === "IN_PROGRESS"
                            ? "In progress"
                            : cellValue === "PROCESSING"
                                ? "Processing"
                                : cellValue === "APPROVED"
                                    ? "Approved"
                                    : cellValue === "REJECTED"
                                        ? "Rejected"
                                        : "Unknown";
                    }
                    const stringValue = String(cellValue ?? "");
                    return stringValue.includes(",") || stringValue.includes('"')
                        ? `"${stringValue.replace(/"/g, '""')}"`
                        : stringValue;
                });
        });

        const csvContent = [headers.join(","), ...rows.map((row) => row.join(", "))].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "job_applications.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    };

    return (
        <div>
            <div className="flex justify-end py-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onImportCSV}
                    className="flex items-center gap-2 dark:border-yellow-500 border-black border-2 mr-2"
                >
                    <Upload className="h-4 w-4" />
                    Import CSV
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={exportToCSV}
                    className="flex items-center gap-2 dark:border-yellow-500 border-black border-2 mr-4"
                    disabled={table.getFilteredSelectedRowModel().rows.length === 0}
                >
                    <Download className="h-4 w-4" />
                    Export to CSV
                </Button>
            </div>
            <div className="rounded-md dark:border-2 dark:border-b-white dark:border-b-4 dark:border-r-4 dark:border-r-white dark:bg-black border-black border-2 border-b-4 bg-violet-400 mt-4">
                <div className="flex items-center py-4 space-x-4 ml-2">
                    <Input
                        placeholder="Filter by Job Title"
                        value={(table.getColumn("jobTitle")?.getFilterValue() as string) ?? ""}
                        onChange={(event) =>
                            table.getColumn("jobTitle")?.setFilterValue(event.target.value)
                        }
                        className="max-w-sm font-bold border-2 dark:border-yellow-500 border-black"
                    />
                    <Input
                        placeholder="Filter by Position"
                        value={(table.getColumn("position")?.getFilterValue() as string) ?? ""}
                        onChange={(event) =>
                            table.getColumn("position")?.setFilterValue(event.target.value)
                        }
                        className="max-w-sm font-bold border-2 dark:border-yellow-500 border-black"
                    />
                    <Input
                        placeholder="Filter by Company"
                        value={(table.getColumn("company")?.getFilterValue() as string) ?? ""}
                        onChange={(event) =>
                            table.getColumn("company")?.setFilterValue(event.target.value)
                        }
                        className="max-w-sm font-bold border-2 dark:border-yellow-500 border-black"
                    />
                    <Input
                        type="date"
                        placeholder="Filter by Date"
                        value={(table.getColumn("applied_at")?.getFilterValue() as string) ?? ""}
                        onChange={(event) =>
                            table.getColumn("applied_at")?.setFilterValue(event.target.value)
                        }
                        className="max-w-sm font-bold border-2 dark:border-yellow-500 border-black"
                    />
                </div>

                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-end space-x-2 py-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                >
                    Previous
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                >
                    Next
                </Button>
            </div>
            <div className="flex-1 text-sm text-muted-foreground text-center">
                {table.getFilteredSelectedRowModel().rows.length} of{" "}
                {table.getFilteredRowModel().rows.length} row(s) selected.
            </div>
        </div>
    );
}
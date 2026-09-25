"use client";

import {
  type ColumnDef,
  type Header,
  type Row,
  type RowData,
  type RowSelectionState,
  type SortingState,
  columnFilteringFeature,
  createColumnHelper,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_equalsString,
  filterFn_includesString,
  globalFilteringFeature,
  metaHelper,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  sortFn_datetime,
  sortFn_text,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Inbox,
  Printer,
  Search,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { imprimirHtml } from "@/lib/imprimir";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Definición de columnas

export type DataGridFilterOption = { value: string; label: string };

export type DataGridColumnMeta = {
  // Filtro de cabecera: texto libre o lista de opciones (si no se pasan, se toman de los datos).
  filter?: { type: "text" } | { type: "select"; options?: DataGridFilterOption[] };
  // Oculta la columna debajo de 768 px.
  hideOnMobile?: boolean;
  // Oculta la columna debajo de un ancho mayor: "lg" (1024 px) o "xl" (1280 px), p. ej. para tablet.
  hideBelow?: "lg" | "xl";
  // Encabezado para exportar cuando `header` no es texto.
  label?: string;
  // Valor para Excel; por defecto el valor crudo del accessor.
  exportValue?: (value: unknown) => string | number | Date | null | undefined;
  align?: "start" | "end";
};

const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
    basic: sortFn_basic,
    datetime: sortFn_datetime,
    text: sortFn_text,
  },
  columnFilteringFeature,
  globalFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  filterFns: { includesString: filterFn_includesString, equalsString: filterFn_equalsString },
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
  rowSelectionFeature,
  columnMeta: metaHelper<DataGridColumnMeta>(),
});

export type DataGridFeatures = typeof features;

// Uso: const col = dataGridColumns<Gasto>(); const columns = col.columns([col.accessor("monto", {...})]);
export function dataGridColumns<T extends RowData>() {
  return createColumnHelper<DataGridFeatures, T>();
}

// ---------------------------------------------------------------------------
// Componente

const PAGE_SIZES = [10, 25, 50] as const;
const SELECT_ID = "__select";
const TODOS = "__todos";
const EMPTY_SORTING: SortingState = [];

type Props<T extends RowData> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- cada columna conserva su propio tipo de valor
  columns: ColumnDef<DataGridFeatures, T, any>[];
  data: T[];
  getRowId?: (row: T) => string;
  loading?: boolean;
  selectable?: boolean;
  onSelectionChange?: (rows: T[]) => void;
  onRowClick?: (row: T) => void;
  // Acciones extra en la barra superior; reciben las filas seleccionadas.
  actions?: (selected: T[]) => React.ReactNode;
  searchPlaceholder?: string;
  exportFileName?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  initialPageSize?: (typeof PAGE_SIZES)[number];
  // Orden inicial, p. ej. [{ id: "fecha", desc: true }].
  initialSorting?: SortingState;
};

export function DataGrid<T extends RowData>({
  columns,
  data,
  getRowId,
  loading = false,
  selectable = false,
  onSelectionChange,
  onRowClick,
  actions,
  searchPlaceholder = "Buscar",
  exportFileName = "exportacion",
  emptyTitle = "Sin resultados",
  emptyDescription = "No hay registros que coincidan con la búsqueda o los filtros.",
  initialPageSize = 10,
  initialSorting = EMPTY_SORTING,
}: Props<T>) {
  const allColumns = useMemo(
    () => (selectable ? [selectColumn<T>(), ...columns] : columns),
    [columns, selectable],
  );

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const table = useTable({
    features,
    columns: allColumns,
    data,
    getRowId: getRowId ? (row: T) => getRowId(row) : undefined,
    globalFilterFn: "includesString",
    getColumnCanGlobalFilter: (column) => column.id !== SELECT_ID && Boolean(column.accessorFn),
    initialState: { pagination: { pageIndex: 0, pageSize: initialPageSize }, sorting: initialSorting },
    state: { rowSelection },
    onRowSelectionChange: setRowSelection,
    enableRowSelection: selectable,
  });

  const selected = useMemo(
    () => table.getSelectedRowModel().rows.map((r) => r.original),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- depende del estado de selección, no de la instancia
    [rowSelection, data],
  );

  const onSelectionChangeRef = useRef(onSelectionChange);
  onSelectionChangeRef.current = onSelectionChange;
  useEffect(() => {
    onSelectionChangeRef.current?.(selected);
  }, [selected]);

  const tableRef = useRef<HTMLTableElement>(null);
  const filterColumns = table.getAllLeafColumns().filter((c) => c.columnDef.meta?.filter);
  const hasFilters = filterColumns.length > 0;
  // Si todos los filtros son de columnas ocultas en móvil, la fila de filtros tampoco se muestra ahí.
  const filtersOnlyDesktop = filterColumns.every((c) => c.columnDef.meta?.hideOnMobile || c.columnDef.meta?.hideBelow);
  const rows = table.getRowModel().rows;
  const filteredCount = table.getFilteredRowModel().rows.length;
  const { pageIndex, pageSize } = table.state.pagination;

  // Filas visibles = todas las que pasan búsqueda y filtros, en el orden actual (no solo la página).
  function visibleRows() {
    return table.getSortedRowModel().rows;
  }

  async function exportExcel() {
    const XLSX = await import("xlsx");
    const exportable = table
      .getAllLeafColumns()
      .filter((c) => c.id !== SELECT_ID && c.accessorFn);
    const header = exportable.map((c) => columnLabel(c.columnDef.header, c.columnDef.meta, c.id));
    const body = visibleRows().map((row) =>
      exportable.map((c) => {
        const value = row.getValue(c.id);
        const custom = c.columnDef.meta?.exportValue;
        return custom ? custom(value) : (value as string | number | Date | null | undefined);
      }),
    );
    const sheet = XLSX.utils.aoa_to_sheet([header, ...body], { cellDates: true });
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "Datos");
    XLSX.writeFile(book, `${exportFileName}.xlsx`);
  }

  function exportPdf() {
    // Muestra todas las filas visibles, copia la tabla renderizada a un iframe e imprime.
    const previous = table.state.pagination;
    flushSync(() => table.setPagination({ pageIndex: 0, pageSize: Math.max(filteredCount, 1) }));
    const html = tableRef.current?.outerHTML ?? "";
    flushSync(() => table.setPagination(previous));
    printHtml(html, exportFileName);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1 sm:max-w-72">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={(table.state.globalFilter as string | undefined) ?? ""}
            onChange={(e) => table.setGlobalFilter(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="pl-8"
          />
        </div>
        {selectable && selected.length > 0 && (
          <span className="text-sm text-muted-foreground">
            {selected.length} {selected.length === 1 ? "seleccionado" : "seleccionados"}
          </span>
        )}
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {actions?.(selected)}
          <Button variant="outline" size="sm" onClick={exportExcel} disabled={loading || filteredCount === 0}>
            <FileSpreadsheet data-icon="inline-start" />
            Exportar Excel
          </Button>
          <Button variant="outline" size="sm" onClick={exportPdf} disabled={loading || filteredCount === 0}>
            <Printer data-icon="inline-start" />
            Exportar PDF
          </Button>
        </div>
      </div>

      <div className="border">
        <Table ref={tableRef}>
          <TableHeader>
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id}>
                {group.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cellClass(header.column.columnDef.meta, header.column.id)}
                    aria-sort={ariaSort(header.column.getIsSorted())}
                  >
                    {header.isPlaceholder ? null : <HeaderLabel header={header} table={table} />}
                  </TableHead>
                ))}
              </TableRow>
            ))}
            {hasFilters && (
              <TableRow data-print-hide className={cn("hover:bg-transparent", filtersOnlyDesktop && "hidden md:table-row")}>
                {table.getLeafHeaders().map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn("py-1.5", cellClass(header.column.columnDef.meta, header.column.id))}
                  >
                    <ColumnFilter header={header} data={data} />
                  </TableHead>
                ))}
              </TableRow>
            )}
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: Math.min(pageSize, 5) }, (_, i) => (
                <TableRow key={i}>
                  {table.getAllLeafColumns().map((c) => (
                    <TableCell key={c.id} className={cellClass(c.columnDef.meta, c.id)}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={table.getAllLeafColumns().length}>
                  <EmptyState icon={Inbox} title={emptyTitle} description={emptyDescription} />
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? "selected" : undefined}
                  className={onRowClick ? "cursor-pointer" : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                  onKeyDown={
                    onRowClick
                      ? (e) => {
                          if (e.key === "Enter") onRowClick(row.original);
                        }
                      : undefined
                  }
                >
                  {row.getAllCells().map((cell) => (
                    <TableCell key={cell.id} className={cellClass(cell.column.columnDef.meta, cell.column.id)}>
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="text-muted-foreground">
          {filteredCount === 0
            ? "0 registros"
            : `${pageIndex * pageSize + 1}–${Math.min((pageIndex + 1) * pageSize, filteredCount)} de ${filteredCount}`}
        </span>
        <div className="flex items-center gap-2">
          <span className="hidden text-muted-foreground sm:inline">Filas por página</span>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => table.setPageSize(Number(value))}
          >
            <SelectTrigger size="sm" aria-label="Filas por página">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            aria-label="Página anterior"
          >
            <ChevronLeft />
          </Button>
          <span className="tabular-nums">
            {pageIndex + 1} / {Math.max(table.getPageCount(), 1)}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            aria-label="Página siguiente"
          >
            <ChevronRight />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Piezas internas

type GridTable<T extends RowData> = ReturnType<typeof useTable<DataGridFeatures, T>>;
type GridHeader<T extends RowData> = Header<DataGridFeatures, T, unknown>;

function HeaderLabel<T extends RowData>({ header, table }: { header: GridHeader<T>; table: GridTable<T> }) {
  const column = header.column;
  if (!column.getCanSort()) return <table.FlexRender header={header} />;

  const sorted = column.getIsSorted();
  const Icon = sorted === "asc" ? ArrowUp : sorted === "desc" ? ArrowDown : ArrowUpDown;
  return (
    <button
      type="button"
      onClick={column.getToggleSortingHandler()}
      className={cn(
        "inline-flex items-center gap-1 hover:text-foreground",
        column.columnDef.meta?.align === "end" && "flex-row-reverse",
      )}
    >
      <table.FlexRender header={header} />
      <Icon data-print-hide className={cn("size-3.5", !sorted && "text-muted-foreground")} aria-hidden />
    </button>
  );
}

function ColumnFilter<T extends RowData>({ header, data }: { header: GridHeader<T>; data: T[] }) {
  const column = header.column;
  const filter = column.columnDef.meta?.filter;
  const label = columnLabel(column.columnDef.header, column.columnDef.meta, column.id);

  const options = useMemo(() => {
    if (filter?.type !== "select") return [];
    if (filter.options) return filter.options;
    const values = new Set<string>();
    for (const row of data) {
      const value = column.accessorFn?.(row, 0);
      if (value !== undefined && value !== null && value !== "") values.add(String(value));
    }
    return [...values].sort((a, b) => a.localeCompare(b, "es")).map((v) => ({ value: v, label: v }));
  }, [filter, data, column]);

  if (!filter) return null;

  if (filter.type === "text") {
    return (
      <Input
        value={(column.getFilterValue() as string | undefined) ?? ""}
        onChange={(e) => column.setFilterValue(e.target.value || undefined)}
        placeholder="Filtrar"
        aria-label={`Filtrar ${label}`}
        className="h-7 min-w-24 font-normal"
      />
    );
  }

  const current = (column.getFilterValue() as string | undefined) ?? TODOS;
  return (
    <Select
      items={[{ value: TODOS, label: "Todos" }, ...options]}
      value={current}
      onValueChange={(value) => column.setFilterValue(value === TODOS ? undefined : value)}
    >
      <SelectTrigger size="sm" className="min-w-28 font-normal" aria-label={`Filtrar ${label}`}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={TODOS}>Todos</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function selectColumn<T extends RowData>(): ColumnDef<DataGridFeatures, T, unknown> {
  return {
    id: SELECT_ID,
    enableSorting: false,
    enableGlobalFilter: false,
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        indeterminate={table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected()}
        onCheckedChange={(checked) => table.toggleAllPageRowsSelected(checked)}
        aria-label="Seleccionar página"
      />
    ),
    cell: ({ row }: { row: Row<DataGridFeatures, T> }) => (
      <span onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
        <Checkbox
          checked={row.getIsSelected()}
          disabled={!row.getCanSelect()}
          onCheckedChange={(checked) => row.toggleSelected(checked)}
          aria-label="Seleccionar fila"
        />
      </span>
    ),
  };
}

function columnLabel(header: unknown, meta: DataGridColumnMeta | undefined, id: string) {
  return meta?.label ?? (typeof header === "string" ? header : id);
}

function cellClass(meta: DataGridColumnMeta | undefined, id: string) {
  return cn(
    id === SELECT_ID && "w-10",
    meta?.align === "end" && "text-right tabular-nums",
    meta?.hideOnMobile && "hidden md:table-cell",
    meta?.hideBelow === "lg" && "hidden lg:table-cell",
    meta?.hideBelow === "xl" && "hidden xl:table-cell",
  );
}

function ariaSort(sorted: false | "asc" | "desc") {
  return sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : undefined;
}

// Sin columna de selección en el impreso.
function printHtml(tableHtml: string, title: string) {
  imprimirHtml({
    titulo: title,
    html: tableHtml,
    preparar: (doc) =>
      doc.querySelectorAll("tr").forEach((tr) => {
        const first = tr.firstElementChild;
        if (first?.querySelector('[role="checkbox"]')) first.remove();
      }),
  });
}

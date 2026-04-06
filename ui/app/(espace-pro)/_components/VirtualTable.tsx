"use client"

import Button from "@codegouvfr/react-dsfr/Button"
import Input from "@codegouvfr/react-dsfr/Input"
import { Box, Typography } from "@mui/material"
import { type ColumnDef, flexRender, getCoreRowModel, getFilteredRowModel, getSortedRowModel, type SortingState, useReactTable } from "@tanstack/react-table"
import { useVirtualizer } from "@tanstack/react-virtual"
import { matchSorter } from "match-sorter"
import React, { useRef, useState } from "react"
import { ArrowDownLine } from "@/app/_components/ArrowDownLine"
import { ArrowUpDownLine } from "@/app/_components/ArrowUpDownLine"
import { ArrowUpLine } from "@/app/_components/ArrowUpLine"

export type { ColumnDef }

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    srOnly?: string
  }
}

function fuzzyFilter<T>(row: import("@tanstack/react-table").Row<T>, columnId: string, filterValue: string): boolean {
  const value = row.getValue(columnId)
  const stringValue = value == null ? "" : String(value)
  return matchSorter([stringValue], filterValue, { threshold: matchSorter.rankings.CONTAINS }).length > 0
}

function GlobalFilter({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <Input
      label="Rechercher"
      data-testid="search-input"
      nativeInputProps={{
        value,
        placeholder,
        onChange: (e) => onChange(e.target.value),
      }}
      addon={<Button iconId="fr-icon-search-line" priority="primary" title="Lancer la recherche" />}
    />
  )
}

interface VirtualTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  caption: string
  searchPlaceholder?: string
  defaultSortBy?: { id: string; desc: boolean }[]
  rowHeight?: number
  maxHeight?: string
}

export function VirtualTable<T>({ data, columns, caption, searchPlaceholder = "Rechercher...", defaultSortBy = [], rowHeight = 60, maxHeight = "600px" }: VirtualTableProps<T>) {
  const [globalFilter, setGlobalFilter] = useState("")
  const [sorting, setSorting] = useState<SortingState>(defaultSortBy)

  const table = useReactTable({
    data,
    columns,
    state: { globalFilter, sorting },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    globalFilterFn: fuzzyFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  const rows = table.getRowModel().rows

  const scrollRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => rowHeight,
    overscan: 5,
    measureElement: (el) => el.getBoundingClientRect().height,
  })

  const virtualRows = virtualizer.getVirtualItems()

  return (
    <Box>
      <Box sx={{ width: { xs: "100%", sm: "75%", lg: "50%" }, mb: 3 }}>
        <GlobalFilter value={globalFilter} onChange={setGlobalFilter} placeholder={searchPlaceholder} />
      </Box>

      <Typography sx={{ mb: 2, color: "text.secondary", fontSize: ".875rem" }}>
        {rows.length} résultat{rows.length !== 1 ? "s" : ""}
      </Typography>
      <Box
        ref={scrollRef}
        className="fr-table__content"
        sx={{
          overflow: "auto",
          maxHeight,
          "& table": { margin: "0 !important" },
          "& table thead th[role=columnheader]": {
            backgroundSize: "100% 1px !important",
            backgroundRepeat: "no-repeat !important",
            backgroundPosition: "0 100% !important",
            backgroundImage: "linear-gradient(0deg, var(--border-plain-grey), var(--border-plain-grey)) !important",
          },
        }}
      >
        <table style={{ borderCollapse: "collapse", width: "100%", tableLayout: "fixed" }}>
          <thead style={{ position: "sticky", top: 0, zIndex: 1, backgroundColor: "var(--background-alt-grey)" }}>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} style={{ display: "flex", width: "100%" }}>
                {headerGroup.headers.map((header) => {
                  const srOnly = header.column.columnDef.meta?.srOnly
                  return (
                    <th
                      key={header.id}
                      role="columnheader"
                      scope="col"
                      onClick={header.column.getToggleSortingHandler()}
                      style={{
                        cursor: header.column.getCanSort() ? "pointer" : "default",
                        flex: `${header.column.getSize()} 0 0`,
                        minWidth: `${header.column.getSize()}px`,
                        boxSizing: "border-box",
                        overflow: "hidden",
                      }}
                    >
                      <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
                        <span className={srOnly ? "fr-sr-only" : "fr-cell__title"}>{srOnly ?? flexRender(header.column.columnDef.header, header.getContext())}</span>
                        {header.column.getCanSort() && (
                          <Box component="span" sx={{ pl: 1 }}>
                            {header.column.getIsSorted() === "asc" ? <ArrowUpLine /> : header.column.getIsSorted() === "desc" ? <ArrowDownLine /> : <ArrowUpDownLine />}
                          </Box>
                        )}
                      </Box>
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>

          <tbody style={{ height: `${virtualizer.getTotalSize()}px`, position: "relative" }}>
            {virtualRows.map((virtualRow) => {
              const row = rows[virtualRow.index]
              return (
                <tr
                  key={row.id}
                  data-index={virtualRow.index}
                  ref={virtualizer.measureElement}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    display: "flex",
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      style={{
                        flex: `${cell.column.getSize()} 0 0`,
                        minWidth: `${cell.column.getSize()}px`,
                        boxSizing: "border-box",
                        overflow: "hidden",
                        whiteSpace: "normal",
                        wordBreak: "break-word",
                      }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </Box>

      {rows.length === 0 && <Box sx={{ py: 4, textAlign: "center", color: "text.secondary" }}>Aucun résultat</Box>}
    </Box>
  )
}

import Button from "@codegouvfr/react-dsfr/Button"
import Input from "@codegouvfr/react-dsfr/Input"
import { Box, Typography } from "@mui/material"
import { matchSorter } from "match-sorter"
import React, { useMemo } from "react"
import { useFilters, useFlexLayout, useGlobalFilter, usePagination, useSortBy, useTable } from "react-table"

import { fr } from "@codegouvfr/react-dsfr"
import ExportButtonNew from "@/components/espace_pro/ExportButton/ExportButtonNew"
import { ArrowDownLine } from "@/app/_components/ArrowDownLine"
import { ArrowUpDownLine } from "@/app/_components/ArrowUpDownLine"
import { ArrowUpLine } from "@/app/_components/ArrowUpLine"

import { PaginationReactQuery } from "@/components/espace_pro/PaginationReactQuery"
import { SelectField } from "@/app/_components/FormComponents/SelectField"

interface GlobalFilterProps {
  globalFilter: string
  setGlobalFilter: (filterValue: string | undefined) => void
  searchPlaceholder?: string
}

// Define a default UI for filtering
function GlobalFilter({ globalFilter, setGlobalFilter, searchPlaceholder }: GlobalFilterProps) {
  const [value, setValue] = React.useState(globalFilter)
  const onChange = (value: string) => {
    setGlobalFilter(value || undefined)
  }

  return (
    <Input
      label="Rechercher une société"
      data-testid="search-input"
      nativeInputProps={{
        value: value || "",
        placeholder: searchPlaceholder,
        onChange: (e) => {
          setValue(e.target.value)
          onChange(e.target.value)
        },
      }}
      addon={<Button iconId="fr-icon-search-line" priority="primary" title="Lancer la recherche" />}
    />
  )
}

function fuzzyTextFilterFn(rows, id, filterValue) {
  // @ts-expect-error: TODO
  return matchSorter(rows, filterValue, { keys: [(row) => row.values[id]], threshold: matchSorter.rankings.CONTAINS })
}

// Let the table remove the filter if the string is empty
fuzzyTextFilterFn.autoRemove = (val) => !val

function TableWithPagination({
  data = [],
  columns,
  description = undefined,
  exportable,
  searchPlaceholder = "Rechercher par raison sociale, email ou téléphone...",
  pageIndex = 0,
  onPageChange = null,
  defaultSortBy = [],
}: {
  data?: any[]
  columns: any
  description?: any
  exportable?: boolean
  searchPlaceholder?: string
  pageIndex?: number
  onPageChange?: (newPageIndex: number) => void
  defaultSortBy?: { id: string; desc: boolean }[]
}) {
  const tableData = useMemo(() => data, [data])
  const tableColumns = useMemo(() => columns, [columns])

  const filterTypes = React.useMemo(
    () => ({
      // Add a new fuzzyTextFilterFn filter type.
      fuzzyText: fuzzyTextFilterFn,
      // Or, override the default text filter to use
      // "startWith"
      text: (rows, id, filterValue) => {
        if (!filterValue) return rows
        return rows.filter((row) => {
          const rowValue = row.values[id]
          return rowValue !== undefined ? String(rowValue).toLowerCase().startsWith(String(filterValue).toLowerCase()) : true
        })
      },
    }),
    []
  )

  const useTableResult = useTable(
    {
      columns: tableColumns,
      data: tableData,
      defaultColumn: { width: 150 },
      initialState: { sortBy: defaultSortBy, pageIndex, pageSize: 8 },
      filterTypes,
    },
    useFilters,
    useGlobalFilter,
    useFlexLayout,
    useSortBy,
    usePagination
  )
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    pageCount,
    page,
    gotoPage,
    prepareRow,
    setGlobalFilter,
    state: { globalFilter },
  } = useTableResult
  const finalPageIndex = useTableResult.state.pageIndex

  function localOnPageChange(newIndex: number) {
    gotoPage(newIndex)
    onPageChange?.(newIndex)
  }

  const hasMultiplePages = Boolean(!Number.isNaN(pageCount) && pageCount > 1)

  return (
    <Box className="search-page">
      <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
        <Box width="90%">
          <Box sx={{ width: { xs: "100%", sm: "75%", lg: "50%" } }}>
            <GlobalFilter globalFilter={globalFilter} setGlobalFilter={setGlobalFilter} searchPlaceholder={searchPlaceholder} />
          </Box>
          {description && (
            <Box width="95%">
              <Typography
                mt={3}
                sx={{
                  display: "-webkit-box",
                  WebkitLineClamp: 3, // ← number of lines
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {description}
              </Typography>
            </Box>
          )}
        </Box>
        {exportable && <ExportButtonNew data={tableData} />}
      </Box>

      <Box className="fr-table">
        <Box className="fr-table__wrapper">
          <Box className="fr-table__container">
            <Box className="fr-table__content">
              <Box as="table" {...getTableProps()}>
                <Box component="thead">
                  {headerGroups.map((headerGroup, k) => (
                    <Box key={k} as="tr" {...headerGroup.getHeaderGroupProps({})}>
                      {headerGroup.headers.map((column, i) => (
                        <Box key={i} as="th" scope="col" id={column.id} {...column.getHeaderProps(column.getSortByToggleProps())} title={null}>
                          <Box sx={{ display: "flex", flexDirection: "row", w: "full", alignItems: "flex-start" }}>
                            <Typography className="fr-cell__title">{column.render("Header")}</Typography>
                            <Box component="span" pl={1}>
                              {column.isSorted ? column.isSortedDesc ? <ArrowDownLine /> : <ArrowUpLine /> : column.canSort && <ArrowUpDownLine />}
                            </Box>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  ))}
                </Box>
                <Box as="tbody" {...getTableBodyProps()}>
                  {page.map((row, i) => {
                    prepareRow(row)
                    return (
                      <Box key={i} as="tr" {...row.getRowProps()}>
                        {row.cells.map((cell, j) => {
                          return (
                            <Box
                              key={j}
                              headers={cell.column.id}
                              component="td"
                              {...cell.getCellProps()}
                              sx={cell.column.id === "action" ? { display: "flex", padding: "4px !important" } : {}}
                            >
                              {cell.render("Cell")}
                            </Box>
                          )
                        })}
                      </Box>
                    )
                  })}
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
      {hasMultiplePages && (
        <Box sx={{ display: "flex", justifyContent: "center", my: fr.spacing("3v"), mx: fr.spacing("1v"), position: "relative" }}>
          <PaginationReactQuery gotoPage={localOnPageChange} pageCount={pageCount} currentPage={finalPageIndex} />
          <Box
            sx={{
              position: "absolute",
              bottom: 0,
              right: 0,
              maxWidth: "78px",
            }}
          >
            <SelectField
              id="page-selector"
              label=""
              options={[...new Array(pageCount)].map((_, index) => (index + 1).toString()).map((value) => ({ value, label: value }))}
              nativeSelectProps={{
                value: (finalPageIndex + 1).toString(),
                onChange: (event) => {
                  const { value: newValue } = event.target
                  localOnPageChange(parseInt(newValue, 10) - 1)
                },
              }}
            />
          </Box>
        </Box>
      )}
    </Box>
  )
}

export default TableWithPagination

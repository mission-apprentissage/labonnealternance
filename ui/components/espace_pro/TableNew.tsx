import Button from "@codegouvfr/react-dsfr/Button"
import Input from "@codegouvfr/react-dsfr/Input"
import { Box, Typography } from "@mui/material"
import { matchSorter } from "match-sorter"
import React, { useMemo } from "react"
import { useFilters, useFlexLayout, useGlobalFilter, usePagination, useSortBy, useTable } from "react-table"

import { ArrowDownLine, ArrowUpLine } from "../../theme/components/icons"

import ExportButtonNew from "./ExportButton/ExportButtonNew"
import PaginationReactQuery from "./PaginationReactQuery"

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

function TableNew({ data = [], columns, description = undefined, exportable, searchPlaceholder = "Rechercher par raison sociale, email ou téléphone..." }) {
  const tableData = useMemo(() => data, [data])
  const tableColumns = useMemo(() => columns, [columns])

  const filterTypes = React.useMemo(
    () => ({
      // Add a new fuzzyTextFilterFn filter type.
      fuzzyText: fuzzyTextFilterFn,
      // Or, override the default text filter to use
      // "startWith"
      text: (rows, id, filterValue) => {
        return rows.filter((row) => {
          const rowValue = row.values[id]
          return rowValue !== undefined ? String(rowValue).toLowerCase().startsWith(String(filterValue).toLowerCase()) : true
        })
      },
    }),
    []
  )

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    pageCount,
    gotoPage,
    prepareRow,
    preGlobalFilteredRows,
    setGlobalFilter,
    state: { globalFilter, pageIndex },
  } = useTable(
    {
      columns: tableColumns,
      data: tableData,
      defaultColumn: { width: 150 },
      initialState: { sortBy: [{ id: "createdAt", desc: true }], pageIndex: 0, pageSize: 8 },
      filterTypes,
    },
    useFilters,
    useGlobalFilter,
    useFlexLayout,
    useSortBy,
    usePagination
  )

  return (
    <Box className="search-page">
      <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
        <Box width="90%">
          <Box width="50%">
            {/*  @ts-expect-error: TODO */}
            <GlobalFilter preGlobalFilteredRows={preGlobalFilteredRows} globalFilter={globalFilter} setGlobalFilter={setGlobalFilter} searchPlaceholder={searchPlaceholder} />
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
                        <Box key={i} as="th" {...column.getHeaderProps(column.getSortByToggleProps())} role="hack">
                          <Box sx={{ display: "flex", flexDirection: "column", w: "full", alignItems: "flex-start", justify: "center" }}>
                            <Typography className="fr-cell__title">
                              {column.render("Header")}

                              {column.isSorted ? (
                                column.isSortedDesc ? (
                                  <ArrowDownLine pl={1} color="bluefrance.500" />
                                ) : (
                                  <ArrowUpLine pl={1} color="bluefrance.500" />
                                )
                              ) : (
                                column.canSort && (
                                  <Box component="span" pl={1}>
                                    <ArrowUpLine color="bluefrance.500" />
                                    <ArrowDownLine color="bluefrance.500" />
                                  </Box>
                                )
                              )}
                            </Typography>
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
                            <Box key={j} component="td" {...cell.getCellProps()} sx={cell.column.id === "action" ? { display: "flex", padding: "4px !important" } : {}}>
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
      <Box>
        <PaginationReactQuery gotoPage={gotoPage} pageCount={pageCount} currentPage={pageIndex} />
      </Box>
    </Box>
  )
}

export default TableNew

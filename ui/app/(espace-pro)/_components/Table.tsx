import { Box, Typography } from "@mui/material"
import { useMemo } from "react"
import { useFlexLayout, useSortBy, useTable } from "react-table"

import { ArrowDownLine } from "@/app/_components/ArrowDownLine"
import { ArrowUpDownLine } from "@/app/_components/ArrowUpDownLine"
import { ArrowUpLine } from "@/app/_components/ArrowUpLine"

const Table = ({ data, columns }) => {
  const tableData = useMemo(() => data, [data])
  const tableColumns = useMemo(() => columns, [columns])

  const tableInstance = useTable(
    {
      columns: tableColumns,
      data: tableData,
      defaultColumn: { width: 150 },
      initialState: { sortBy: [{ id: "createdAt", desc: true }] },
    },
    useFlexLayout,
    useSortBy
  )
  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = tableInstance

  return (
    <Box className="fr-table">
      <Box className="fr-table__wrapper">
        <Box className="fr-table__container">
          <Box className="fr-table__content">
            <Box component="table" {...getTableProps()}>
              <Box component="thead">
                {headerGroups.map((headerGroup, g) => (
                  <Box key={g} as="tr" {...headerGroup.getHeaderGroupProps({})}>
                    {headerGroup.headers.map((column, i) => {
                      return (
                        <Box key={i} as="th" {...column.getHeaderProps(column.getSortByToggleProps())} role="hack">
                          <Box sx={{ display: "flex", flexDirection: "row", alignItems: "flex-start", width: "100%" }}>
                            <Typography>{column.render("Header")}</Typography>
                            <Box
                              component="span"
                              sx={{
                                pl: 1,
                              }}
                            >
                              {column.isSorted ? column.isSortedDesc ? <ArrowDownLine /> : <ArrowUpLine /> : column.canSort && <ArrowUpDownLine />}
                            </Box>
                          </Box>
                        </Box>
                      )
                    })}
                  </Box>
                ))}
              </Box>
              <Box as="tbody" {...getTableBodyProps()}>
                {rows.map((row, i) => {
                  prepareRow(row)
                  return (
                    <Box key={i} as="tr" {...row.getRowProps()}>
                      {row.cells.map((cell, j) => {
                        return (
                          <Box key={j} as="td" {...cell.getCellProps()} sx={cell.column.id === "action" ? { padding: "4px !important" } : {}}>
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
  )
}

export default Table

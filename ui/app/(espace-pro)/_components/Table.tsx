import { Box, Flex, Text } from "@chakra-ui/react"
import React, { useMemo } from "react"
import { useFlexLayout, useSortBy, useTable } from "react-table"

import { ArrowDownLine, ArrowUpLine } from "@/theme/components/icons"

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
            <Box as="table" {...getTableProps()}>
              <Box as="thead">
                {headerGroups.map((headerGroup, g) => (
                  <Box key={g} as="tr" {...headerGroup.getHeaderGroupProps({})}>
                    {headerGroup.headers.map((column, i) => {
                      return (
                        <Box key={i} as="th" {...column.getHeaderProps(column.getSortByToggleProps())} role="hack">
                          <Flex flexDirection="column" w="full" alignItems="flex-start" justify="center">
                            <Text>
                              {column.render("Header")}
                              {column.isSorted ? (
                                column.isSortedDesc ? (
                                  <ArrowDownLine pl={1} color="bluefrance.500" />
                                ) : (
                                  <ArrowUpLine pl={1} color="bluefrance.500" />
                                )
                              ) : (
                                column.canSort && (
                                  <Box as="span" pl={1}>
                                    <ArrowUpLine color="bluefrance.500" />
                                    <ArrowDownLine color="bluefrance.500" />
                                  </Box>
                                )
                              )}
                            </Text>
                          </Flex>
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

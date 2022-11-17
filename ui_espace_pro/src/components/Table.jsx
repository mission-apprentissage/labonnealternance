import { Box, Flex, Text } from "@chakra-ui/react"
import React, { useMemo } from "react"
import { useFlexLayout, useSortBy, useTable } from "react-table"
import { ArrowDownLine, ArrowUpLine } from "../theme/components/icons"

export default ({ data, columns, onRowClick }) => {
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
    <>
      <Box as="table" {...getTableProps()} w="100%" flex={1} fontSize="delta">
        <Box as="thead" borderBottom="2px solid #3A3A3A">
          {headerGroups.map((headerGroup) => (
            <Box as="tr" {...headerGroup.getHeaderGroupProps({})} pb={4}>
              {headerGroup.headers.map((column, i) => (
                <Box as="th" {...column.getHeaderProps(column.getSortByToggleProps())} display={[i === 0 || i > 2 ? "none" : "flex", "flex"]} overflow="hidden" px={2}>
                  <Flex flexDirection="column" w="full" alignItems="flex-start" justify="center">
                    <Text fontWeight="700" textAlign="left" fontSize="14px">
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
              ))}
            </Box>
          ))}
        </Box>
        <Box as="tbody" {...getTableBodyProps()}>
          {rows.map((row, i) => {
            prepareRow(row)
            return (
              <Box as="tr" backgroundColor={i % 2 ? "grey.200" : "white"} py={4} {...row.getRowProps()}>
                {row.cells.map((cell) => {
                  return (
                    <Flex as="td" align="center" px={2} {...cell.getCellProps()}>
                      {cell.render("Cell")}
                    </Flex>
                  )
                })}
              </Box>
            )
          })}
        </Box>
      </Box>
    </>
  )
}

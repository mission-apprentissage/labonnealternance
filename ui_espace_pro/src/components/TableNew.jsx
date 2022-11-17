import { Box, Flex, Input, InputGroup, InputRightElement, Text } from "@chakra-ui/react"
import { matchSorter } from "match-sorter"
import React, { useMemo } from "react"
import { useAsyncDebounce, useFilters, useFlexLayout, useGlobalFilter, usePagination, useSortBy, useTable } from "react-table"
import { ArrowDownLine, ArrowUpLine, SearchLine } from "../theme/components/icons"
import ExportButtonNew from "./ExportButton/ExportButtonNew"
import PaginationReactQuery from "./PaginationReactQuery"

// Define a default UI for filtering
function GlobalFilter({ preGlobalFilteredRows, globalFilter, setGlobalFilter }) {
  const count = preGlobalFilteredRows.length
  const [value, setValue] = React.useState(globalFilter)
  const onChange = useAsyncDebounce((value) => {
    setGlobalFilter(value || undefined)
  }, 200)

  return (
    <InputGroup>
      <Input
        variant="search"
        value={value || ""}
        onChange={(e) => {
          setValue(e.target.value)
          onChange(e.target.value)
        }}
        placeholder={`Rechercher par raison sociale, email ou téléphone...`}
      />
      <InputRightElement background="bluefrance.500" border="none" pointerEvents="none" children={<SearchLine color="white" />} />
    </InputGroup>
  )
}

function fuzzyTextFilterFn(rows, id, filterValue) {
  return matchSorter(rows, filterValue, { keys: [(row) => row.values[id]], threshold: matchSorter.rankings.CONTAINS })
}

// Let the table remove the filter if the string is empty
fuzzyTextFilterFn.autoRemove = (val) => !val

export default ({ data, columns, description }) => {
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
    canPreviousPage,
    canNextPage,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
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
    <Box>
      <Flex align="center" mb={10}>
        <Box width="90%">
          <Box width="50%">
            <GlobalFilter preGlobalFilteredRows={preGlobalFilteredRows} globalFilter={globalFilter} setGlobalFilter={setGlobalFilter} />
          </Box>
          {description && (
            <Box width="95%">
              <Text mt={3} noOfLines={3}>
                {description}
              </Text>
            </Box>
          )}
        </Box>
        <ExportButtonNew data={tableData} />
      </Flex>

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
          {page.map((row, i) => {
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
      <Box>
        <PaginationReactQuery
          nextPage={nextPage}
          previousPage={previousPage}
          gotoPage={gotoPage}
          canNextPage={canNextPage}
          canPreviousPage={canPreviousPage}
          page={page}
          pageCount={pageCount}
          currentPage={pageIndex}
        />
      </Box>
    </Box>
  )
}

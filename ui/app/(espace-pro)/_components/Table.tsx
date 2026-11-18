import { fr } from "@codegouvfr/react-dsfr"
import { Box } from "@mui/material"
import { useMemo } from "react"
import { useFlexLayout, usePagination, useSortBy, useTable } from "react-table"
import { ColumnHeaderContent, getColumnAriaSort } from "@/app/(espace-pro)/_components/ColumnHeaderContent"
import { getFlatTableCellBordersSx, getFlatTableResetSx, getFlatTableWrapperSx } from "@/app/(espace-pro)/_components/table-styles"
import { PaginationReactQuery } from "@/components/espace_pro/PaginationReactQuery"

type TableProps = {
  caption: string
  data: any[]
  columns: any
  /** Sans valeur, toutes les lignes s'affichent sur une seule page. */
  pageSize?: number
  /** Colonnes dont les cellules identifient la ligne : rendues en `th scope="row"` et référencées par les autres cellules (RGAA 5.7). */
  rowHeaderColumnIds?: string[]
  initialSortBy?: { id: string; desc: boolean }[]
  captionSrOnly?: boolean
}

const Table = ({ caption, data, columns, pageSize, rowHeaderColumnIds = [], initialSortBy = [{ id: "createdAt", desc: true }], captionSrOnly = false }: TableProps) => {
  const tableData = useMemo(() => data, [data])
  const tableColumns = useMemo(() => columns, [columns])

  const tableInstance = useTable(
    {
      columns: tableColumns,
      data: tableData,
      defaultColumn: { width: 150 },
      initialState: { sortBy: initialSortBy, pageSize: pageSize ?? Number.MAX_SAFE_INTEGER },
    },
    useFlexLayout,
    useSortBy,
    usePagination
  )
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    pageCount,
    gotoPage,
    prepareRow,
    state: { pageIndex },
  } = tableInstance

  return (
    <Box className="fr-table">
      <Box className="fr-table__wrapper" sx={getFlatTableWrapperSx()}>
        <Box className="fr-table__container">
          <Box className="fr-table__content">
            <Box
              component="table"
              {...getTableProps()}
              sx={{
                ...getFlatTableResetSx(),
                ...getFlatTableCellBordersSx(),
                "& tbody th": { backgroundColor: "var(--background-default-grey) !important" },
              }}
            >
              <Box
                className={captionSrOnly ? "fr-sr-only" : undefined}
                sx={captionSrOnly ? undefined : { position: "relative !important", fontSize: "20px !important", fontWeight: "700", mb: fr.spacing("2v") }}
                component="caption"
              >
                {caption}
              </Box>
              <Box component="thead">
                {headerGroups.map((headerGroup) => {
                  const { key: headerGroupKey, ...headerGroupProps } = headerGroup.getHeaderGroupProps()
                  return (
                    <Box key={headerGroupKey} as="tr" {...headerGroupProps}>
                      {headerGroup.headers.map((column) => {
                        // Le tri se déclenche sur le bouton de l'en-tête (cf. ColumnHeaderContent), pas sur la cellule.
                        const { onClick: _onSortClick, ...headerSortProps } = column.getSortByToggleProps()
                        const { key: headerKey, ...headerProps } = column.getHeaderProps(headerSortProps)

                        return (
                          <Box
                            key={headerKey}
                            as="th"
                            {...headerProps}
                            title={null}
                            scope="col"
                            id={column.id}
                            aria-sort={getColumnAriaSort(column)}
                            sx={{ display: "flex !important", alignItems: "center" }}
                          >
                            <ColumnHeaderContent column={column} />
                          </Box>
                        )
                      })}
                    </Box>
                  )
                })}
              </Box>
              <Box as="tbody" {...getTableBodyProps()}>
                {page.map((row) => {
                  prepareRow(row)
                  const { key: rowKey, ...rowProps } = row.getRowProps()
                  const rowHeaderIds = rowHeaderColumnIds.map((columnId) => `${columnId}-${row.id}`)
                  return (
                    <Box key={rowKey} as="tr" {...rowProps}>
                      {row.cells.map((cell) => {
                        const { key: cellKey, ...cellProps } = cell.getCellProps()
                        const isRowHeader = rowHeaderColumnIds.includes(cell.column.id)
                        const headerProps = isRowHeader
                          ? { as: "th", scope: "row", id: `${cell.column.id}-${row.id}`, headers: cell.column.id }
                          : { as: "td", headers: [cell.column.id, ...rowHeaderIds].join(" ") }
                        return (
                          <Box
                            key={cellKey}
                            {...headerProps}
                            {...cellProps}
                            {...(cell.column.id === "action" ? { sx: { padding: `${fr.spacing("1v")} !important` } } : {})}
                            alignContent={"center"}
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
      {pageSize !== undefined && <PaginationReactQuery gotoPage={gotoPage} pageCount={pageCount} currentPage={pageIndex} />}
    </Box>
  )
}

export default Table

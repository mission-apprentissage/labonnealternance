import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import { useMemo } from "react"
import { useFlexLayout, useSortBy, useTable } from "react-table"
import { ArrowDownLine } from "@/app/_components/ArrowDownLine"
import { ArrowUpDownLine } from "@/app/_components/ArrowUpDownLine"
import { ArrowUpLine } from "@/app/_components/ArrowUpLine"
import { getFlatTableCellBordersSx, getFlatTableResetSx, getFlatTableWrapperSx } from "@/app/(espace-pro)/_components/table-styles"

const Table = ({ caption, data, columns }: { caption: string; data: any[]; columns: any }) => {
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
      <Box className="fr-table__wrapper" sx={getFlatTableWrapperSx()}>
        <Box className="fr-table__container">
          <Box className="fr-table__content">
            <Box
              component="table"
              {...getTableProps()}
              sx={{
                ...getFlatTableResetSx(),
                ...getFlatTableCellBordersSx(),
              }}
            >
              <Box sx={{ position: "relative !important", fontSize: "20px !important", fontWeight: "700", mb: fr.spacing("2v") }} component="caption">
                {caption}
              </Box>
              <Box component="thead">
                {headerGroups.map((headerGroup) => {
                  const { key: headerGroupKey, ...headerGroupProps } = headerGroup.getHeaderGroupProps()
                  return (
                    <Box key={headerGroupKey} as="tr" {...headerGroupProps}>
                      {headerGroup.headers.map((column) => {
                        const sortProps = column.getSortByToggleProps()
                        const { onClick: sortOnClick, ...headerSortProps } = sortProps
                        const { key: headerKey, ...headerProps } = column.getHeaderProps(headerSortProps)

                        return (
                          <Box key={headerKey} as="th" {...headerProps} title={null} scope="col" id={column.id} sx={{ display: "flex !important", alignItems: "center" }}>
                            {column.canSort ? (
                              <Box
                                component="button"
                                type="button"
                                onClick={sortOnClick}
                                aria-label={`Trier par ${column.srOnly || column.Header}${column.isSorted ? (column.isSortedDesc ? ", trié par ordre décroissant" : ", trié par ordre croissant") : ""}`}
                                sx={{
                                  display: "flex",
                                  flexDirection: "row",
                                  alignItems: "center",
                                  width: "100%",
                                  background: "none",
                                  border: "none",
                                  padding: 0,
                                  cursor: "pointer",
                                  font: "inherit",
                                  color: "inherit",
                                  "&:focus-visible": {
                                    outline: "2px solid #0a76f6",
                                    outlineOffset: "2px",
                                  },
                                }}
                              >
                                <Typography component="span" className={column.srOnly ? "fr-sr-only" : "fr-cell__title"} sx={{ fontSize: "14px" }}>
                                  {column.srOnly ? column.srOnly : column.render("Header")}
                                </Typography>
                                <Box
                                  component="span"
                                  sx={{
                                    display: "flex",
                                    flexShrink: 0,
                                    ml: fr.spacing("2v"),
                                    p: "3px",
                                    border: "1px solid var(--border-default-grey)",
                                    borderRadius: "4px",
                                    "& .MuiIcon-root": { width: "1rem", height: "1rem", fontSize: "1rem", display: "flex" },
                                    "& .MuiIcon-root::before": { "--icon-size": "1rem" },
                                  }}
                                >
                                  {column.isSorted ? column.isSortedDesc ? <ArrowDownLine /> : <ArrowUpLine /> : <ArrowUpDownLine />}
                                </Box>
                              </Box>
                            ) : (
                              <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", width: "100%" }}>
                                <Typography className={column.srOnly ? "fr-sr-only" : "fr-cell__title"} sx={{ fontSize: "14px" }}>
                                  {column.srOnly ? column.srOnly : column.render("Header")}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        )
                      })}
                    </Box>
                  )
                })}
              </Box>
              <Box as="tbody" {...getTableBodyProps()}>
                {rows.map((row) => {
                  prepareRow(row)
                  const { key: rowKey, ...rowProps } = row.getRowProps()
                  return (
                    <Box key={rowKey} as="tr" {...rowProps}>
                      {row.cells.map((cell) => {
                        const { key: cellKey, ...cellProps } = cell.getCellProps()
                        return (
                          <Box
                            key={cellKey}
                            headers={cell.column.id}
                            as="td"
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
    </Box>
  )
}

export default Table

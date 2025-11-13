import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box } from "@mui/material"

import { ChevronLeft, ChevronRight } from "@/theme/components/icons"

const PageLink = ({ pageNumber, onClick, isActive = false }: { pageNumber: number; onClick: () => unknown; isActive: boolean }) => {
  return (
    <Button priority="tertiary no outline" onClick={() => onClick()} nativeButtonProps={{ "aria-label": `Page ${pageNumber}` }} disabled={!!isActive}>
      {pageNumber}
    </Button>
  )
}

const PreviousLink = ({ previousPage, canPreviousPage }: { previousPage: () => unknown; canPreviousPage: boolean }) => {
  return (
    <Button priority="tertiary no outline" disabled={!canPreviousPage} onClick={previousPage}>
      <ChevronLeft sx={{ mr: fr.spacing("1v") }} />
      Précédent
    </Button>
  )
}

const NextLink = ({ nextPage, canNextPage }: { nextPage: () => unknown; canNextPage: boolean }) => {
  return (
    <Button priority="tertiary no outline" disabled={!canNextPage} onClick={nextPage}>
      Suivant
      <ChevronRight sx={{ ml: fr.spacing("1v") }} />
    </Button>
  )
}

const sequence = (from: number, to: number) => [...new Array(to - from + 1)].map((_, index) => index + from)
const uniq = (array: number[]): number[] => [...new Set(array)]

interface PaginationReactQueryProps {
  pageCount: number
  gotoPage: (pageIndex: number) => void
  currentPage: number
}

function PaginationReactQuery({ pageCount, gotoPage: goToPageIndex, currentPage: pageIndex }: PaginationReactQueryProps) {
  if (Number.isNaN(pageCount) || pageCount <= 1) {
    return null
  }
  const currentPage = pageIndex + 1
  const canPreviousPage = currentPage >= 2
  const canNextPage = currentPage <= pageCount - 1
  const displayedPages =
    pageCount <= 5 ? sequence(1, pageCount) : uniq([1, ...sequence(currentPage - 1, currentPage + 1), pageCount]).filter((value) => value >= 1 && value <= pageCount)
  const nextPage = () => goToPageIndex(pageIndex + 1)
  const previousPage = () => goToPageIndex(pageIndex - 1)

  return (
    <Box className={"search-pagination"} sx={{ display: "flex", flexWrap: "wrap", flexDirection: "row", justifyContent: "center", my: fr.spacing("3v"), mx: fr.spacing("1v") }}>
      <PreviousLink previousPage={previousPage} canPreviousPage={canPreviousPage} />
      {
        displayedPages.reduce(
          (acc, page) => {
            if (acc.previousPage !== page - 1 && page !== 1) {
              acc.jsx.push(<span key={`span_${page}`}>...</span>)
            }
            acc.jsx.push(<PageLink key={page} pageNumber={page} onClick={() => goToPageIndex(page - 1)} isActive={currentPage === page} />)
            acc.previousPage = page
            return acc
          },
          { previousPage: null, jsx: [] }
        ).jsx
      }
      <NextLink nextPage={nextPage} canNextPage={canNextPage} />
    </Box>
  )
}

export default PaginationReactQuery

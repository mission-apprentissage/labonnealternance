import { Box, Button, Link } from "@chakra-ui/react"

import { ChevronLeft, ChevronRight } from "../../theme/components/icons"

const PageLink = ({ pageNumber, onClick, isActive = false }) => {
  return (
    // @ts-expect-error: TODO
    <Link onClick={() => onClick()} alt={`Page ${pageNumber}`} className={`${isActive ? "active" : ""}`}>
      {pageNumber}
    </Link>
  )
}

const PreviousLink = ({ previousPage, canPreviousPage }) => {
  return (
    <Button leftIcon={<ChevronLeft />} as={Link} variant="link" isDisabled={!canPreviousPage} onClick={previousPage}>
      Précédent
    </Button>
  )
}

const NextLink = ({ nextPage, canNextPage }) => {
  return (
    <Button rightIcon={<ChevronRight />} as={Link} variant="link" isDisabled={!canNextPage} onClick={nextPage}>
      Suivant
    </Button>
  )
}

const sequence = (from, to) => [...new Array(to - from + 1)].map((_, index) => index + from)
const uniq = (array: number[]): number[] => [...new Set(array)]

export function PaginationReactQuery({ pageCount, gotoPage: goToPageIndex, currentPage: pageIndex }) {
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
    <Box className={"search-pagination"} textAlign={"center"} my={3} mx={1}>
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

import { Box, Button, Link } from "@chakra-ui/react"
import React from "react"
import { ChevronLeft, ChevronRight } from "../theme/components/icons"

const PageLink = ({ pageNumber, pageIndex, gotoPage, isActive = false }) => {
  return (
    <Link onClick={() => gotoPage(pageNumber - 1)} alt={`Page ${pageIndex}`} className={`${isActive ? "active" : ""}`}>
      {pageNumber}
    </Link>
  )
}

const PreviousLink = ({ previousPage, canPreviousPage }) => {
  return (
    <Button leftIcon={<ChevronLeft />} as={Link} variant="link" isDisabled={!canPreviousPage} onClick={() => previousPage()}>
      Précédent
    </Button>
  )
}

const NextLink = ({ nextPage, canNextPage }) => {
  return (
    <Button rightIcon={<ChevronRight />} as={Link} variant="link" isDisabled={!canNextPage} onClick={() => nextPage()}>
      Suivant
    </Button>
  )
}

export default ({ page, canPreviousPage, canNextPage, pageCount, nextPage, previousPage, gotoPage, currentPage }) => {
  if (Number.isNaN(pageCount) || pageCount <= 1) {
    return <></>
  }

  if (pageCount <= 5) {
    return (
      <Box className="search-pagination" textAlign="center" my={3} mx={1}>
        <PreviousLink previousPage={previousPage} canPreviousPage={canPreviousPage} />
        {Array(pageCount)
          .fill(page)
          .map((_unusedValue, index) => (
            <PageLink key={index} />
          ))}
        <NextLink nextPage={nextPage} canNextPage={canNextPage} />
      </Box>
    )
  }

  return (
    <Box className={"search-pagination"} textAlign={"center"} my={3} mx={1}>
      <PreviousLink previousPage={previousPage} canPreviousPage={canPreviousPage} />

      {currentPage > 1 && <PageLink pageNumber={1} gotoPage={gotoPage} />}

      {currentPage - 2 > 0 && <span>...</span>}

      {currentPage > pageCount - 2 && <PageLink pageNumber={currentPage - 2} gotoPage={gotoPage} />}

      {currentPage > pageCount - 3 && <PageLink pageNumber={currentPage - 1} gotoPage={gotoPage} />}

      {currentPage > 0 && <PageLink pageNumber={currentPage} gotoPage={gotoPage} />}

      <PageLink pageNumber={currentPage + 1} gotoPage={gotoPage} isActive={true} />

      {currentPage + 1 < pageCount - 1 && <PageLink pageNumber={currentPage + 2} gotoPage={gotoPage} />}

      {currentPage + 2 < pageCount - 1 && currentPage < 2 && <PageLink pageNumber={currentPage + 3} gotoPage={gotoPage} />}

      {currentPage + 3 < pageCount - 1 && currentPage < 1 && <PageLink pageNumber={currentPage + 4} gotoPage={gotoPage} />}

      {currentPage + 2 < pageCount - 1 && <span>...</span>}

      {currentPage < pageCount - 1 && <PageLink pageNumber={pageCount} gotoPage={gotoPage} />}

      <NextLink nextPage={nextPage} canNextPage={canNextPage} />
    </Box>
  )
}

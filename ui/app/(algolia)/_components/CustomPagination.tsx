import { fr } from "@codegouvfr/react-dsfr"
import { Box } from "@mui/material"
import React from "react"
import { usePagination } from "react-instantsearch"

export function CustomPagination(props) {
  const { pages, currentRefinement, nbPages, isFirstPage, isLastPage, refine, createURL } = usePagination(props)
  const firstPageIndex = 0
  const previousPageIndex = currentRefinement - 1
  const nextPageIndex = currentRefinement + 1
  const lastPageIndex = nbPages - 1

  return (
    <Box sx={{ display: "flex", py: fr.spacing("3w"), justifyContent: "center" }}>
      <PaginationItem isDisabled={isFirstPage} href={createURL(firstPageIndex)} onClick={() => refine(firstPageIndex)}>
        Première page
      </PaginationItem>
      <PaginationItem isDisabled={isFirstPage} href={createURL(previousPageIndex)} onClick={() => refine(previousPageIndex)}>
        Précédent
      </PaginationItem>
      {pages.map((page) => {
        const label = page + 1

        return (
          <PaginationItem key={page} isDisabled={false} aria-label={`Page ${label}`} href={createURL(page)} onClick={() => refine(page)}>
            {label}
          </PaginationItem>
        )
      })}
      <PaginationItem isDisabled={isLastPage} href={createURL(nextPageIndex)} onClick={() => refine(nextPageIndex)}>
        Suivant
      </PaginationItem>
      <PaginationItem isDisabled={isLastPage} href={createURL(lastPageIndex)} onClick={() => refine(lastPageIndex)}>
        Dernière page
      </PaginationItem>
    </Box>
  )
}

function PaginationItem({ isDisabled, href, onClick, ...props }) {
  if (isDisabled) {
    return (
      <Box sx={{ px: fr.spacing("2w") }}>
        <span {...props} />
      </Box>
    )
  }

  return (
    <Box sx={{ px: fr.spacing("2w") }}>
      <a
        href={href}
        onClick={(event) => {
          if (isModifierClick(event)) {
            return
          }

          event.preventDefault()

          onClick(event)
        }}
        {...props}
      />
    </Box>
  )
}

function isModifierClick(event) {
  const isMiddleClick = event.button === 1

  return Boolean(isMiddleClick || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey)
}

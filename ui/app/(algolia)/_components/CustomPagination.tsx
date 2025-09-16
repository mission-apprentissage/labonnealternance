import React from "react"
import { usePagination } from "react-instantsearch"

export function CustomPagination(props) {
  const { pages, currentRefinement, nbPages, isFirstPage, isLastPage, refine, createURL } = usePagination(props)
  const firstPageIndex = 0
  const previousPageIndex = currentRefinement - 1
  const nextPageIndex = currentRefinement + 1
  const lastPageIndex = nbPages - 1

  return (
    <ul>
      <PaginationItem isDisabled={isFirstPage} href={createURL(firstPageIndex)} onClick={() => refine(firstPageIndex)}>
        First
      </PaginationItem>
      <PaginationItem isDisabled={isFirstPage} href={createURL(previousPageIndex)} onClick={() => refine(previousPageIndex)}>
        Previous
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
        Next
      </PaginationItem>
      <PaginationItem isDisabled={isLastPage} href={createURL(lastPageIndex)} onClick={() => refine(lastPageIndex)}>
        Last
      </PaginationItem>
    </ul>
  )
}

function PaginationItem({ isDisabled, href, onClick, ...props }) {
  if (isDisabled) {
    return (
      <li>
        <span {...props} />
      </li>
    )
  }

  return (
    <li>
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
    </li>
  )
}

function isModifierClick(event) {
  const isMiddleClick = event.button === 1

  return Boolean(isMiddleClick || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey)
}

import { Typography } from "@mui/material"
import React from "react"
import { RefinementListProps, useRefinementList } from "react-instantsearch"

export function CustomRefinementList(props: RefinementListProps) {
  const { items, refine, canToggleShowMore, isShowingMore, toggleShowMore } = useRefinementList(props)

  return (
    <>
      <ul>
        {items.map((item) => (
          <li key={item.label}>
            <label>
              <Typography>
                <input type="checkbox" checked={item.isRefined} onChange={() => refine(item.value)} />
                {item.label} ({item.count})
              </Typography>
            </label>
          </li>
        ))}
      </ul>
      {canToggleShowMore && (
        <button onClick={toggleShowMore} disabled={!canToggleShowMore}>
          {isShowingMore ? "Show less" : "Show more"}
        </button>
      )}
    </>
  )
}

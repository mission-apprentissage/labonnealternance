import { fr } from "@codegouvfr/react-dsfr"
import React from "react"
import { useRefinementList } from "react-instantsearch"

export function CustomRefinementList(props) {
  const { items, refine, searchForItems, canToggleShowMore, isShowingMore, toggleShowMore } = useRefinementList(props)

  return (
    <>
      <input
        type="search"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        maxLength={512}
        onChange={(event) => searchForItems(event.currentTarget.value)}
        className={fr.cx("fr-input")}
      />
      <ul>
        {items.map((item) => (
          <li key={item.label}>
            <label>
              <input type="checkbox" checked={item.isRefined} onChange={() => refine(item.value)} />
              <span>{item.label}</span>
              <span>({item.count})</span>
            </label>
          </li>
        ))}
      </ul>
      <button onClick={toggleShowMore} disabled={!canToggleShowMore}>
        {isShowingMore ? "Show less" : "Show more"}
      </button>
    </>
  )
}

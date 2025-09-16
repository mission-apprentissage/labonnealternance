import { fr } from "@codegouvfr/react-dsfr"
import { Box } from "@mui/material"
import React, { useState, useRef } from "react"
import { useSearchBox } from "react-instantsearch"

export function CustomSearchBox(props) {
  const { query, refine } = useSearchBox(props)

  const [inputValue, setInputValue] = useState(query)
  const inputRef = useRef(null)

  function setQuery(newQuery) {
    setInputValue(newQuery)

    refine(newQuery)
  }

  return (
    <div>
      <form
        action=""
        role="search"
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          event.stopPropagation()

          if (inputRef.current) {
            inputRef.current.blur()
          }
        }}
        onReset={(event) => {
          event.preventDefault()
          event.stopPropagation()

          setQuery("")

          if (inputRef.current) {
            inputRef.current.focus()
          }
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: fr.spacing("3w") }}>
          <input
            ref={inputRef}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            placeholder="Indiquer un métier ou une formation"
            spellCheck={false}
            maxLength={512}
            type="search"
            value={inputValue}
            onChange={(event) => {
              setQuery(event.currentTarget.value)
            }}
            autoFocus
            className={fr.cx("fr-input")}
          />
        </Box>
      </form>
    </div>
  )
}

import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import Checkbox from "@codegouvfr/react-dsfr/Checkbox"
import { Box, ClickAwayListener, Popper } from "@mui/material"
import { useCallback, useEffect, useRef, useState } from "react"

import { SelectField } from "@/app/_components/FormComponents/SelectField"

export type MultiSelectOption = {
  value: string
  label: string
  hintText?: string
}

function getDefaultLabel(selected: MultiSelectOption[], allOptions: MultiSelectOption[]): string {
  if (selected.length === 0 || selected.length === allOptions.length) return "Indifférent"
  if (selected.length === 1) return selected[0].label
  return `${selected.length} sélectionnés`
}

export function MultiSelectField({
  id,
  label,
  options,
  value,
  onChange,
  onConfirm,
  onOpen,
  getLabel,
  popperSx,
}: {
  id: string
  label: string
  options: MultiSelectOption[]
  value: string[]
  onChange: (value: string[]) => void
  onConfirm?: (newValue: string[]) => void
  onOpen?: () => void
  getLabel?: (selected: MultiSelectOption[], allOptions: MultiSelectOption[]) => string
  popperSx?: Record<string, unknown>
}) {
  const [open, setOpen] = useState(false)
  const [pendingValue, setPendingValue] = useState<string[]>(value)
  const anchorRef = useRef<HTMLDivElement>(null)
  const selectRef = useRef<HTMLSelectElement | null>(null)
  const shouldRefocusOnClose = useRef(false)

  const prevOpen = useRef(open)
  useEffect(() => {
    if (prevOpen.current && !open && shouldRefocusOnClose.current) {
      selectRef.current?.focus()
    }
    shouldRefocusOnClose.current = false
    prevOpen.current = open
  }, [open])

  useEffect(() => {
    if (!open) {
      setPendingValue(value)
    }
  }, [value, open])

  const toggle = useCallback((optionValue: string) => {
    setPendingValue((prev) => (prev.includes(optionValue) ? prev.filter((v) => v !== optionValue) : [...prev, optionValue]))
  }, [])

  const handleConfirm = useCallback(
    (event) => {
      event.preventDefault()
      onChange(pendingValue)
      onConfirm?.(pendingValue)
      setOpen(false)
    },
    [pendingValue, onChange, onConfirm]
  )

  const handleToggleOpen = useCallback(() => {
    setOpen((prev) => {
      if (!prev) {
        setPendingValue(value)
        onOpen?.()
      }
      return !prev
    })
  }, [onOpen, value])

  const handleSelectInteraction = useCallback(
    (e: React.MouseEvent | React.KeyboardEvent) => {
      if ("key" in e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          handleToggleOpen()
        }
        return
      }
      e.preventDefault()
      handleToggleOpen()
    },
    [handleToggleOpen]
  )

  const selectedOptions = options.filter((o) => value.includes(o.value))
  const displayLabel = getLabel ? getLabel(selectedOptions, options) : getDefaultLabel(selectedOptions, options)

  return (
    <Box ref={anchorRef} sx={{ display: "inline-block", position: "relative" }}>
      <SelectField
        id={id}
        label={label}
        style={{ marginBottom: 0, textWrap: "nowrap" }}
        options={[{ value: "__current__", label: displayLabel }]}
        nativeSelectProps={{
          ref: selectRef,
          defaultValue: "__current__",
          onMouseDown: handleSelectInteraction,
          onKeyDown: handleSelectInteraction,
          "aria-expanded": open,
          "aria-haspopup": "listbox",
          style: { fontWeight: 700 },
        }}
      />
      <Popper open={open} anchorEl={anchorRef.current} placement="bottom-start" sx={{ zIndex: 1300, minWidth: anchorRef.current?.offsetWidth, ...popperSx }} disablePortal>
        <ClickAwayListener mouseEvent="onMouseDown" onClickAway={() => setOpen(false)}>
          <Box
            role="listbox"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Escape" || e.key === "Tab") {
                shouldRefocusOnClose.current = true
                setOpen(false)
                return
              }
              if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                e.preventDefault()
                const inputs = Array.from(e.currentTarget.querySelectorAll<HTMLInputElement>("input[type=checkbox]"))
                const currentIndex = inputs.indexOf(e.target as HTMLInputElement)
                if (currentIndex === -1) return
                const nextIndex = e.key === "ArrowDown" ? Math.min(currentIndex + 1, inputs.length - 1) : Math.max(currentIndex - 1, 0)
                inputs[nextIndex].focus()
              }
            }}
            sx={{
              background: "white",
              border: "1px solid",
              borderColor: fr.colors.decisions.border.default.grey.default,
              borderRadius: "4px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
              padding: `${fr.spacing("1v")} ${fr.spacing("1v")} ${fr.spacing("1v")} ${fr.spacing("3v")}`,
              "& .fr-fieldset": { margin: 0 },
              "& .fr-fieldset__element": { margin: 0 },
              "& .fr-checkbox-group": { minHeight: "auto", marginTop: "0 !important", display: "flex" },
              "& .fr-checkbox-group label": {
                margin: "auto !important",
                marginLeft: `${fr.spacing("5v")} !important`,
                paddingTop: fr.spacing("1v"),
                paddingBottom: fr.spacing("1v"),
              },
              "& .fr-checkbox-group label::before": {
                margin: "auto !important",
                marginLeft: "0 !important",
              },
              "& .fr-hint-text": { marginTop: 0 },
            }}
          >
            <Checkbox
              small
              style={{ margin: 0 }}
              options={options.map((option, index) => ({
                label: option.label,
                hintText: option.hintText,
                nativeInputProps: {
                  checked: pendingValue.includes(option.value),
                  autoFocus: open && index === 0,
                  onChange: () => toggle(option.value),
                },
              }))}
            />
            <Box sx={{ display: "flex", justifyContent: "flex-end", padding: fr.spacing("1v") }}>
              <Button size="small" onClick={handleConfirm}>
                Enregistrer
              </Button>
            </Box>
          </Box>
        </ClickAwayListener>
      </Popper>
    </Box>
  )
}

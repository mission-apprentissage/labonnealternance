import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, ClickAwayListener, Grow, Link, MenuItem, MenuList, Paper, Popper } from "@mui/material"
import { useEffect, useRef, useState } from "react"

export type PopoverMenuAction = {
  label: string
  onClick?: () => void
  link?: string
  type: "button" | "link"
}

export const PopoverMenu = ({ actions, title }: { actions: { label: string; onClick?: () => void; link?: string; type: "button" | "link" }[]; title: string }) => {
  const [open, setOpen] = useState(false)
  const anchorRef = useRef<HTMLButtonElement>(null)

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen)
  }

  const handleClose = (event: Event | React.SyntheticEvent) => {
    if (anchorRef.current && anchorRef.current.contains(event.target as HTMLElement)) {
      return
    }
    setOpen(false)
  }

  function handleListKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Tab") {
      event.preventDefault()
      setOpen(false)
    } else if (event.key === "Escape") {
      setOpen(false)
    }
  }

  const prevOpen = useRef(open)
  useEffect(() => {
    if (prevOpen.current === true && open === false) {
      anchorRef.current!.focus()
    }

    prevOpen.current = open
  }, [open])

  return (
    <Box>
      <Button
        ref={anchorRef}
        id="composition-button"
        aria-controls={open ? "composition-menu" : undefined}
        aria-expanded={open ? "true" : undefined}
        aria-haspopup="true"
        onClick={handleToggle}
        priority="tertiary no outline"
        iconId="fr-icon-settings-5-line"
        title={title}
      />
      <Popper sx={{ zIndex: 1 }} open={open} anchorEl={anchorRef.current} role={undefined} placement="bottom-start" transition disablePortal>
        {({ TransitionProps, placement }) => (
          <Grow
            {...TransitionProps}
            style={{
              transformOrigin: placement === "bottom-start" ? "left top" : "left bottom",
            }}
          >
            <Paper sx={{ border: "1px solid", width: "max-content", minWidth: "200px", maxWidth: "300px" }}>
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList sx={{ py: 0, mt: "0 !important" }} autoFocusItem={open} id="composition-menu" aria-labelledby="composition-button" onKeyDown={handleListKeyDown}>
                  {actions.map((action, idx) => (
                    <MenuItem
                      key={idx}
                      onClick={handleClose}
                      disableGutters
                      sx={{ py: fr.spacing("1v"), mx: `${fr.spacing("1w")} !important`, mb: `0 !important`, fontSize: "14px !important", minHeight: "24px" }}
                    >
                      {action.type === "link" ? (
                        <Link underline="hover" href={action.link} aria-label={action.label}>
                          {action.label}
                        </Link>
                      ) : (
                        <Link underline="hover" component="button" onClick={action.onClick}>
                          {action.label}
                        </Link>
                      )}
                    </MenuItem>
                  ))}
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </Box>
  )
}

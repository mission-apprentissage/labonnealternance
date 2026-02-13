import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, ClickAwayListener, Grow, Link, MenuItem, MenuList, Paper, Popper } from "@mui/material"
import type { Dispatch } from "react"
import { useEffect, useRef, useState } from "react"

export type PopoverMenuAction = {
  label: string | React.JSX.Element
  onClick?: (any) => void
  link?: string
  ariaLabel?: string
  type: "button" | "link" | "externalLink"
} | null

export const PopoverMenu = ({
  actions,
  title,
  resetFlagsOnClose,
}: {
  actions: PopoverMenuAction[]
  title: string
  resetFlagsOnClose?: Dispatch<React.SetStateAction<boolean>>[]
}) => {
  const [open, setOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)
  const anchorRef = useRef<HTMLButtonElement>(null)

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen)
    setAnchorEl(anchorRef.current)
  }

  const handleClose = (event: Event | React.SyntheticEvent) => {
    if (anchorRef.current && anchorRef.current.contains(event.target as HTMLElement)) {
      return
    }
    setOpen(false)
    if (resetFlagsOnClose?.length) {
      resetFlagsOnClose.forEach((reset) => reset(false))
    }
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
      <Popper
        sx={{
          zIndex: 1000,
        }}
        open={open}
        anchorEl={anchorEl}
        role={undefined}
        placement="bottom-start"
        transition
        disablePortal
      >
        {({ TransitionProps, placement }) => (
          <Grow
            {...TransitionProps}
            style={{
              transformOrigin: placement === "bottom-start" ? "left top" : "left bottom",
            }}
          >
            <Paper
              sx={{
                border: "1px solid",
                width: "100%",
                minWidth: "200px",
                maxWidth: "300px",
              }}
            >
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList sx={{ py: 0, mt: "0 !important" }} autoFocusItem={open} id="composition-menu" aria-labelledby="composition-button" onKeyDown={handleListKeyDown}>
                  {actions.map((action, idx) =>
                    action !== null ? (
                      <MenuItem
                        key={idx}
                        onClick={handleClose}
                        disableGutters
                        sx={{
                          py: fr.spacing("3v"),
                          mx: `0 !important`,
                          px: `${fr.spacing("1w")} !important`,
                          mb: `0 !important`,
                          fontSize: "14px !important",
                          minHeight: "24px",

                          color: "#161616 !important",
                          borderLeft: "4px solid transparent",
                          ":hover": {
                            backgroundColor: fr.colors.decisions.background.contrast.info.default,
                            borderLeft: "4px solid #6A6AF4",
                          },
                          "&.Mui-focusVisible, & .MuiButtonBase-root.Mui-focusVisible": {
                            backgroundColor: fr.colors.decisions.background.contrast.info.default,
                            borderLeft: "4px solid #6A6AF4",
                          },
                        }}
                      >
                        {action.type === "link" || action.type === "externalLink" ? (
                          <Link
                            underline="none"
                            sx={{ width: "100%", textAlign: "left", color: "#161616 !important" }}
                            href={action.link}
                            aria-label={action.ariaLabel || (action.label as string)}
                            {...(action.type === "externalLink" ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                          >
                            {action.label}
                          </Link>
                        ) : (
                          <Link
                            underline="none"
                            component="button"
                            aria-label={action.ariaLabel || (action.label as string)}
                            onClick={action.onClick}
                            sx={{ width: "100%", textAlign: "left", color: "#161616 !important" }}
                          >
                            {action.label}
                          </Link>
                        )}
                      </MenuItem>
                    ) : null
                  )}
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </Box>
  )
}

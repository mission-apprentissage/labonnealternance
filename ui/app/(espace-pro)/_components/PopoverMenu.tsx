import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, ClickAwayListener, Grow, MenuItem, MenuList, Paper, Popper } from "@mui/material"
import type { Dispatch, ReactNode } from "react"
import { useEffect, useRef, useState } from "react"

export type PopoverMenuAction = {
  label: string | React.JSX.Element
  onClick?: (any) => void
  link?: string
  ariaLabel?: string
  type: "button" | "link" | "externalLink"
  icon?: ReactNode
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
        style={{
          outlineOffset: 0,
        }}
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
                width: "100%",
                minWidth: "200px",
                maxWidth: "300px",
                boxShadow: "0 4px 12px 0 rgba(0, 0, 18, 0.16)",
              }}
            >
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList sx={{ py: 0, mt: "0 !important" }} autoFocusItem={open} id="composition-menu" aria-labelledby="composition-button" onKeyDown={handleListKeyDown}>
                  {actions.map((action, idx) => {
                    if (action === null) return null

                    const isLink = action.type === "link" || action.type === "externalLink"

                    const menuItemSx = {
                      px: `${fr.spacing("2v")} !important`,
                      py: `${fr.spacing("3v")} !important`,
                      mx: `0 !important`,
                      mb: `0 !important`,
                      fontSize: "14px !important",
                      minHeight: "24px",
                      color: "#161616 !important",
                      borderLeft: "4px solid transparent",
                      display: "flex",
                      textDecoration: "none",
                      backgroundImage: "unset",
                      ":hover": {
                        backgroundColor: `${fr.colors.decisions.background.contrast.info.default} !important`,
                        borderLeft: "4px solid #6A6AF4",
                      },
                      "&.Mui-focusVisible": {
                        backgroundColor: `${fr.colors.decisions.background.contrast.info.default} !important`,
                        borderLeft: "4px solid #6A6AF4",
                      },
                    }

                    if (isLink) {
                      return (
                        <MenuItem
                          key={idx}
                          component="a"
                          href={action.link}
                          aria-label={action.ariaLabel || (action.label as string)}
                          onClick={handleClose}
                          disableGutters
                          sx={menuItemSx}
                          {...(action.type === "externalLink" ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                        >
                          {action.icon && <Box sx={{ display: "flex", color: fr.colors.decisions.text.actionHigh.blueFrance.default }}>{action.icon}</Box>}
                          {action.label}
                        </MenuItem>
                      )
                    }

                    return (
                      <MenuItem
                        key={idx}
                        aria-label={action.ariaLabel || (action.label as string)}
                        onClick={(event) => {
                          action.onClick?.(event)
                          handleClose(event)
                        }}
                        disableGutters
                        sx={menuItemSx}
                      >
                        {action.icon && <Box sx={{ display: "flex", color: fr.colors.decisions.text.actionHigh.blueFrance.default }}>{action.icon}</Box>}
                        {action.label}
                      </MenuItem>
                    )
                  })}
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </Box>
  )
}

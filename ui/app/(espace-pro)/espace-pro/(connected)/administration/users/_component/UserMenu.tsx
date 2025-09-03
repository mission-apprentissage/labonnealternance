import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, ClickAwayListener, Grow, Link, MenuItem, MenuList, Paper, Popper } from "@mui/material"
import { useEffect, useRef, useState } from "react"
import { getLastStatusEvent, IUserRecruteurForAdminJSON, IUserStatusValidationJson } from "shared"
import { ETAT_UTILISATEUR } from "shared/constants/recruteur"

export const UserMenu = ({
  row,
  setCurrentEntreprise,
  confirmationActivationUtilisateur,
  confirmationDesactivationUtilisateur,
}: {
  row: any
  setCurrentEntreprise: (entreprise: IUserRecruteurForAdminJSON | null) => void
  confirmationActivationUtilisateur: any
  confirmationDesactivationUtilisateur: any
}) => {
  const status = getLastStatusEvent(row.status as IUserStatusValidationJson[])?.status
  const canActivate = [ETAT_UTILISATEUR.DESACTIVE, ETAT_UTILISATEUR.ATTENTE].includes(status)
  const canDeactivate = [ETAT_UTILISATEUR.VALIDE, ETAT_UTILISATEUR.ATTENTE].includes(status)

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
        title="Actions sur l'offre"
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
                  <MenuItem disableGutters sx={{ py: fr.spacing("1v"), mx: `${fr.spacing("1w")} !important`, mb: `0 !important`, fontSize: "14px !important", minHeight: "24px" }}>
                    <Link underline="hover" href={`/espace-pro/administration/users/${row._id}`} aria-label="voir les informations">
                      Voir les informations
                    </Link>
                  </MenuItem>
                  {canActivate && (
                    <MenuItem
                      disableGutters
                      dense
                      sx={{ py: fr.spacing("1v"), mx: `${fr.spacing("1w")} !important`, mb: `0 !important`, fontSize: "14px !important", minHeight: "24px" }}
                    >
                      <Link
                        underline="hover"
                        component="button"
                        onClick={() => {
                          confirmationActivationUtilisateur.onOpen()
                          setCurrentEntreprise(row)
                        }}
                      >
                        Activer le compte
                      </Link>
                    </MenuItem>
                  )}

                  {canDeactivate && (
                    <MenuItem
                      disableGutters
                      onClick={handleClose}
                      sx={{ py: fr.spacing("1v"), mx: `${fr.spacing("1w")} !important`, mb: `0 !important`, fontSize: "14px !important", minHeight: "24px" }}
                    >
                      <Link
                        underline="hover"
                        component="button"
                        onClick={() => {
                          confirmationDesactivationUtilisateur.onOpen()
                          setCurrentEntreprise(row)
                        }}
                      >
                        Désactiver le compte
                      </Link>
                    </MenuItem>
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

import { useToast } from "@chakra-ui/react"
import { fr } from "@codegouvfr/react-dsfr"
import { Button } from "@codegouvfr/react-dsfr/Button"
import { Box, ClickAwayListener, Grow, Link, MenuItem, MenuList, Paper, Popper, Typography } from "@mui/material"
import { useQueryClient } from "@tanstack/react-query"
import dayjs from "dayjs"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { JOB_STATUS } from "shared"
import { AUTHTYPE } from "shared/constants/index"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import { buildJobUrl } from "shared/metier/lbaitemutils"

import { publicConfig } from "@/config.public"
import { useAuth } from "@/context/UserContext"
import { extendOffre } from "@/utils/api"

export const OffresTabsMenu = ({
  row,
  openSuppression,
  buildOfferEditionUrl,
}: {
  row: any
  openSuppression: (row: any) => any
  buildOfferEditionUrl: (offerId: string) => string
}) => {
  const router = useRouter()
  const toast = useToast()
  const client = useQueryClient()
  const { user } = useAuth()
  const [copied, setCopied] = useState(false)
  const [open, setOpen] = useState(false)
  const anchorRef = useRef<HTMLButtonElement>(null)

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen)
  }

  const handleClose = (event: Event | React.SyntheticEvent) => {
    if (anchorRef.current && anchorRef.current.contains(event.target as HTMLElement)) {
      return
    }
    setCopied(false)
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

  const [lat, lon] = (row.geo_coordinates ?? "").split(",")
  const cfaOptionParams =
    user.type === AUTHTYPE.ENTREPRISE
      ? {
          href: `${publicConfig.baseUrl}/espace-pro/entreprise/offre/${row._id}/mise-en-relation`,
          "aria-label": "Lien vers les mise en relations avec des centres de formations",
        }
      : {
          href: `${publicConfig.baseUrl}/recherche-formation?romes=${row.rome_code}&lon=${lon}&lat=${lat}`,
          target: "_blank",
          rel: "noopener noreferrer",
          "aria-label": "Lien vers les formations - nouvelle fenêtre",
        }
  const directLink = `${publicConfig.baseUrl}${buildJobUrl(LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA, row._id, row.rome_appellation_label || undefined)}`
  const isDisable = row.job_status === "Annulée" || row.job_status === "Pourvue" || row.job_status === "En attente"

  return (
    <Box display={isDisable ? "none" : "block"}>
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
                    <Link component="button" underline="hover" onClick={() => router.push(buildOfferEditionUrl(row._id))}>
                      Editer l'offre
                    </Link>
                  </MenuItem>
                  <MenuItem
                    disableGutters
                    dense
                    sx={{ py: fr.spacing("1v"), mx: `${fr.spacing("1w")} !important`, mb: `0 !important`, fontSize: "14px !important", minHeight: "24px" }}
                  >
                    <Link
                      component="button"
                      underline="hover"
                      onClick={(e) => {
                        extendOffre(row._id)
                          .then((job) =>
                            toast({
                              title: `Date d'expiration : ${dayjs(job.job_expiration_date).format("DD/MM/YYYY")}`,
                              position: "top-right",
                              status: "success",
                              duration: 2000,
                              isClosable: true,
                            })
                          )
                          .finally(() =>
                            client.invalidateQueries({
                              queryKey: ["offre-liste"],
                            })
                          )
                        handleClose(e)
                      }}
                    >
                      Prolonger l'offre
                    </Link>
                  </MenuItem>
                  <MenuItem
                    disableGutters
                    onClick={handleClose}
                    sx={{ py: fr.spacing("1v"), mx: `${fr.spacing("1w")} !important`, mb: `0 !important`, fontSize: "14px !important", minHeight: "24px" }}
                  >
                    <Link underline="hover" target="_blank" rel="noopener noreferrer" href={directLink} aria-label="Lien vers l'offre - nouvelle fenêtre">
                      Voir l'offre en ligne
                    </Link>
                  </MenuItem>
                  {row.job_status !== JOB_STATUS.EN_ATTENTE && (
                    <MenuItem
                      disableGutters
                      onClick={handleClose}
                      sx={{ py: fr.spacing("1v"), mx: `${fr.spacing("1w")} !important`, mb: `0 !important`, fontSize: "14px !important", minHeight: "24px" }}
                    >
                      <Link
                        underline="hover"
                        target="_blank"
                        rel="noopener noreferrer"
                        href={`${publicConfig.baseUrl}/espace-pro/offre/impression/${row._id}`}
                        aria-label="Lien vers la page d'impression de l'offre - nouvelle fenêtre"
                      >
                        Imprimer l'offre
                      </Link>
                    </MenuItem>
                  )}
                  <MenuItem disableGutters sx={{ py: fr.spacing("1v"), mx: `${fr.spacing("1w")} !important`, mb: `0 !important`, fontSize: "14px !important", minHeight: "24px" }}>
                    <Link
                      underline="hover"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        navigator.clipboard.writeText(directLink).then(function () {
                          setCopied(true)
                        })
                      }}
                      component="button"
                      aria-label="Copier le lien de partage de l'offre dans le presse papier"
                    >
                      {copied ? (
                        <Box sx={{ display: "flex" }}>
                          <Image width="17" height="24" src="/images/icons/share_copied_icon.svg" aria-hidden={true} alt="" />
                          <Typography component="span" ml={fr.spacing("1w")} fontSize="14px" mb={0} color="#18753C">
                            Lien copié !
                          </Typography>
                        </Box>
                      ) : (
                        "Partager l'offre"
                      )}
                    </Link>
                  </MenuItem>
                  {user.type !== AUTHTYPE.CFA && (
                    <MenuItem
                      onClick={handleClose}
                      disableGutters
                      sx={{ py: fr.spacing("1v"), mx: `${fr.spacing("1w")} !important`, mb: `0 !important`, fontSize: "14px !important", minHeight: "24px" }}
                    >
                      <Link underline="hover" {...cfaOptionParams}>
                        Voir les centres de formation
                      </Link>
                    </MenuItem>
                  )}
                  <MenuItem
                    onClick={handleClose}
                    disableGutters
                    sx={{ py: fr.spacing("1v"), mx: `${fr.spacing("1w")} !important`, mb: `0 !important`, fontSize: "14px !important", minHeight: "24px" }}
                  >
                    <Link
                      underline="hover"
                      component="button"
                      onClick={() => {
                        openSuppression(row)
                      }}
                    >
                      Supprimer l'offre
                    </Link>
                  </MenuItem>
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </Box>
  )
}

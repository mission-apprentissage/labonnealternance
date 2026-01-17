"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"

import LoadingEmptySpace from "@/app/(espace-pro)/_components/LoadingEmptySpace"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import DefaultContainer from "@/app/_components/Layout/DefaultContainer"
import { useUrlHash } from "@/app/hooks/useUrlHash"
import RessourcesCandidat from "@/components/Ressources/ressourcesCandidat"
import RessourcesCFA from "@/components/Ressources/ressourcesCFA"
import RessourcesRecruteur from "@/components/Ressources/ressourcesRecruteur"
import { PAGES } from "@/utils/routes.utils"

export default function Ressources() {
  const tabs = [
    { tabId: "candidat", label: "Candidats", content: <RessourcesCandidat /> },
    { tabId: "recruteur", label: "Recruteurs", content: <RessourcesRecruteur /> },
    { tabId: "cfa", label: "Organismes de formation", content: <RessourcesCFA /> },
  ]
  const [firstTab] = tabs

  const { hash, isClient } = useUrlHash()
  if (!isClient) return <LoadingEmptySpace />
  const selectedTabId = hash || firstTab.tabId
  const displayedTab = tabs.find((x) => x.tabId === selectedTabId) ?? firstTab

  return (
    <Box
      sx={{
        mb: fr.spacing("3w"),
      }}
    >
      <Breadcrumb pages={[PAGES.static.ressources]} />
      <DefaultContainer>
        <Box
          sx={{
            mb: fr.spacing("3w"),
          }}
        >
          <Typography id="editorial-content-container" component={"h1"} variant="h1" sx={{ color: fr.colors.decisions.text.default.info.default }}>
            Ressources
          </Typography>
        </Box>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(1, 1fr)", lg: "repeat(5, 1fr)" } }}>
          <Box sx={{ gridColumn: { xs: "span 5", lg: "span 1" }, pb: { xs: fr.spacing("2w"), lg: 0 } }}>
            <nav className="fr-sidemenu" aria-labelledby="fr-sidemenu-title">
              <div className="fr-sidemenu__inner">
                <button className="fr-sidemenu__btn" aria-controls="fr-sidemenu-wrapper" aria-expanded="false">
                  Dans cette rubrique
                </button>
                <div className="fr-collapse" id="fr-sidemenu-wrapper">
                  <ul className="fr-sidemenu__list">
                    {tabs.map(({ tabId, label }) => (
                      <li key={tabId} className={`fr-sidemenu__item ${selectedTabId === tabId ? "fr-sidemenu__item--active" : ""}`}>
                        <a className="fr-sidemenu__link" href={`#${tabId}`} target="_self" aria-current={selectedTabId === tabId ? "page" : undefined}>
                          {label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </nav>
          </Box>
          <Box sx={{ gridColumn: { xs: "span 1", lg: "span 4" } }}>{displayedTab.content}</Box>
        </Box>
      </DefaultContainer>
    </Box>
  )
}

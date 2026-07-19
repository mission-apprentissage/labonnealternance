"use client"

import type { WithRecherchePageParams } from "@/app/(candidat)/(recherche)/recherche/_utils/recherche.route.utils"
import { NewSearchOptInBanner } from "@/app/search/_components/NewSearchOptInBanner"
import { SearchHomeForm } from "@/app/search/_components/SearchHomeForm"
import { useNewSearchOptIn } from "@/app/search/_hooks/useNewSearchOptIn"

import { HomeRechercheForm } from "./HomeRechercheForm"

/**
 * Coexistence des deux moteurs sur la home : formulaire legacy + encart « Tester → » par
 * défaut ; une fois l'opt-in activé (flag localStorage), formulaire du nouveau moteur SANS
 * filtres + lien de sortie. Le SSR rend toujours le legacy (snapshot serveur du hook) et la
 * bascule est réactive : le store partagé re-rend ce composant à l'opt-in comme à l'opt-out.
 */
export function HomeRechercheOptIn(props: WithRecherchePageParams) {
  const { optedIn } = useNewSearchOptIn()

  if (optedIn) {
    return <SearchHomeForm />
  }

  return <HomeRechercheForm rechercheParams={props.rechercheParams} footer={<NewSearchOptInBanner />} />
}

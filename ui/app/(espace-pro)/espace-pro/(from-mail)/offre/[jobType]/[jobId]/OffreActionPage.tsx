"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box, Link, Typography } from "@mui/material"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"

import ClotureRecrutementForm, { type IClotureRecrutementPayload } from "@/app/(espace-pro)/_components/ClotureRecrutementForm"
import { cancelOffre } from "@/utils/api"
import { PAGES } from "@/utils/routes.utils"

const homeEditorialH2 = {
  color: "#3A3A3A",
  fontSize: "28px",
  lineHeight: "36px",
  fontWeight: 700,
}

export function OffreActionPage({ jobId, token }: { jobId: string; token: string }) {
  const [result, setResult] = useState<"ok" | "already-closed" | null>(null)
  const resultHeadingRef = useRef<HTMLHeadingElement>(null)
  const router = useRouter()

  // le bouton cliqué disparaît avec le formulaire : le focus suit le résultat
  useEffect(() => {
    if (result) {
      resultHeadingRef.current?.focus()
    }
  }, [result])

  const cancelAction = () => router.push(PAGES.static.home.getPath())

  const submitCloture = async (id: string, payload: IClotureRecrutementPayload) => cancelOffre(id, token, payload)

  return (
    <Box
      sx={{
        margin: "auto",
      }}
    >
      {result ? (
        <Typography component="h2" ref={resultHeadingRef} tabIndex={-1} sx={homeEditorialH2}>
          {result === "already-closed" ? "Cette offre était déjà clôturée. Votre réponse a bien été enregistrée." : "Votre offre a été modifiée"}
        </Typography>
      ) : (
        <ClotureRecrutementForm
          offreId={jobId}
          onSuccess={(cloturationResult) => setResult(cloturationResult?.alreadyClosed ? "already-closed" : "ok")}
          onCancel={cancelAction}
          submit={submitCloture}
        />
      )}

      <Box component="ul" sx={{ mt: fr.spacing("8v"), mb: 0, p: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: fr.spacing("6v"), "& > li": { pb: 0 } }}>
        <li>
          Aller sur le site{" "}
          <Link
            href={PAGES.static.home.getPath()}
            sx={{
              fontWeight: 700,
            }}
          >
            La bonne alternance
          </Link>
        </li>
        <li>
          Se connecter à votre{" "}
          <Link
            href={PAGES.static.authentification.getPath()}
            sx={{
              fontWeight: 700,
            }}
          >
            espace recruteur
          </Link>
        </li>
        {jobId && (
          <li>
            Voir{" "}
            <Link
              href={PAGES.dynamic.jobDetail({ type: LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA, jobId }).getPath()}
              sx={{
                fontWeight: 700,
              }}
            >
              l'offre
            </Link>{" "}
            sur le site La bonne alternance
          </li>
        )}
      </Box>
    </Box>
  )
}

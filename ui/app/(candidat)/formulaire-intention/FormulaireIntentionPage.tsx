"use client"

import { parseEnum } from "shared"
import { ApplicationIntention } from "shared/constants/application"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import { IntentionPage, useIntentionData } from "@/components/IntentionPage/IntentionPage"
import { getApplicationReplyBreadcrumb } from "@/utils/application-breadcrumb.utils"
import { useSearchParamsRecord } from "@/utils/use-search-params-record"

export default function FormulaireIntentionPage() {
  const { token, id, company_recruitment_intention } = useSearchParamsRecord()
  const intention = parseEnum(ApplicationIntention, company_recruitment_intention)
  // Même requête que le formulaire (même clé) : le fil d'Ariane ne déclenche pas de lecture de plus.
  const { data } = useIntentionData({ id, company_recruitment_intention: intention, token })
  const espacePro = data?.espace_pro

  return (
    <>
      {/* Lien magique du mail : le recruteur n'est pas forcément connecté, le proxy renvoie alors ces liens vers la connexion. */}
      {espacePro && intention && (
        <Breadcrumb
          pages={getApplicationReplyBreadcrumb({
            job_id: espacePro.job_id,
            cfaEstablishmentId: espacePro.cfa_establishment_id,
            establishmentName: espacePro.establishment_name,
            application_id: id,
            intention,
            applicantName: `${data.applicant_first_name} ${data.applicant_last_name.toUpperCase()}`,
          })}
        />
      )}
      <IntentionPage id={id} company_recruitment_intention={intention} token={token} />
    </>
  )
}

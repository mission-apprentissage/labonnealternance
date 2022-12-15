import { DisplayContext } from "../../context/DisplayContextProvider"
import React, { useEffect } from "react"
import { SendPlausibleEvent, SendTrackEvent } from "../../utils/plausible"
import { formatDate } from "../../utils/strutils"
import MatchaCompetences from "./MatchaComponents/MatchaCompetences"
import MatchaDescription from "./MatchaComponents/MatchaDescription"
import { Box, Link, Text } from "@chakra-ui/react"
import { ExternalLinkIcon } from "@chakra-ui/icons"

const getContractTypes = (contractTypes) => {
  return contractTypes instanceof Array ? contractTypes.join(", ") : contractTypes
}

const MatchaDetail = ({ job, seeInfo, setSeeInfo }) => {
  useEffect(() => {
    // S'assurer que l'utilisateur voit bien le haut de la fiche au départ
    document.getElementsByClassName("choiceCol")[0].scrollTo(0, 0)
  }, []) // Utiliser le useEffect une seule fois : https://css-tricks.com/run-useeffect-only-once/

  useEffect(() => {
    SendPlausibleEvent("Affichage - Fiche entreprise Offre LBA", {
      info_fiche: `${job?.job?.id}${formValues?.job?.label ? ` - ${formValues.job.label}` : ""}`,
    })
    SendTrackEvent({
      event: `Résultats Affichage Offre Matcha - Consulter fiche entreprise`,
      itemId: job?.job?.id,
    })
  }, [job?.job?.id])

  const jobStartDate = job?.job?.jobStartDate ? formatDate(job.job.jobStartDate) : undefined

  const { formValues } = React.useContext(DisplayContext)

  return (
    <>
      <Box pb="0px" mt={6} position="relative" background="white" padding={["1px 12px 50px 12px", "1px 24px 50px 24px", "1px 12px 24px 12px"]} mx={["0", "30px"]}>
        <Text as="h2" variant="itemDetailH2" mt={2}>
          Description de l&apos;offre
        </Text>
        <div className="c-matcha-detail-container">
          <div>
            <strong>Début du contrat le : </strong> {jobStartDate}
          </div>
          <div className="my-2">
            <strong>Nature du contrat : </strong> {getContractTypes(job?.job?.contractType)}
          </div>
          <div>
            <strong>Niveau visé en fin d&apos;études :</strong>{" "}
            {job?.diplomaLevel ? (
              <>
                <div className="c-required-levels">
                  {job?.diplomaLevel.split(", ").map(function (d, idx) {
                    return (
                      <span key={idx} className="c-required-level">
                        {d}
                      </span>
                    )
                  })}
                </div>
              </>
            ) : (
              "non défini"
            )}
          </div>

          {job?.job?.elligibleHandicap ? (
            <div className="c-eligible mt-3">
              <div>
                <img className="" src="/images/info.svg" alt="A noter" />
              </div>
              <div className="ml-2">À compétences égales, une attention particulière sera apportée aux personnes en situation de handicap.</div>
            </div>
          ) : (
            ""
          )}
        </div>
        {job?.company?.mandataire ? (
          <>
            <p>
              Offre publiée par <span className="c-detail-bolded">{job.company.name}</span> pour une entreprise partenaire du centre de formation.
            </p>
          </>
        ) : (
          <>
            <p>
              <span className="c-detail-bolded">{job.company.name}</span> recrute dans le domaine suivant <span className="c-detail-bolded">{job.title}</span>. Cela signifie que
              l&apos;établissement est activement à la recherche d&apos;un.e candidat.e.
            </p>
            <p>Vous avez donc tout intérêt à le contacter rapidement, avant que l&apos;offre ne soit pourvue !</p>
            <Box mb="0">
              Trouver et convaincre une entreprise de vous embaucher ?
              <br />
              <Link
                isExternal
                variant="basicUnderlined"
                href="https://dinum-beta.didask.com/courses/demonstration/60d21bf5be76560000ae916e"
                aria-label="Lien vers des conseils pour préparer son premier contact avec un CFA"
              >
                On vous donne des conseils ici pour vous aider !
                <ExternalLinkIcon mb="3px" ml="2px" />
              </Link>
            </Box>
          </>
        )}
      </Box>

      {job?.job.romeDetails && (
        <Box pb="0px" mt={6} position="relative" background="white" padding={["1px 12px 50px 12px", "1px 24px 50px 24px", "1px 12px 24px 12px"]} mx={["0", "30px"]}>
          <Text as="h2" variant="itemDetailH2" mt={2}>{`En savoir plus sur ${job.title}`}</Text>
          <div className="text-left" data-testid="lbb-component">
            <div className="mb-3">
              <MatchaDescription job={job} />
              <MatchaCompetences job={job} />
            </div>
          </div>
        </Box>
      )}
    </>
  )
}

export default MatchaDetail

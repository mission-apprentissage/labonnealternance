import React, { useState, useEffect } from "react"
import { Button, Modal, ModalHeader } from "reactstrap"
import { useFormik } from "formik"
import CandidatureSpontaneeNominalBodyFooter from "./CandidatureSpontaneeNominalBodyFooter"
import CandidatureSpontaneeWorked from "./CandidatureSpontaneeWorked"
import CandidatureSpontaneeFailed from "./CandidatureSpontaneeFailed"
import submitCandidature from "./services/submitCandidature"
import toggleCandidature from "./services/toggleCandidature"
import { getValidationSchema, getInitialSchemaValues } from "./services/getSchema"
import { string_wrapper as with_str } from "../../../utils/wrapper_utils"
import useLocalStorage from "./services/useLocalStorage"
import hasAlreadySubmittedCandidature from "./services/hasAlreadySubmittedCandidature"
import { getItemId } from "../../../utils/getItemId"
import { SendPlausibleEvent } from "../../../utils/plausible"
import { capitalizeFirstLetter } from "../../../utils/strutils"

const CandidatureSpontanee = (props) => {
  const [modal, setModal] = useState(false)
  const [sendingState, setSendingState] = useState("not_sent")
  const kind = props?.item?.ideaType || ""

  const uniqId = (kind, item) => {
    return `candidaturespontanee-${kind}-${getItemId(item)}`
  }

  const actualLocalStorage = props.fakeLocalStorage || window.localStorage || {}

  const toggle = () => {
    toggleCandidature({ modal, setSendingState, setModal })
  }

  const openApplicationForm = () => {
    toggle()
    SendPlausibleEvent(props.item.ideaType === "matcha" ? "Clic Postuler - Fiche entreprise Offre LBA" : "Clic Postuler - Fiche entreprise Algo", {
      info_fiche: getItemId(props.item),
    })
  }

  const [applied, setApplied] = useLocalStorage(uniqId(kind, props.item), null, actualLocalStorage)

  useEffect(() => {
    setModal(false)

    // HACK HERE : reapply setApplied to currentUniqId to re-detect
    // if user already applied each time the user swap to another item.
    let currentUniqId = actualLocalStorage.getItem(uniqId(kind, props.item))
    if (currentUniqId) {
      setApplied(currentUniqId)
    } else {
      // setApplied(null) is MANDATORY to avoid "already-applied message" when user swaps.
      setApplied(null)
    }
  }, [props?.item])

  const formik = useFormik({
    initialValues: getInitialSchemaValues(),
    validationSchema: getValidationSchema(kind),
    onSubmit: async (applicantValues) => {
      let success = await submitCandidature({ applicantValues, setSendingState, item: props.item })
      if (success) {
        setApplied(Date.now().toString())
      }
    },
  })

  return (
    <div className="c-candidature" data-testid="CandidatureSpontanee">
      <div className="c-detail-description-me">
        <div className="c-detail-pelink my-3">
          {hasAlreadySubmittedCandidature({ applied, modal }) ? (
            <>
              <div data-testid="already-applied">
                Vous avez déjà postulé le{" "}
                {new Date(parseInt(applied, 10)).toLocaleDateString("fr-FR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            </>
          ) : (
            <>
              <Button
                onClick={openApplicationForm}
                className={`btn btn-blue ml-1 gtmFormulaireCandidature gtm${capitalizeFirstLetter(kind)}`}
                aria-label="jenvoie-une-candidature-spontanee"
              >
                J&apos;envoie ma candidature{with_str(kind).amongst(["lbb", "lba"]) ? " spontanée" : ""}
              </Button>
              <Modal isOpen={modal} toggle={toggle} className={"c-candidature-modal"} backdrop="static">
                <form onSubmit={formik.handleSubmit} className="c-candidature-form">
                  <ModalHeader toggle={toggle} className={"c-candidature-modal-header"}></ModalHeader>

                  {with_str(sendingState).amongst(["not_sent", "currently_sending"]) ? (
                    <CandidatureSpontaneeNominalBodyFooter formik={formik} sendingState={sendingState} company={props?.item?.company?.name} item={props?.item} kind={kind} />
                  ) : (
                    <></>
                  )}

                  {with_str(sendingState).amongst(["ok_sent"]) ? (
                    <CandidatureSpontaneeWorked kind={kind} email={formik.values.email} company={props?.item?.company?.name} />
                  ) : (
                    <></>
                  )}

                  {with_str(sendingState).amongst(["not_sent_because_of_errors", "email temporaire non autorisé", "max candidatures atteint", "Too Many Requests"]) ? (
                    <CandidatureSpontaneeFailed sendingState={sendingState} />
                  ) : (
                    <></>
                  )}
                </form>
              </Modal>
            </>
          )}
        </div>
        {props?.item?.company?.mandataire ? (
          <>
            <div className="c-mandataire-hint d-flex-center my-3">
              <span className="c-mandataire-hintimg">
                <img className="" src="/images/icons/small_info.svg" alt="point info" />
              </span>
              <span className="c-mandataire-hinttext ml-2">
                <span className="">Votre candidature sera envoyée au centre de formation en charge du recrutement pour le compte de l’entreprise. </span>
              </span>
            </div>
          </>
        ) : (
          ""
        )}
      </div>
    </div>
  )
}

export default CandidatureSpontanee

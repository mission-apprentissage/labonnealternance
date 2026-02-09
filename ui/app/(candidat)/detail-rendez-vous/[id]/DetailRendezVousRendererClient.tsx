"use client"
import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography, List, ListItem } from "@mui/material"
import { useFormik } from "formik"
import { useState } from "react"
import type { IAppointmentRecapJson } from "shared"
import * as Yup from "yup"

import { FormLayoutComponent } from "@/components/espace_pro/Candidat/layout/FormLayoutComponent"
import { CfaCandidatInformationAnswered } from "@/components/espace_pro/CfaCandidatInformationPage/CfaCandidatInformationAnswered"
import { CfaCandidatInformationForm } from "@/components/espace_pro/CfaCandidatInformationPage/CfaCandidatInformationForm"
import { CfaCandidatInformationOther } from "@/components/espace_pro/CfaCandidatInformationPage/CfaCandidatInformationOther"
import { CfaCandidatInformationUnreachable } from "@/components/espace_pro/CfaCandidatInformationPage/CfaCandidatInformationUnreachable"
import { RdvReasons } from "@/components/RDV/RdvReasons"
import { apiPost } from "@/utils/api.utils"

export default function DetailRendezVousRendererClient({ appointmentId, appointment, token }: { appointmentId: string; appointment: IAppointmentRecapJson; token: string }) {
  const [currentState, setCurrentState] = useState("initial")

  const formik = useFormik({
    initialValues: {
      message: "",
    },
    validationSchema: Yup.object({ message: Yup.string().required("Veuillez remplir le message") }),
    onSubmit: async (values) => {
      setCurrentState("sending")

      await apiPost("/appointment-request/reply", {
        body: {
          appointment_id: appointmentId,
          cfa_intention_to_applicant: "personalised_answer",
          cfa_message_to_applicant: values.message,
        },
        headers: {
          authorization: `Bearer ${token}`,
        },
      })

      setCurrentState("answered")
    },
  })

  const otherClicked = async () => {
    setCurrentState("sending")

    await apiPost("/appointment-request/reply", {
      body: {
        appointment_id: appointmentId,
        cfa_intention_to_applicant: "other_channel",
        cfa_message_to_applicant: "",
      },
      headers: {
        authorization: `Bearer ${token}`,
      },
    })
    setCurrentState("other")
  }
  const unreachableClicked = async () => {
    setCurrentState("sending")

    await apiPost("/appointment-request/reply", {
      body: {
        appointment_id: appointmentId,
        cfa_intention_to_applicant: "no_answer",
        cfa_message_to_applicant: "",
      },
      headers: {
        authorization: `Bearer ${token}`,
      },
    })
    setCurrentState("unreachable")
  }

  return (
    <FormLayoutComponent
      headerText={
        <>
          Un candidat souhaite <br />
          être contacté <br />
          <Typography
            variant="h2"
            component="span"
            sx={{
              color: "text.secondary",
            }}
          >
            par votre centre de formation
          </Typography>
        </>
      }
    >
      {appointment?.user && (
        <Box sx={{ my: fr.spacing("2w") }}>
          <Typography component="span" color="primary" variant="h6">
            Voici les coordonnées du contact :{" "}
          </Typography>
          <Box sx={{ my: fr.spacing("2w") }}>
            {appointment.user?.type && (
              <Typography component={"span"} variant="h6">
                {appointment.user.type === "parent" ? "Le parent" : "L'étudiant"}
              </Typography>
            )}
            <Typography sx={{ mt: fr.spacing("3w") }}>
              Nom :{" "}
              <Typography component="span">
                <strong>{appointment.user.lastname}</strong>
              </Typography>
            </Typography>
            <Typography>
              Prénom :{" "}
              <Typography component="span">
                <b>{appointment.user.firstname}</b>
              </Typography>
            </Typography>
            <Typography sx={{ mt: fr.spacing("3w") }}>
              Numéro de téléphone :{" "}
              <Typography component="span">
                <b>{appointment.user.phone.match(/.{1,2}/g).join(".")}</b>
              </Typography>
            </Typography>
            <Typography>
              Email :{" "}
              <Typography component="span">
                <b>{appointment.user.email}</b>
              </Typography>
            </Typography>
          </Box>
          <hr />
          <Box sx={{ mb: fr.spacing("2w") }}>
            <Typography component="p" sx={{ mt: fr.spacing("1v") }}>
              Il ou elle souhaite aborder avec vous le(s) sujet(s) suivant(s) :
            </Typography>
            <Typography component="p">
              <List sx={{ listStyleType: "disc", pl: 2 }}>
                {(appointment.appointment?.applicant_reasons || []).map((reason, i) => {
                  return (
                    <ListItem key={i} sx={{ display: "list-item" }}>
                      <strong>{RdvReasons.find((item) => item.key === reason).title}</strong>
                    </ListItem>
                  )
                })}
              </List>
            </Typography>
            {(appointment.appointment?.applicant_reasons || []).includes("autre") ? (
              <Typography component="p" sx={{ bgcolor: "#F6F6F6", color: "#2A2A2A", fontSize: "16px", lineHeight: "24px", fontWeight: 700, px: 4, py: 2 }}>
                {appointment.appointment.applicant_message_to_cfa}
              </Typography>
            ) : (
              <Typography component="div" sx={{ marginTop: 2 }}></Typography>
            )}
            {appointment.formation && (
              <>
                <Typography component="p" sx={{ mt: 2 }}>
                  à propos de la formation : <strong>{appointment.formation.training_intitule_long}</strong>
                </Typography>
                <Typography component="p" sx={{ mt: 1 }}>
                  dispensée par :{" "}
                  <strong>
                    {appointment.formation.etablissement_formateur_raison_sociale}, {appointment.formation.lieu_formation_street}, {appointment.formation.lieu_formation_zip_code},{" "}
                    {appointment.formation.lieu_formation_city}
                  </strong>
                </Typography>
              </>
            )}
          </Box>
          <hr />
          {currentState === "initial" ? (
            <CfaCandidatInformationForm formik={formik} setCurrentState={setCurrentState} otherClicked={otherClicked} unreachableClicked={unreachableClicked} />
          ) : (
            <></>
          )}
          {currentState === "sending" ? <div>Envoi en cours...</div> : <></>}
          {currentState === "answered" ? <CfaCandidatInformationAnswered msg={formik.values.message} /> : <></>}
          {currentState === "other" ? <CfaCandidatInformationOther /> : <></>}
          {currentState === "unreachable" ? <CfaCandidatInformationUnreachable /> : <></>}
        </Box>
      )}
    </FormLayoutComponent>
  )
}

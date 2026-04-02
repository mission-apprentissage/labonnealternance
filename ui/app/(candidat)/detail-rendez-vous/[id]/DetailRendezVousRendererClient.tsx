"use client"
import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, List, ListItem, Typography } from "@mui/material"
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

type State = "initial" | "sending" | "answered" | "other" | "unreachable" | "error"

export default function DetailRendezVousRendererClient({ appointmentId, appointment, token }: { appointmentId: string; appointment: IAppointmentRecapJson; token: string }) {
  const [currentState, setCurrentState] = useState<State>("initial")

  const formik = useFormik({
    initialValues: {
      message: "",
    },
    validateOnChange: false,
    validateOnBlur: true,
    validationSchema: Yup.object({ message: Yup.string().required("Veuillez remplir le message") }),
    onSubmit: async (values) => {
      setCurrentState("sending")
      try {
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
      } catch {
        setCurrentState("error")
      }
    },
  })

  const otherClicked = async () => {
    setCurrentState("sending")
    try {
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
    } catch {
      setCurrentState("error")
    }
  }

  const unreachableClicked = async () => {
    setCurrentState("sending")
    try {
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
    } catch {
      setCurrentState("error")
    }
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
        <Box sx={{ my: fr.spacing("4v") }}>
          <Typography component="span" color="primary" variant="h6">
            Voici les coordonnées du contact :{" "}
          </Typography>
          <Box sx={{ my: fr.spacing("4v") }}>
            {appointment.user?.type && (
              <Typography component={"span"} variant="h6">
                {appointment.user.type === "parent" ? "Le parent" : "L'étudiant"}
              </Typography>
            )}
            <Typography sx={{ mt: fr.spacing("6v") }}>
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
            <Typography sx={{ mt: fr.spacing("6v") }}>
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
          <Box sx={{ mb: fr.spacing("4v") }}>
            <Typography component="p" sx={{ mt: fr.spacing("2v") }}>
              Il ou elle souhaite aborder avec vous le(s) sujet(s) suivant(s) :
            </Typography>
            <Typography component="div">
              <List sx={{ listStyleType: "disc", pl: fr.spacing("4v") }}>
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
                <Typography component="p" sx={{ mt: fr.spacing("4v") }}>
                  à propos de la formation : <strong>{appointment.formation.training_intitule_long}</strong>
                </Typography>
                <Typography component="p" sx={{ mt: fr.spacing("2v") }}>
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
          {currentState === "initial" && (
            <CfaCandidatInformationForm formik={formik} setCurrentState={setCurrentState} otherClicked={otherClicked} unreachableClicked={unreachableClicked} />
          )}
          {currentState === "sending" && (
            <Box sx={{ mt: fr.spacing("8v"), p: fr.spacing("8v"), backgroundColor: "#F5F5FE" }}>
              <Typography>Envoi en cours...</Typography>
            </Box>
          )}
          {currentState === "answered" && <CfaCandidatInformationAnswered msg={formik.values.message} />}
          {currentState === "other" && <CfaCandidatInformationOther />}
          {currentState === "unreachable" && <CfaCandidatInformationUnreachable />}
          {currentState === "error" && (
            <Box sx={{ mt: fr.spacing("8v"), p: fr.spacing("8v"), backgroundColor: "#F5F5FE" }}>
              <Typography sx={{ fontWeight: 700, color: "#CE0500", mb: fr.spacing("4v") }}>Une erreur est survenue. Veuillez réessayer.</Typography>
              <Button priority="secondary" onClick={() => setCurrentState("initial")}>
                Réessayer
              </Button>
            </Box>
          )}
        </Box>
      )}
    </FormLayoutComponent>
  )
}

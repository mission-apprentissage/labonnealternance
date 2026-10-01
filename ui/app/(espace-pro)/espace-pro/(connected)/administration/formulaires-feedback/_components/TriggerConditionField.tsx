"use client"

import Select from "@codegouvfr/react-dsfr/Select"
import { Box } from "@mui/material"
import { getIn, useFormikContext } from "formik"
import type { IFeedbackTriggerEvent, IFeedbackTriggerType } from "shared/models/feedback-form.model"
import { FEEDBACK_DELAY_MAX_SECONDS, FEEDBACK_DELAY_MIN_SECONDS, FEEDBACK_TRIGGER_EVENTS, FEEDBACK_TRIGGER_TYPES } from "shared/models/feedback-form.model"

import CustomInput from "@/app/_components/CustomInput"

import { TRIGGER_EVENT_LABEL, TRIGGER_TYPE_LABEL } from "../_utils/feedbackTrigger.labels"
import type { IFeedbackFormDraft } from "../_utils/questionDrafts"

const numberValue = (raw: string) => (raw === "" ? "" : Number(raw))

/**
 * Type de déclencheur et son paramètre. La saisie de chaque type est conservée quand on en change :
 * seuls les paramètres du type retenu sont enregistrés.
 */
export function TriggerConditionField() {
  const { values, errors, touched, setFieldValue, setFieldTouched } = useFormikContext<IFeedbackFormDraft>()
  const { type, event } = values.trigger
  const eventError = getIn(touched, "trigger.event") ? (getIn(errors, "trigger.event") as string | undefined) : undefined

  return (
    <Box>
      <Select
        label="Déclenchement"
        hint="Ce qui fait apparaître le bouton « Donner mon avis »"
        nativeSelectProps={{
          name: "trigger.type",
          value: type,
          onChange: (changeEvent) => setFieldValue("trigger.type", changeEvent.target.value as IFeedbackTriggerType),
        }}
      >
        {FEEDBACK_TRIGGER_TYPES.map((value) => (
          <option key={value} value={value}>
            {TRIGGER_TYPE_LABEL[value]}
          </option>
        ))}
      </Select>

      {type === "interactions" && (
        <CustomInput
          name="trigger.minInteractions"
          label="Interactions avant affichage"
          info="Clics sur des liens, boutons ou champs de la page, cumulés sur la session"
          type="number"
          inputProps={{ min: 1 }}
          value={values.trigger.minInteractions}
          onChange={(changeEvent) => setFieldValue("trigger.minInteractions", numberValue(changeEvent.target.value))}
        />
      )}

      {type === "delay" && (
        <CustomInput
          name="trigger.delaySeconds"
          label="Temps sur la page (secondes)"
          info={`De ${FEEDBACK_DELAY_MIN_SECONDS} à ${FEEDBACK_DELAY_MAX_SECONDS} secondes, onglet visible, même sans aucune interaction`}
          type="number"
          inputProps={{ min: FEEDBACK_DELAY_MIN_SECONDS, max: FEEDBACK_DELAY_MAX_SECONDS }}
          value={values.trigger.delaySeconds}
          onChange={(changeEvent) => setFieldValue("trigger.delaySeconds", numberValue(changeEvent.target.value))}
        />
      )}

      {type === "event" && (
        <Select
          label="Événement"
          hint={event ? TRIGGER_EVENT_LABEL[event].hint : undefined}
          state={eventError ? "error" : "default"}
          stateRelatedMessage={eventError}
          nativeSelectProps={{
            name: "trigger.event",
            value: event ?? "",
            onChange: (changeEvent) => setFieldValue("trigger.event", changeEvent.target.value as IFeedbackTriggerEvent),
            onBlur: () => setFieldTouched("trigger.event", true),
          }}
        >
          {FEEDBACK_TRIGGER_EVENTS.map((value) => (
            <option key={value} value={value}>
              {TRIGGER_EVENT_LABEL[value].label}
            </option>
          ))}
        </Select>
      )}
    </Box>
  )
}

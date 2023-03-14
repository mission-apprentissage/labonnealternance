import { Tr, Td, Text } from "@chakra-ui/react"
import { formatDate } from "../../common/dayjs"

/**
 * @description Row table component.
 * @param {Object} props
 * @param {Object} props.appointment
 * @returns {JSX.Element}
 */
export const AppointmentItemList = (props) => (
  <Tr id={props.appointment._id} _hover={{ bg: "#f4f4f4", transition: "0.5s" }} transition="0.5s">
    <Td>{formatDate(props.appointment.created_at)}</Td>
    <Td>
      {props.appointment.candidat.firstname} {props.appointment.candidat.lastname}
    </Td>
    <Td color="#295a9f" _hover={{ textDecoration: "underline" }}>
      <a href={`tel:${props.appointment.candidat.phone}`} color="#295a9f">
        {props.appointment.candidat.phone}
      </a>
    </Td>
    <Td color="#295a9f" _hover={{ textDecoration: "underline" }}>
      <a href={`mailto:${props.appointment.candidat.email}`}>{props.appointment.candidat.email}</a>
    </Td>
    <Td color="#295a9f" _hover={{ textDecoration: "underline" }}>
      <a href={`mailto:${props.appointment.cfa_recipient_email}`}>{props.appointment.cfa_recipient_email}</a>
    </Td>
    <Td>{props.appointment.formation?.etablissement_gestionnaire_entreprise_raison_sociale || "N/A"}</Td>
    <Td>{props.appointment.formation?.etablissement_formateur_siret}</Td>
    <Td>{props.appointment.formation?.intitule_long}</Td>
    <Td>
      <Text>{props.appointment.appointment_origin}</Text>
    </Td>
    <Td>
      <Text>{props.appointment.applicant_message_to_cfa}</Text>
    </Td>
  </Tr>
)

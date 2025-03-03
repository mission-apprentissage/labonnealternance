import { Box, Checkbox, CheckboxGroup, Flex, FormControl, FormErrorMessage, FormHelperText, FormLabel, Input, Link, Select, Text } from "@chakra-ui/react"
import dayjs from "dayjs"
import { useFormikContext } from "formik"
import { useRouter } from "next/router"
import { useContext } from "react"
import { IAppellationsRomes } from "shared"
import { TRAINING_CONTRACT_TYPE, TRAINING_RYTHM } from "shared/constants/recruteur"

import { AUTHTYPE } from "@/common/contants"
import { debounce } from "@/common/utils/debounce"
import { LogoContext } from "@/context/contextLogo"
import { useAuth } from "@/context/UserContext"
import { ExternalLinkLine, Warning } from "@/theme/components/icons"
import { apiGet } from "@/utils/api.utils"

import CustomInput from "../CustomInput"
import DropdownCombobox from "../DropdownCombobox"

import { ChampNombre } from "./ChampNombre"

const ISO_DATE_FORMAT = "YYYY-MM-DD"

export const FormikCreationOffreFields = ({ onRomeChange }: { onRomeChange: (rome: string, appellation: string) => void }) => {
  const router = useRouter()
  const { user } = useAuth()
  const { organisation } = useContext(LogoContext)

  const { type } = router.query as { establishment_id: string; email: string; userId: string; type: string; token: string }

  const handleJobSearch = async (search: string) => {
    if (search.trim().length !== 0) {
      try {
        const result = (await apiGet(`/v1/metiers/intitule`, { querystring: { label: search } })) as IAppellationsRomes
        return result.coupleAppellationRomeMetier
      } catch (error) {
        throw new Error(error)
      }
    }
    return []
  }

  const minStartDate = dayjs().startOf("day")
  const maxStartDate = dayjs().add(2, "years")

  const { values, setFieldValue, handleChange, errors, touched } = useFormikContext<any>()
  return (
    <>
      <FormControl isRequired>
        <FormLabel>Métier</FormLabel>
        <DropdownCombobox
          handleSearch={debounce(handleJobSearch, 300)}
          saveSelectedItem={(values: IAppellationsRomes["coupleAppellationRomeMetier"][number]) => {
            /**
             * validator broken when using setFieldValue : https://github.com/formium/formik/issues/2266
             * work around until v3 : setTimeout
             */
            setTimeout(async () => {
              setFieldValue("rome_label", values.intitule)
              setFieldValue("rome_appellation_label", values.appellation)
              setFieldValue("rome_code", [values.code_rome])
              onRomeChange(values.code_rome, values.appellation)
            }, 0)
          }}
          name="rome_label"
          value={values.rome_appellation_label}
          placeholder="Rechercher un métier.."
          dataTestId="offre-metier"
        />
      </FormControl>
      {values.rome_label && (
        <Box mt={6}>
          <CustomInput
            required={false}
            name="offer_title_custom"
            label="Intitulé de l'offre si différent"
            info="Personnalisez le titre du poste (Facultatif)"
            type="text"
            value={values.offer_title_custom}
          />
        </Box>
      )}
      <FormControl mt={6} isRequired>
        <Box mb={4}>
          <FormLabel display="inline-block" mb={0}>
            Type de contrat en alternance{" "}
          </FormLabel>
          <Link
            href="https://www.service-public.fr/professionnels-entreprises/vosdroits/F31704"
            isExternal
            ml={1}
            aria-label="Accès au contrat en alternance - nouvelle fenêtre"
            color="bluefrance.500"
            display="inline-block"
            sx={{
              "& > *": {
                textDecoration: "underline",
              },
            }}
          >
            <Text as="span" display="inline-block" fontSize="sm">
              En savoir plus
            </Text>
            <ExternalLinkLine ml={2} w={3} />
          </Link>
        </Box>
        <CheckboxGroup
          onChange={(value) => {
            setFieldValue("job_type", value)
          }}
          value={values.job_type}
          defaultValue={["Apprentissage"]}
          data-testid="offre-job-type"
        >
          {Object.values(TRAINING_CONTRACT_TYPE).map((label) => (
            <Checkbox
              key={label}
              value={label}
              sx={{
                ml: 5,
                mb: 3,
                "&:first": {
                  ml: 0,
                },
              }}
            >
              <span data-testid={label}>{label}</span>
            </Checkbox>
          ))}
        </CheckboxGroup>
      </FormControl>
      <FormControl mt={6} isRequired>
        <FormLabel>Niveau visé en fin d’études</FormLabel>
        <Select size="md" name="job_level_label" defaultValue={values.job_level_label} onChange={handleChange}>
          <option value="Indifférent">Indifférent</option>
          <option value="Cap, autres formations niveau (Infrabac)">Cap, autres formations niveau (Infrabac)</option>
          <option value="BP, Bac, autres formations niveau (Bac)">BP, Bac, autres formations niveau (Bac)</option>
          <option value="BTS, DEUST, autres formations niveau (Bac+2)">BTS, DEUST, autres formations niveau (Bac+2)</option>
          <option value="Licence, Maîtrise, autres formations niveaux 6 (Bac+3 à Bac+4)">Licence, Maîtrise, autres formations niveaux 6 (Bac+3 à Bac+4)</option>
          <option value="Master, titre ingénieur, autres formations niveau (Bac+5)">Master, titre ingénieur, autres formations niveau (Bac+5)</option>
        </Select>
        {errors.job_level_label && touched.job_level_label && <FormErrorMessage>{errors.job_level_label as string}</FormErrorMessage>}
      </FormControl>
      <Box mt={6}>
        <CustomInput
          required={true}
          name="job_start_date"
          label="Date de début"
          type="date"
          value={values.job_start_date}
          min={minStartDate.format(ISO_DATE_FORMAT)}
          max={maxStartDate.format(ISO_DATE_FORMAT)}
        />
      </Box>
      {organisation !== "atlas" && (
        <FormControl mt={6}>
          <Checkbox name="is_disabled_elligible" isChecked={values.is_disabled_elligible} onChange={handleChange}>
            <Text ml={3}>
              Je souhaite faire figurer sur l’offre la mention suivante: <br />
              <Text as="cite">"À compétences égales, une attention particulière sera apportée aux personnes en situation de handicap."</Text>
            </Text>
          </Checkbox>
        </FormControl>
      )}
      <FormControl mt={6} maxWidth={["400px", "400px", "400px", "450px"]}>
        <ChampNombre max={10} name="job_count" value={values.job_count} label="Nombre de poste(s) disponible(s)" handleChange={setFieldValue} dataTestId="offre-job-count" />
      </FormControl>
      {/* @ts-expect-error: TODO */}
      <FormControl mt={6} isInvalid={errors.job_duration} maxWidth={["400px", "400px", "400px", "450px"]}>
        <Flex align="center" gap={6}>
          <Text flexGrow={2}>Durée du contrat (mois)</Text>
          <Input
            maxWidth="128px"
            name="job_duration"
            value={values.job_duration}
            onChange={(e) => (parseInt(e.target.value) > 0 ? setFieldValue("job_duration", parseInt(e.target.value)) : setFieldValue("job_duration", null))}
          />
        </Flex>
        <FormErrorMessage>
          <Flex direction="row" alignItems="center">
            <Warning m={0} />
            <Flex ml={1}>{errors.job_duration as string}</Flex>
          </Flex>
        </FormErrorMessage>
      </FormControl>
      {Boolean((user && user.type !== AUTHTYPE.ENTREPRISE) || (type && type !== AUTHTYPE.ENTREPRISE)) && (
        <FormControl mt={6}>
          <FormLabel>Rythme de l'alternance (formation / entreprise)</FormLabel>
          <FormHelperText pb={2}>Facultatif</FormHelperText>
          <Select variant="outline" size="md" name="job_rythm" defaultValue={values.job_rythm} onChange={handleChange}>
            <option value="" hidden>
              Choisissez un rythme
            </option>
            {Object.values(TRAINING_RYTHM).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </Select>
          {errors.job_rythm && touched.job_rythm && <FormErrorMessage>{errors.job_rythm as string}</FormErrorMessage>}
        </FormControl>
      )}
    </>
  )
}

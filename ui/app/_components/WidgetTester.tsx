"use client"

import { ExternalLinkIcon } from "@chakra-ui/icons"
import { Box, Button, Container, Grid, GridItem, Input, Link, Radio, RadioGroup, Select, Stack, Text } from "@chakra-ui/react"
import { ErrorMessage, Field, Form, Formik } from "formik"
import React, { useState } from "react"

import { AutoCompleteField, autoCompleteToStringFunction, compareAutoCompleteValues } from "@/components/AutoCompleteField/AutoCompleteField"

import { baseUrl } from "../../config/config"
import { fetchAddresses } from "../../services/baseAdresse"
import domainChanged from "../../services/domainChanged"

const WidgetTester = () => {
  const [locationRadius, setLocationRadius] = useState("0")
  const [scope, setScope] = useState("")
  const [frozenJob, setFrozenJob] = useState("")
  const [widgetParams, setWidgetParams] = useState(null)
  const [shownRomes, setShownRomes] = useState(null)
  const [shownSearchCenter, setShownSearchCenter] = useState(null)
  const [_domainError, setDomainError] = useState(false)

  const jobChanged = async function (val, setLoadingState) {
    const res = await domainChanged(val, setDomainError)
    setLoadingState("done")
    return res
  }

  const addressChanged = async function (val, setLoadingState) {
    const res = await fetchAddresses(val)
    setLoadingState("done")
    return res
  }

  const handleRadiusChange = (radius, setFieldValue) => {
    setLocationRadius(radius)

    setTimeout(() => {
      setFieldValue("radius", radius)
    }, 0)
  }

  const handleScopeChange = (scope, setFieldValue) => {
    setScope(scope)

    setTimeout(() => {
      setFieldValue("scope", scope)
    }, 0)
  }

  const handleFrozenChange = (frozenJob, setFieldValue) => {
    setFrozenJob(frozenJob)

    setTimeout(() => {
      setFieldValue("frozen_job", frozenJob)
    }, 0)
  }

  // Mets à jours les valeurs de champs du formulaire Formik à partir de l'item sélectionné dans l'AutoCompleteField
  const updateValuesFromJobAutoComplete = (item, setFieldValue) => {
    //setTimeout perme d'éviter un conflit de setState
    setTimeout(() => {
      setFieldValue("job", item)
      setShownRomes(item)
    }, 0)
  }

  // Mets à jours les valeurs de champs du formulaire Formik à partir de l'item sélectionné dans l'AutoCompleteField
  const updateValuesFromPlaceAutoComplete = (item, setFieldValue) => {
    //setTimeout perme d'éviter un conflit de setState
    setTimeout(() => {
      setFieldValue("location", item)
      setShownSearchCenter(item)
    }, 0)
  }

  const showSearchCenter = () => {
    return (
      shownSearchCenter &&
      shownSearchCenter.value &&
      shownSearchCenter.value.coordinates && <Box>{`Lat : ${shownSearchCenter.value.coordinates[1]} - Lon : ${shownSearchCenter.value.coordinates[0]}`}</Box>
    )
  }

  const showSelectedRomes = () => {
    return shownRomes && shownRomes.romes && <Box>{`Romes : ${shownRomes.romes.join()}`}</Box>
  }

  const handleSearchSubmit = async (values) => {
    const res = {
      romes: values.job && values.job.romes ? values.job.romes.join() : null,
      location: values.location && values.location.value ? values.location.value.coordinates : null,
      radius: values.radius || null,
      scope: values.scope || null,
      caller: values.caller || null,
      opco: values.opco || null,
      opcoUrl: values.opcoUrl || null,
      jobName: values.jobName || null,
      frozenJob: values.frozen_job || null,
    }

    setWidgetParams(res)
  }

  const getIdeaUrlWithParams = () => {
    let ideaUrl = baseUrl
    ideaUrl = ideaUrl.replace("5", "3")

    let path = "recherche"

    if (widgetParams) {
      if (widgetParams.scope === "job") path = "recherche-emploi"
      else if (widgetParams.scope === "training") path = "recherche-formation"

      ideaUrl = `${ideaUrl}/${path}`

      ideaUrl += "?"
      ideaUrl += widgetParams.caller ? `&caller=${encodeURIComponent(widgetParams.caller)}` : ""
      ideaUrl += widgetParams.romes ? `&romes=${widgetParams.romes}` : ""
      ideaUrl += widgetParams.location ? `&lon=${widgetParams.location[0]}&lat=${widgetParams.location[1]}` : ""
      ideaUrl += widgetParams.radius ? `&radius=${widgetParams.radius}` : ""
      ideaUrl += widgetParams.opco ? `&opco=${encodeURIComponent(widgetParams.opco)}` : ""
      ideaUrl += widgetParams.opcoUrl ? `&opcoUrl=${encodeURIComponent(widgetParams.opcoUrl)}` : ""
      ideaUrl += widgetParams.jobName ? `&job_name=${encodeURIComponent(widgetParams.jobName)}` : ""
      ideaUrl += widgetParams.frozenJob ? "&frozen_job=1" : ""
    } else ideaUrl = `${ideaUrl}/${path}`

    return ideaUrl
  }

  const getWidget = (params) => {
    const ideaUrl = getIdeaUrlWithParams()

    return (
      <iframe
        title={params.title}
        style={{
          marginTop: "30px",
          marginBottom: "30px",
          height: `${params.height}px`,
          width: params.width ? `${params.width}px` : "100%",
        }}
        src={ideaUrl}
      />
    )
  }

  const getForm = () => {
    return (
      <Formik
        initialValues={{
          job: {},
          location: {},
          radius: 0,
          scope: "",
          caller: "adresse_contact@mail.com identifiant_appelant",
          opco: "",
          opcoUrl: "",
        }}
        onSubmit={handleSearchSubmit}
      >
        {({ isSubmitting, setFieldValue }) => (
          <Container variant="responsiveContainer">
            <Form>
              <Grid>
                <GridItem mt={8}>
                  <Box>
                    <Box as="label" htmlFor="jobField">
                      <Text as="strong">Métier (pour renseigner le champ romes)</Text>
                    </Box>
                    <Box>
                      {/* OLD COMPONENT DEPRECATED -> USE ui/app/_components/FormComponents/AutocompleteAsync.tsx */}
                      <AutoCompleteField
                        id="widgetTesterJobField"
                        items={[]}
                        itemToStringFunction={autoCompleteToStringFunction}
                        onSelectedItemChangeFunction={updateValuesFromJobAutoComplete}
                        compareItemFunction={compareAutoCompleteValues}
                        onInputValueChangeFunction={jobChanged}
                        name="jobField"
                        placeholder="Indiquez un métier ou diplôme"
                        inputVariant="homeAutocomplete"
                        searchPlaceholder="Indiquez le métier recherché ci-dessus"
                      />
                    </Box>
                    {showSelectedRomes()}
                    <ErrorMessage name="job" component="Box" />
                  </Box>
                </GridItem>

                <GridItem mt={8}>
                  <Box>
                    <Box as="label" htmlFor="placeField">
                      <Text as="strong">Localité (pour renseigner lat et lon)</Text>
                    </Box>
                    <Box>
                      {/* OLD COMPONENT DEPRECATED -> USE ui/app/_components/FormComponents/AutocompleteAsync.tsx */}
                      <AutoCompleteField
                        id="widgetTesterPlaceField"
                        items={[]}
                        itemToStringFunction={autoCompleteToStringFunction}
                        onSelectedItemChangeFunction={updateValuesFromPlaceAutoComplete}
                        compareItemFunction={compareAutoCompleteValues}
                        onInputValueChangeFunction={addressChanged}
                        scrollParentId="choiceColumn"
                        name="placeField"
                        placeholder="Adresse, ville ou code postal"
                        inputVariant="homeAutocomplete"
                        searchPlaceholder="Indiquez le lieu recherché ci-dessus"
                      />
                    </Box>
                    {showSearchCenter()}
                    <ErrorMessage name="location" component="Box" />
                  </Box>
                </GridItem>

                <GridItem mt={8}>
                  <Box>
                    <Box as="label">
                      <Text as="strong">Rayon de recherche (radius)</Text>
                    </Box>
                    <Field type="hidden" value={locationRadius} name="locationRadius" />
                    <Box>
                      <RadioGroup
                        value={locationRadius}
                        onChange={(value) => {
                          setLocationRadius(value)
                          handleRadiusChange(value, setFieldValue)
                        }}
                      >
                        <Stack direction="row">
                          <Radio value="0">Non défini</Radio>
                          <Radio value="10">10km</Radio>
                          <Radio value="30">30km</Radio>
                          <Radio value="60">60km</Radio>
                          <Radio value="100">100km</Radio>
                        </Stack>
                      </RadioGroup>
                    </Box>
                  </Box>
                </GridItem>

                <GridItem mt={8}>
                  <Box>
                    <Box as="label">
                      <Text as="strong">Périmètre (scope)</Text>
                    </Box>
                    <Field type="hidden" value={scope} name="scope" />
                    <Box>
                      <RadioGroup
                        value={scope}
                        onChange={(value) => {
                          setScope(value)
                          handleScopeChange(value, setFieldValue)
                        }}
                      >
                        <Stack direction="row">
                          <Radio value="">Tout</Radio>
                          <Radio value="training">Formations uniquement</Radio>
                          <Radio value="job">Emplois uniquement</Radio>
                        </Stack>
                      </RadioGroup>
                    </Box>
                  </Box>
                </GridItem>

                <GridItem mt={8}>
                  <Box>
                    <Box as="label">
                      <Text as="strong">Identifiant appelant (caller)</Text>
                    </Box>
                    <Box>
                      <Field as={Input} variant="outline" type="text" name="caller" />
                      <Text variant="defaultAutocomplete">Nous vous contacterons à cette adresse email en cas d'évolution du service</Text>
                    </Box>
                  </Box>
                </GridItem>

                <GridItem mt={8}>
                  <Box>
                    <Box as="label">
                      <Text as="strong">Filtrage des opportunités d&apos;emploi pour un OPCO. Optionnel (opco)</Text>
                    </Box>
                    <Select name="opco" onChange={(evt) => setFieldValue("opco", evt.target.value)}>
                      <option></option>
                      <option>AFDAS</option>
                      <option>AKTO</option>
                      <option>ATLAS</option>
                      <option>CONSTRUCTYS</option>
                      <option>OPCOMMERCE</option>
                      <option>OCAPIAT</option>
                      <option>OPCO2I</option>
                      <option>EP</option>
                      <option>MOBILITE</option>
                      <option>SANTE</option>
                      <option>UNIFORMATION</option>
                    </Select>
                  </Box>
                </GridItem>

                <GridItem mt={8}>
                  <Box>
                    <Box as="label">
                      <Text as="strong">Filtrage des opportunités d&apos;emploi par un site d'OPCO. Optionnel (opcoUrl)</Text>
                    </Box>
                    <Select name="opco" onChange={(evt) => setFieldValue("opcoUrl", evt.target.value)}>
                      <option></option>
                      <option>www.jecompte.fr</option>
                      <option>www.concepteursdavenirs.fr</option>
                      <option>www.jinvestislavenir.fr</option>
                      <option>www.jassuremonfutur.fr</option>
                    </Select>
                  </Box>
                </GridItem>

                <GridItem mt={8}>
                  <Box>
                    <Box as="label">
                      <Text as="strong">Le métier est il figé ? (frozen_job)</Text>
                    </Box>
                    <Field type="hidden" value={scope} name="scope" />
                    <Box>
                      <RadioGroup
                        value={frozenJob}
                        onChange={(value) => {
                          setFrozenJob(value)
                          handleFrozenChange(value, setFieldValue)
                        }}
                      >
                        <Stack direction="row">
                          <Radio value="">Non</Radio>
                          <Radio value="1">Oui</Radio>
                        </Stack>
                      </RadioGroup>
                    </Box>
                    <Text variant="defaultAutocomplete">
                      L&apos;utilisateur ne pourra pas faire une recherche sur d&apos;autres métiers (romes) que ceux que vous avez spécifiés.
                    </Text>
                  </Box>
                </GridItem>

                <GridItem mt={8}>
                  <Box>
                    <Box as="label">
                      <Text as="strong">Nom du métier (job_name)</Text>
                    </Box>
                    <Field as={Input} variant="outline" type="text" name="jobName" />
                    <Text variant="defaultAutocomplete">
                      La phrase suivante apparaîtra sur le formulaire: &quot;Vous souhaitez travailler dans le domaine de [votre saisie]&quot;.
                    </Text>
                  </Box>
                </GridItem>
              </Grid>
              <GridItem mt={8}>
                <Button type="submit" variant="editorialPrimary" disabled={isSubmitting}>
                  Mettre à jour les widgets
                </Button>
              </GridItem>
            </Form>
          </Container>
        )}
      </Formik>
    )
  }

  return (
    <Box>
      <Box>
        <Text as="h1" pl={6}>
          Test du Widget La bonne alternance
        </Text>
        <Text pl={6}>
          La documentation est ici :{" "}
          <Link
            href="https://mission-apprentissage.gitbook.io/la-bonne-alternance/documentation"
            aria-label="Accès à la documentation - nouvelle fenêtre"
            target="docIdea"
            isExternal
            fontSize={14}
            fontWeight={700}
            color="grey.425"
          >
            https://mission-apprentissage.gitbook.io/la-bonne-alternance/documentation <ExternalLinkIcon mx="2px" />
          </Link>
        </Text>
      </Box>
      <Container variant="responsiveContainer">
        <Grid>
          <GridItem>{getForm()}</GridItem>

          <GridItem mt={8}>
            URL associée à l&apos;attribut <Text as="strong">src</Text> de l&apos;iframe : {getIdeaUrlWithParams()}
          </GridItem>
        </Grid>
        <Grid>
          <GridItem>
            <hr />
            <Text as="h3">Largeur 360 px - hauteur 640 px</Text>
            {getWidget({
              title: "mobile",
              height: 640,
              width: 360,
            })}
          </GridItem>
          <GridItem>
            <hr />
            <Text as="h3">Largeur 100% - hauteur 800 px</Text>
            {getWidget({
              title: "desktop",
              height: 800,
            })}
          </GridItem>
        </Grid>
      </Container>
    </Box>
  )
}

export default WidgetTester

import React, { useEffect, useState } from "react"
import { isEqual } from "lodash"
import * as papaparse from "react-papaparse"
import emailValidator from "email-validator"
import { Box, Alert, Text, Button, Link, useToast } from "@chakra-ui/react"
import FileDropzone from "../../../../common/components/FileDropzone"
import { _get, _post } from "../../../../common/httpClient"
/**
 * @description Bulk import CFA.
 * @returns {JSX.Element}
 */
const BulkImport = () => {
  const [fileContent, setFileContent] = useState()
  const [error, setError] = useState()
  const [referrers, setReferrers] = useState()
  const [submitLoading, setSubmitLoading] = useState(false)
  const toast = useToast()
  const csvHeaders = {
    SIRET_FORMATEUR: "Siret formateur",
    EMAIL_CONTACT: "Email contact",
  }

  const csvMapping = {
    [csvHeaders.SIRET_FORMATEUR]: 0,
    [csvHeaders.EMAIL_CONTACT]: 1,
  }

  /**
   * @description Returns all referrers.
   * @returns {Promise<{code: {number}, name: {string}, full_name: {string}, url: {string}[]}>}
   */
  const getReferrers = async () => {
    const { referrers } = await _get(`/api/constants`)

    return referrers
  }

  /**
   * @description Get all referrers.
   */
  useEffect(() => {
    async function fetchData() {
      try {
        const referrersResponse = await getReferrers()

        setReferrers(referrersResponse)
      } catch (error) {
        toast({
          title: "Une erreur est survenue durant la récupération des informations.",
          status: "error",
          isClosable: true,
          position: "bottom-right",
        })
      }
    }

    fetchData()
  }, [toast])

  /**
   * @description Checks if the file is properly structured
   * @param {string[]<string[]>} data
   * @returns {{error: {header: string, content: string}}|null}
   */
  const validFile = (data) => {
    const [headers, ...rows] = data
    const headerColumns = Object.values(csvHeaders)

    if (!isEqual(headerColumns, headers)) {
      return {
        error: {
          header: "Fichier invalide",
          content: `Les colonne du fichier doivent suivren le format: "${Object.values(csvHeaders)}".`,
        },
      }
    }

    if (!rows.length) {
      return { error: { header: "Fichier vide", content: "Aucun élément trouvé." } }
    }

    let rowCounter = 1

    for (const row of rows) {
      if (row.length !== headerColumns.length) {
        return {
          error: {
            header: "Structure du fichier non valide",
            content: `La ligne "${rowCounter}" doit suivre la structure suivante: "${headerColumns}".`,
          },
        }
      }

      if (!row[csvMapping[csvHeaders.SIRET_FORMATEUR]]) {
        return {
          error: {
            header: "Siret formateur obligatoire",
            content: `La ligne "${rowCounter}" doit contenir un "${csvHeaders.SIRET_FORMATEUR}".`,
          },
        }
      }

      if (row[csvMapping[csvHeaders.SIRET_FORMATEUR]].length !== 14) {
        return {
          error: {
            header: "Siret formateur invalide",
            content: `La ligne "${rowCounter}" doit contenir un "${csvHeaders.SIRET_FORMATEUR}" valide avec 14 numéros.`,
          },
        }
      }

      if (!row[csvMapping[csvHeaders.EMAIL_CONTACT]]) {
        return {
          error: {
            header: "Email de contact obligatoire",
            content: `La ligne "${rowCounter}" doit contenir un "${csvHeaders.EMAIL_CONTACT}".`,
          },
        }
      }

      if (!emailValidator.validate(row[csvMapping[csvHeaders.EMAIL_CONTACT]])) {
        return {
          error: {
            header: "Email de contact invalide",
            content: `La ligne "${rowCounter}" doit contenir un "${csvHeaders.EMAIL_CONTACT}" valide.`,
          },
        }
      }

      rowCounter++
    }

    return null
  }

  /**
   * @description Handle onDrop.
   * @param {Object[]} file
   * @returns {void}
   */
  const onDrop = ([file]) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const { data } = papaparse.readString(e.target.result, { skipEmptyLines: true })

      const validationError = validFile(data)?.error

      if (validationError) {
        setError(validationError)
      } else {
        // False to say "not imported yet"
        setFileContent(data.slice(1).map((item) => [...item, null]))
        setError(null)
      }
    }
    reader.readAsText(file)
  }

  /**
   * @description Cancels importation.
   * @returns {void}
   */
  const cancel = () => setFileContent(null)

  /**
   * @description Submits importation.
   * @returns {Promise<void>}
   */
  const submit = async () => {
    try {
      setSubmitLoading(true)

      const { result } = await _post("/api/widget-parameters/import", {
        parameters: fileContent.map((row) => ({
          siret_formateur: row[csvMapping[csvHeaders.SIRET_FORMATEUR]],
          email: row[csvMapping[csvHeaders.EMAIL_CONTACT]],
          referrers: referrers.map((referrer) => referrer.code),
        })),
      })

      const fileContentUpdated = fileContent.map((row) => {
        const relatedSiret = result.find((item) => item.siret_formateur === row[csvMapping[csvHeaders.SIRET_FORMATEUR]])

        let status = ""
        if (relatedSiret.error) {
          status = relatedSiret.error
        }

        if (!relatedSiret.error && !relatedSiret.formations.length) {
          status = "Aucunes formation affectés"
        }

        if (!relatedSiret.error && relatedSiret.formations.length) {
          const countFormation = relatedSiret.formations.length
          if (countFormation === 1) {
            status = `${countFormation} formation a été activé.`
          } else {
            status = `${countFormation} formations ont été activés.`
          }
        }

        return [...row.slice(0, -1), status]
      })

      setFileContent(fileContentUpdated)
      toast({
        title: "Import effectué avec succès.",
        status: "success",
        isClosable: true,
        position: "bottom-right",
      })
    } catch (error) {
      toast({
        title: "Une erreur est survenue.",
        status: "error",
        isClosable: true,
        position: "bottom-right",
      })
    } finally {
      setSubmitLoading(false)
    }
  }

  return (
    <Box>
      <Box bg="white" mx={[2, 2, 40, 40]} boxShadow="0 1px 2px 0 rgb(0 0 0 / 5%)" border="1px solid rgba(0,40,100,.12)" border-radius="3px" mt={10}>
        <Text p={5} borderBottom="1px solid rgba(0,40,100,.12)" border-radius="3px">
          Activation massive de formations via fichier .csv
        </Text>
        {error && (
          <Box>
            <Alert type="warning" icon="alert-triangle">
              <b>{error.header}</b>
              <br />
              {error.content}
            </Alert>
          </Box>
        )}
        {!fileContent && (
          <FileDropzone onDrop={onDrop} accept=".csv" maxFiles={1}>
            <Text align="center" p={2} mb={5}>
              Veuillez importer votre fichier .csv pour activer plusieurs CFA <br />(
              <Link href="/docs/exemple-import-cfa.csv" color="info">
                fichier d'exemple
              </Link>
              ).
            </Text>
          </FileDropzone>
        )}
      </Box>
      {fileContent && (
        <>
          <Box width={12}>
            <p align="center" className="my-6">
              Ci-dessous le récapitulatif des etablissements qui seront activés sur tous les plateformes de diffusion.
            </p>
            <Box responsive className="card-table">
              <Box>
                <Text>Siret formateur</Text>
                <Text>Email</Text>
                <Text>Importé</Text>
              </Box>
              <Box>
                {fileContent.map((row) => (
                  <Box>
                    <Text>{row[csvMapping[csvHeaders.SIRET_FORMATEUR]]}</Text>
                    <Text>{row[csvMapping[csvHeaders.EMAIL_CONTACT]]}</Text>
                    <Text>
                      {row[Object.keys(csvMapping).length] === null && "En attente d'enregistrement"}
                      {row[Object.keys(csvMapping).length] !== null && row[Object.keys(csvMapping).length]}
                    </Text>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
          <div className="mb-7" />
          <Box>
            <Button color="primary float-right" onClick={submit} loading={submitLoading} disabled={submitLoading}>
              Enregistrer
            </Button>
            <Button color="second float-right" onClick={cancel} disabled={submitLoading}>
              Annuler
            </Button>
          </Box>
        </>
      )}
    </Box>
  )
}

export { BulkImport }

import { Box, Button, Flex, FormControl, FormErrorMessage, Image, Input, Spinner, Text } from "@chakra-ui/react"
import * as Sentry from "@sentry/nextjs"
import React, { useState } from "react"
import { useDropzone } from "react-dropzone"

const CandidatureLbaFileDropzone = ({ setFileValue, formik }) => {
  const [fileData, setFileData] = useState(formik.values.fileName ? { fileName: formik.values.fileName, fileContent: formik.values.fileContent } : null)
  const [fileLoading, setFileLoading] = useState(false)
  const [showUnacceptedFileMessages, setShowUnacceptedFileMessages] = useState(false)

  const onRemoveFile = () => {
    setFileValue(null)
    setFileData(null)
  }

  const hasSelectedFile = () => {
    return fileData?.fileName
  }

  const onDrop = (files) => {
    const reader = new FileReader()
    let fileName = null

    reader.onload = (e) => {
      const readFileData = { fileName, fileContent: e.target.result }
      setFileData(readFileData)
      setFileValue(readFileData)
    }

    reader.onloadstart = () => {
      setFileLoading(true)
      setShowUnacceptedFileMessages(false)
    }

    reader.onloadend = () => {
      setTimeout(() => {
        setFileLoading(false)
      }, 300)
    }

    if (files.length) {
      fileName = files[0].name
      reader.readAsDataURL(files[0])
    } else {
      setShowUnacceptedFileMessages(true)
      setFileData(null)
    }
  }

  const getSpinner = () => {
    return (
      <Flex ml={6} alignItems="center" direction="row">
        <Spinner mr={4} />
        <Text>Chargement du fichier en cours</Text>
      </Flex>
    )
  }

  const getFileDropzone = () => {
    return (
      <FormControl cursor={hasSelectedFile() ? "auto" : "pointer"} data-testid="fileDropzone" isInvalid={showUnacceptedFileMessages}>
        {/* @ts-expect-error: TODO */}
        <Input {...getInputProps()} />
        {isDragActive ? (
          <Text ml={6}>Déposez le fichier ici</Text>
        ) : (
          <Flex ml={6} direction="row" alignItems="center">
            <Image mr={2} alt="" src="/images/icons/candidature_file_upload.svg" />{" "}
            <Box>
              <Text fontSize="14px" fontWeight={700} color="grey.700">
                Chargez votre CV ou déposez le ici
              </Text>
              <Text fontSize="12px" color="grey.700">
                Le CV doit être au format PDF ou DOCX et ne doit pas dépasser 3 Mo
              </Text>
            </Box>
          </Flex>
        )}
        {showUnacceptedFileMessages && <FormErrorMessage ml={6}>⚠ Le fichier n&apos;est pas au bon format (autorisé : .docx ou .pdf, &lt;3mo, max 1 fichier)</FormErrorMessage>}
        <FormErrorMessage ml={6}>{formik.errors.fileName}</FormErrorMessage>
      </FormControl>
    )
  }

  const getSelectedFile = () => {
    return (
      <Box ml={6} fontSize="14px" fontWeight={700} color="grey.700" data-testid="selectedFile">
        Pièce jointe : {fileData.fileName}
        {
          <Button
            onClick={onRemoveFile}
            background="none"
            padding="0 0 4px"
            fontSize="14px"
            fontWeight={400}
            ml={4}
            height="fit-content"
            borderRadius="0"
            borderColor="grey.700"
            sx={{
              borderBottom: "1px solid",
            }}
            _hover={{
              background: "none",
            }}
            color="grey.700"
          >
            supprimer
          </Button>
        }
      </Box>
    )
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ".docx,.pdf",
    maxSize: 3145728,
    maxFiles: 1,
    onDropRejected(fileRejections) {
      const [fileRejection] = fileRejections
      setShowUnacceptedFileMessages(true)
      const { errors } = fileRejection ?? {}
      const [error] = errors
      const { message } = error ?? {}
      Sentry.setTag("errorType", "envoi_PJ_candidature")
      Sentry.captureException(new Error(message))
      Sentry.setTag("errorType", "")
    },
  })

  return (
    <Box p="20px" width="97%" border="1px dashed" borderColor={showUnacceptedFileMessages ? "red.500" : "grey.600"} {...getRootProps()}>
      {fileLoading ? getSpinner() : hasSelectedFile() ? getSelectedFile() : getFileDropzone()}
    </Box>
  )
}

export default CandidatureLbaFileDropzone

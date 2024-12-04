import { Box, Button, Flex, FormControl, FormErrorMessage, Image, Input, Spinner, Text } from "@chakra-ui/react"
import * as Sentry from "@sentry/nextjs"
import { useState } from "react"
import { useDropzone } from "react-dropzone"

const CandidatureLbaFileDropzone = ({ setFileValue, formik }) => {
  const [fileData, setFileData] = useState<{ applicant_attachment_name: string; applicant_attachment_content: string | ArrayBuffer } | null>(
    formik.values.applicant_attachment_name
      ? { applicant_attachment_name: formik.values.applicant_attachment_name, applicant_attachment_content: formik.values.applicant_attachment_content }
      : null
  )
  const [fileLoading, setFileLoading] = useState(false)
  const [showUnacceptedFileMessages, setShowUnacceptedFileMessages] = useState(false)

  const onRemoveFile = () => {
    setFileValue(null)
    setFileData(null)
  }

  const hasSelectedFile = () => {
    return fileData?.applicant_attachment_name
  }

  const onDrop = (files) => {
    const reader = new FileReader()
    let applicant_attachment_name = null

    reader.onload = (e) => {
      const readFileData = { applicant_attachment_name, applicant_attachment_content: e.target.result }
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
      applicant_attachment_name = files[0].name
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
        <FormErrorMessage ml={6}>{formik.errors.applicant_attachment_name}</FormErrorMessage>
      </FormControl>
    )
  }

  const getSelectedFile = () => {
    return (
      <Box ml={6} fontSize="14px" fontWeight={700} color="grey.700" data-testid="selectedFile">
        Pièce jointe : {fileData.applicant_attachment_name}
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
      const { errors, file } = fileRejection ?? {}
      const [error] = errors
      const { message } = error ?? {}
      Sentry.setTag("errorType", "envoi_PJ_candidature")
      if (errors.some((error) => error.code === "file-invalid-type")) {
        const fileExtension = getFileExtension(file.name)
        Sentry.setTag("file-extension", fileExtension)
      }
      if (errors.some((error) => error.code === "file-too-large")) {
        const sizeInMo = Math.round(file.size / 1024 / 1024)
        Sentry.setTag("file-size-in-mo", sizeInMo)
      }
      if (fileRejections.length > 1) {
        Sentry.setTag("multiple-files", "true")
      }
      Sentry.captureException(new Error(message))
      Sentry.setTag("errorType", undefined)
      Sentry.setTag("file-extension", undefined)
      Sentry.setTag("file-size-in-mo", undefined)
      Sentry.setTag("multiple-files", undefined)
    },
  })

  return (
    <Box p="20px" width="97%" border="1px dashed" borderColor={showUnacceptedFileMessages ? "red.500" : "grey.600"} {...getRootProps()}>
      {fileLoading ? getSpinner() : hasSelectedFile() ? getSelectedFile() : getFileDropzone()}
    </Box>
  )
}

const getFileExtension = (filename: string): string => {
  const pointIndex = filename.lastIndexOf(".")
  if (pointIndex === -1) return null
  return filename.substring(pointIndex)
}

export default CandidatureLbaFileDropzone

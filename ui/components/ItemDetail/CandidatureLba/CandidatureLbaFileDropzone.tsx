import { Box, Button, Typography, CircularProgress } from "@mui/material"
import * as Sentry from "@sentry/nextjs"
import Image from "next/image"
import { useState } from "react"
import type { DropzoneOptions } from "react-dropzone"
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

  const onDrop: DropzoneOptions["onDrop"] = (files) => {
    const reader = new FileReader()
    let applicant_attachment_name: string | null = null

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

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/msword": [".doc"],
    },
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

  const mandatoryFileError = formik.touched.applicant_attachment_name && formik.errors?.applicant_attachment_name

  return (
    <Box sx={{ p: "20px", border: "1px dashed", borderColor: mandatoryFileError || showUnacceptedFileMessages ? "error.main" : "grey.600" }} {...getRootProps()}>
      {fileLoading ? (
        <Box sx={{ display: "flex", ml: 6, alignItems: "center", flexDirection: "row" }}>
          <CircularProgress sx={{ mr: 4 }} />
          <Typography>Chargement du fichier en cours</Typography>
        </Box>
      ) : hasSelectedFile() ? (
        <Box sx={{ ml: 6, fontSize: "14px", fontWeight: 700, color: "grey.700" }} data-testid="selectedFile">
          Pièce jointe : {fileData.applicant_attachment_name}
          {
            <Button
              onClick={onRemoveFile}
              variant="text"
              sx={{
                background: "none",
                padding: "0 0 4px",
                fontSize: "14px",
                fontWeight: 400,
                ml: 4,
                height: "fit-content",
                borderRadius: 0,
                borderBottom: "1px solid",
                borderColor: "grey.700",
                color: "grey.700",
                "&:hover": {
                  background: "none",
                },
              }}
            >
              supprimer
            </Button>
          }
        </Box>
      ) : (
        <Box sx={{ cursor: hasSelectedFile() ? "auto" : "pointer" }} data-testid="fileDropzone">
          <input {...getInputProps()} />
          {isDragActive ? (
            <Typography sx={{ ml: 6 }}>Déposez le fichier ici</Typography>
          ) : (
            <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, alignItems: "center", gap: 4 }}>
              <Image width={24} height={24} style={{ marginRight: "8px" }} alt="" src="/images/icons/candidature_file_upload.svg" />{" "}
              <Box>
                <Typography sx={{ fontSize: "14px", fontWeight: 700, color: "grey.700", mb: 0 }}>Chargez votre CV ou déposez le ici</Typography>
                <Typography sx={{ fontSize: "12px", color: "grey.700", mb: 0 }}>Le CV doit être au format PDF ou DOCX et ne doit pas dépasser 3 Mo</Typography>
              </Box>
            </Box>
          )}
          {showUnacceptedFileMessages && (
            <Typography sx={{ ml: 6, color: "error.main", fontSize: "14px" }}>
              ⚠ Le fichier n&apos;est pas au bon format (autorisé : .docx ou .pdf, &lt;3mo, max 1 fichier)
            </Typography>
          )}
          {mandatoryFileError && <Typography sx={{ ml: 6, color: "error.main", fontSize: "14px" }}>⚠ La pièce jointe est obligatoire</Typography>}
        </Box>
      )}
    </Box>
  )
}

const getFileExtension = (filename: string): string => {
  const pointIndex = filename.lastIndexOf(".")
  if (pointIndex === -1) return null
  return filename.substring(pointIndex)
}

export default CandidatureLbaFileDropzone

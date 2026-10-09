import { fr } from "@codegouvfr/react-dsfr"
import { Box, Button, CircularProgress, Typography } from "@mui/material"
import { captureMessage, setTag } from "@sentry/nextjs"
import { useEffect, useRef, useState } from "react"
import type { DropzoneOptions } from "react-dropzone"
import { useDropzone } from "react-dropzone"
import { LiveStatus } from "@/app/_components/LiveStatus"

export const CandidatureLbaFileDropzone = ({ setFileValue, formik }) => {
  const [fileData, setFileData] = useState<{ applicant_attachment_name: string; applicant_attachment_content: string | ArrayBuffer } | null>(
    formik.values.applicant_attachment_name
      ? { applicant_attachment_name: formik.values.applicant_attachment_name, applicant_attachment_content: formik.values.applicant_attachment_content }
      : null
  )
  const [fileLoading, setFileLoading] = useState(false)
  const [showUnacceptedFileMessages, setShowUnacceptedFileMessages] = useState(false)
  const removeButtonRef = useRef<HTMLButtonElement>(null)
  // Le champ et le bouton « supprimer » se remplacent l'un l'autre : sans report du focus, la modale
  // le renvoie sur « Fermer » (RGAA 12.8).
  const pendingFocusRef = useRef<"remove" | "input" | null>(null)
  const [confirmedFileName, setConfirmedFileName] = useState<string | null>(null)

  const onRemoveFile = () => {
    pendingFocusRef.current = "input"
    setConfirmedFileName(null)
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
      pendingFocusRef.current = "remove"
      applicant_attachment_name = files[0].name
      reader.readAsDataURL(files[0])
    } else {
      setShowUnacceptedFileMessages(true)
      setFileData(null)
    }
  }

  // noKeyboard : c'est l'input natif, étiqueté, qui reçoit le focus, et non la racine du dropzone (role="presentation")
  const { getRootProps, getInputProps, isDragActive, inputRef } = useDropzone({
    noKeyboard: true,
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
      setTag("errorType", "envoi_PJ_candidature")
      if (errors.some((error) => error.code === "file-invalid-type")) {
        const fileExtension = getFileExtension(file.name)
        setTag("file-extension", fileExtension)
      }
      if (errors.some((error) => error.code === "file-too-large")) {
        const sizeInMo = Math.round(file.size / 1024 / 1024)
        setTag("file-size-in-mo", sizeInMo)
      }
      if (fileRejections.length > 1) {
        setTag("multiple-files", "true")
      }
      // Rejet de fichier (taille, type, nombre) : validation attendue du dropzone déclenchée par
      // le choix de l'utilisateur, pas un défaut applicatif — captureMessage/info conserve la
      // télémétrie (tags ci-dessus) sans polluer le triage des erreurs.
      captureMessage(message, "info")
      setTag("errorType", undefined)
      setTag("file-extension", undefined)
      setTag("file-size-in-mo", undefined)
      setTag("multiple-files", undefined)
    },
  })

  const shownFileName = fileLoading ? null : (fileData?.applicant_attachment_name ?? null)
  const isFileShown = Boolean(shownFileName)

  useEffect(() => {
    if (pendingFocusRef.current === "remove" && shownFileName) {
      pendingFocusRef.current = null
      removeButtonRef.current?.focus()
      // Le passage du focus interrompt la lecture en cours : la confirmation est émise après l'annonce du bouton.
      const timer = setTimeout(() => setConfirmedFileName(shownFileName), 500)
      return () => clearTimeout(timer)
    }
    if (pendingFocusRef.current === "input" && !shownFileName) {
      pendingFocusRef.current = null
      inputRef.current?.focus()
    }
  }, [shownFileName, inputRef])

  const mandatoryFileError = formik.touched.applicant_attachment_name && formik.errors?.applicant_attachment_name
  const hasError = Boolean(mandatoryFileError || showUnacceptedFileMessages)
  const inputId = "applicant_attachment_name"
  const hintId = `${inputId}-hint`
  const formatErrorId = `${inputId}-format-error`
  const errorId = `${inputId}-error`
  const describedBy = [hintId, showUnacceptedFileMessages && formatErrorId, mandatoryFileError && errorId].filter(Boolean).join(" ")

  const fileStatus = fileLoading ? "Chargement du fichier en cours" : confirmedFileName ? `Pièce jointe ${confirmedFileName} ajoutée` : ""

  return (
    <>
      <Box
        sx={{
          border: isDragActive ? "1px dashed" : "1px solid",
          borderColor: isDragActive ? "grey.600" : "transparent",
          padding: fr.spacing("4v"),
          mx: "-" + fr.spacing("4v"),
        }}
        {...getRootProps()}
      >
        {isFileShown ? (
          <Box sx={{ fontSize: "14px", fontWeight: 700, color: "grey.700" }} data-testid="selectedFile">
            Pièce jointe : {fileData.applicant_attachment_name}
            {
              <Button
                ref={removeButtonRef}
                onClick={onRemoveFile}
                variant="text"
                sx={{
                  background: "none",
                  padding: "0 0 4px",
                  fontSize: "14px",
                  fontWeight: 400,
                  ml: fr.spacing("8v"),
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
                supprimer<span className={fr.cx("fr-sr-only")}> la pièce jointe {fileData.applicant_attachment_name}</span>
              </Button>
            }
          </Box>
        ) : (
          <Box sx={{ cursor: hasSelectedFile() ? "auto" : "pointer" }} data-testid="fileDropzone">
            <Typography
              component="label"
              htmlFor={inputId}
              // le label active déjà l'input : sans stopPropagation, la racine ouvrirait une seconde fois le sélecteur
              onClick={(e) => e.stopPropagation()}
              sx={{ display: "block", cursor: "pointer", fontSize: "16px", lineHeight: "24px", fontWeight: 700, color: hasError ? "error.main" : "grey.700", mb: fr.spacing("3v") }}
            >
              Chargez votre CV ou déposez-le ici <span style={{ color: "#ce0500" }}>*</span>
            </Typography>
            <Typography id={hintId} sx={{ fontSize: "12px", lineHeight: "20px", color: "grey.700", mb: fr.spacing("4v") }}>
              Le CV doit être au format PDF ou Docx et ne doit pas dépasser 3 Mo
            </Typography>
            <input {...getInputProps({ id: inputId, tabIndex: 0, "aria-describedby": describedBy, "aria-invalid": hasError })} style={{ display: "block" }} />
            {fileLoading && (
              <Box sx={{ display: "flex", alignItems: "center", flexDirection: "row", mt: fr.spacing("2v") }}>
                <CircularProgress size={14} />
                <Typography sx={{ ml: fr.spacing("2v"), fontSize: "14px", color: "grey.700" }}>Chargement du fichier en cours</Typography>
              </Box>
            )}
            {showUnacceptedFileMessages && (
              <Typography id={formatErrorId} sx={{ color: "error.main", fontSize: "14px" }}>
                <span aria-hidden="true">⚠</span> Le fichier n&apos;est pas au bon format (autorisé : .docx ou .pdf, &lt;3mo, max 1 fichier)
              </Typography>
            )}
            {mandatoryFileError && (
              <Typography id={errorId} sx={{ color: "error.main", fontSize: "14px" }}>
                <span aria-hidden="true">⚠</span> La pièce jointe est obligatoire
              </Typography>
            )}
          </Box>
        )}
      </Box>
      <LiveStatus message={fileStatus} />
      <LiveStatus role="alert" message={showUnacceptedFileMessages ? "Le fichier n'est pas au bon format (autorisé : .docx ou .pdf, moins de 3 Mo, 1 fichier maximum)" : ""} />
    </>
  )
}

const getFileExtension = (filename: string): string => {
  const pointIndex = filename.lastIndexOf(".")
  if (pointIndex === -1) return ""
  return filename.substring(pointIndex)
}

import React, { useState } from "react"
import { Spinner } from "reactstrap"
import { useDropzone } from "react-dropzone"
import dropzoneIco from "../../../public/images/icons/candidature_file_upload.svg"

const CandidatureSpontaneeFileDropzone = ({ setFileValue, formik }) => {
  const [fileData, setFileData] = useState(formik.values.fileName ? { fileName: formik.values.fileName, fileContent: formik.values.fileContent } : null)
  const [fileLoading, setFileLoading] = useState(false)
  const [showUnacceptedFileMessage, setShowUnacceptedFileMessages] = useState(false)

  const onRemoveFile = () => {
    setFileValue(null)
    setFileData(null)
  }

  const onDrop = (files) => {
    const reader = new FileReader()
    let fileName = null

    reader.onload = (e) => {
      let readFileData = { fileName, fileContent: e.target.result }
      setFileData(readFileData)
      setFileValue(readFileData)
    }

    reader.onloadstart = (e) => {
      setFileLoading(true)
      setShowUnacceptedFileMessages(false)
    }

    reader.onloadend = (e) => {
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
      <div className="c-candidature-filedropzone_loading">
        <Spinner /> Chargement du fichier en cours
      </div>
    )
  }

  const getFileDropzone = () => {
    return (
      <>
        <input {...getInputProps()} data-testid="fileDropzone" />
        {isDragActive ? (
          <p>Déposez le fichier ici</p>
        ) : (
          <div className="c-candidature-filedropzone-instruction">
            <div className="float-left mt-2 mr-2">
              <img alt="" src={dropzoneIco} />{" "}
            </div>
            <div className="c-candidature-filedropzone-instruction_title">Chargez votre CV ou déposez le ici</div>
            <div className="c-candidature-filedropzone-instruction_sub">Le CV doit être au format PDF ou DOCX et ne doit pas dépasser 3 Mo</div>
          </div>
        )}
        {showUnacceptedFileMessage ? (
          <div className="c-candidature-erreur visible">⚠ Le fichier n&apos;est pas au bon format (autorisé : .docx ou .pdf, &lt;3mo, max 1 fichier)</div>
        ) : (
          ""
        )}
        {formik.touched && formik.errors.fileName ? <div className="c-candidature-erreur visible">{formik.errors.fileName}</div> : ""}
      </>
    )
  }

  const getSelectedFile = () => {
    return (
      <div className="c-candidature-filedropzone-filename" data-testid="selectedFile">
        Pièce jointe : {fileData.fileName}
        {
          <button className="c-candidature-filedropzone-removefile" onClick={onRemoveFile}>
            supprimer
          </button>
        }
      </div>
    )
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ".docx,.pdf",
    maxSize: 3145728,
    maxFiles: 1,
  })

  return (
    <div className={`c-candidature-filedropzone ${fileData?.fileName ? "c-candidature-filedropzone_selectedfile" : ""}`} {...getRootProps()}>
      {fileLoading ? getSpinner() : fileData?.fileName ? getSelectedFile() : getFileDropzone()}
    </div>
  )
}

export default CandidatureSpontaneeFileDropzone

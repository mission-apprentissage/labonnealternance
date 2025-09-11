import MuiAlert, { AlertColor } from "@mui/material/Alert"
import Snackbar from "@mui/material/Snackbar"
import { useState, useCallback } from "react"

type ToastOptions = {
  title?: string
  description?: string
  status?: AlertColor
  duration?: number
}

export function useToast() {
  const [open, setOpen] = useState(false)
  const [options, setOptions] = useState<ToastOptions>({
    status: "info",
    duration: 3000,
  })

  const toast = useCallback((opts: ToastOptions) => {
    console.log("Toast", opts)
    setOptions({
      status: opts.status || "info",
      title: opts.title,
      description: opts.description,
      duration: opts.duration || 3000,
    })
    setOpen(true)
  }, [])

  const ToastComponent = (
    <Snackbar open={open} autoHideDuration={options.duration} onClose={() => setOpen(false)} anchorOrigin={{ vertical: "top", horizontal: "right" }}>
      <MuiAlert elevation={6} variant="filled" severity={options.status} onClose={() => setOpen(false)}>
        <strong>{options.title}</strong>
        {options.description ? <> — {options.description}</> : null}
      </MuiAlert>
    </Snackbar>
  )

  return { toast, ToastComponent }
}

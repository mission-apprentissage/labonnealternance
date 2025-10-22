import { enqueueSnackbar, SharedProps } from "notistack"
import { useCallback } from "react"

interface ToastOptions extends Pick<SharedProps, "variant" | "autoHideDuration"> {
  title?: string
  description?: string
}

export function useToast() {
  return useCallback((opts: ToastOptions) => {
    const message = (
      <div>
        {opts.title && <strong>{opts.title}</strong>}
        {opts.description && <div>{opts.description}</div>}
      </div>
    )

    enqueueSnackbar(message, {
      variant: opts.variant ?? "success",
      autoHideDuration: opts.autoHideDuration ?? 3000,
      anchorOrigin: { horizontal: "right", vertical: "top" },
    })
  }, [])
}

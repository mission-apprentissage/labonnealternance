import { Box } from "@mui/material"
import type { SharedProps } from "notistack"
import { enqueueSnackbar } from "notistack"
import { useCallback } from "react"

interface ToastOptions extends Pick<SharedProps, "variant" | "autoHideDuration"> {
  title?: string
  description?: string
}

export function useToast() {
  return useCallback((opts: ToastOptions) => {
    const message = (
      <div>
        {opts.title && (
          <Box component="span" sx={{ fontWeight: 700 }}>
            {opts.title}
          </Box>
        )}
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

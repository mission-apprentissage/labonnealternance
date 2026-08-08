import { generateLlmsTxt } from "@/services/generate-llms-txt"

export async function GET(request: Request) {
  const llmsTxt = generateLlmsTxt(request)
  return new Response(llmsTxt, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  })
}


import fastifySentryPlugin from "@immobiliarelabs/fastify-sentry";
import { CaptureConsole, ExtraErrorData } from "@sentry/integrations"
import * as Sentry from "@sentry/node";
import { FastifyRequest } from "fastify";

import config from "@/config";

import { Server } from "./server";

function getOptions() {
  return {
    dsn: config.serverSentryDsn,
    tracesSampleRate: config.env === "production" ? 0.1 : 1.0,
    tracePropagationTargets: [/\.apprentissage\.beta\.gouv\.fr$/],
    environment: config.env,
    enabled: config.env !== "local",
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Mongo({ useMongoose: true }),
      new CaptureConsole({ levels: ["error"] }),
      new ExtraErrorData({ depth: 8 }),
    ],
  };
}

export function initSentryProcessor(): void {
  Sentry.init(getOptions() as any);
}

export async function closeSentry(): Promise<void> {
  await Sentry.close(2_000);
}

export function initSentryFastify(app: Server) {
  const options: any = {
    setErrorHandler: false,
    extractRequestData: (request: FastifyRequest) => {
      return {
        headers: request.headers,
        method: request.method,
        protocol: request.protocol,
        query_string: request.query,
      };
    },
    ...getOptions(),
  };

  app.register(fastifySentryPlugin, options);
}

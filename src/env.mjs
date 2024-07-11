/* eslint-disable @typescript-eslint/naming-convention */
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {},
  client: {
    NEXT_PUBLIC_PROJECT_NAME: z.string(),
  },
  runtimeEnv: {
    NEXT_PUBLIC_PROJECT_NAME: process.env["NEXT_PUBLIC_PROJECT_NAME"],
  },
  /*
   * For Next.js >= 13.4.4, you only need to destructure client variables:
   * Doing so throw typescript errors at the moment
   */
  emptyStringAsUndefined: false,
});

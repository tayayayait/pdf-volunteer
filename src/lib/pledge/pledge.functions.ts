import { createServerFn } from "@tanstack/react-start";

import { createPledgeInputSchema } from "./pledge-create-schema";

export const createPledge = createServerFn({ method: "POST" })
  .validator((input: unknown) => createPledgeInputSchema.parse(input))
  .handler(async ({ data }) => {
    const { createPledgeRecord } = await import("./pledge-service");
    return createPledgeRecord(data);
  });

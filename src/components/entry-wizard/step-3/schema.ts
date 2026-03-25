import { z } from "zod";

const schema = z.object({
	locales: z.array(z.string().regex(/^[a-z]{2}_[A-Z]{2}$/, "invalidFormat")),
});

type Inputs = z.infer<typeof schema>;

export { schema, type Inputs };

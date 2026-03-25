import { z } from "zod";

const schema = z.object({
	databaseSchemas: z.array(
		z.object({
			name: z.string(),
			entityTypeNames: z.array(z.string()),
		}),
	),
});

type Inputs = z.infer<typeof schema>;

export { schema, type Inputs };

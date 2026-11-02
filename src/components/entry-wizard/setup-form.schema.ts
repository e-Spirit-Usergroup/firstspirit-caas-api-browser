import { z } from "zod";
import type { ProjectSetupData } from "@/types/configuration";
import { stageTypes } from "@/types/stage";

/** At least one of the preview and release keys is required. */
const caasApiKeysSchema = z
	.object({
		preview: z.string().trim(),
		release: z.string().trim(),
	})
	.refine((keys) => keys.preview || keys.release, {
		message: "atLeastOne",
		path: ["preview"],
	});

const schema = z.object({
	customerName: z.string().trim().min(1, "required"),
	stage: z.enum(stageTypes),
	projectName: z.string().min(1, "required"),
	caasApiKeys: caasApiKeysSchema,
	caasUrl: z.url("required"),
}) satisfies z.ZodSchema<ProjectSetupData>;

type Inputs = z.infer<typeof schema>;

export { caasApiKeysSchema, type Inputs, schema };

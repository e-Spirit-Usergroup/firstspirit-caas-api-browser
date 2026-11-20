import { z } from "zod";
import { getStageFromCaasUrl } from "@/lib/caas-url";
import type { ProjectSetupData } from "@/types/configuration";

// The URL must end with the project segment `<projectId>.<preview|release>.content`.
const caasProjectUrlPattern = /\/[^/.]+\.(preview|release)\.content\/?$/;

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
	projectName: z.string().min(1, "required"),
	caasApiKeys: caasApiKeysSchema,
	caasUrl: z
		.url("required")
		.refine((url) => getStageFromCaasUrl(url) !== null, "stageNotDetected")
		.refine((url) => caasProjectUrlPattern.test(url), "projectNotDetected"),
	/** Optional; when empty, it is derived from the CaaS URL. */
	navigationServiceUrl: z
		.string()
		.trim()
		.refine((url) => !url || z.url().safeParse(url).success, "invalidUrl"),
}) satisfies z.ZodSchema<Omit<ProjectSetupData, "stage">>;

type Inputs = z.infer<typeof schema>;

export { caasApiKeysSchema, type Inputs, schema };

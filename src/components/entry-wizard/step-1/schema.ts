import { z } from "zod";
import type { ProjectSetupData } from "@/types/configuration";

const schema = z.object({
	customerName: z.string().min(1, "required"),
	stage: z.enum(["dev", "qa", "prod"]),
	projectName: z.string().min(1, "required"),
	caasApiKey: z.string().min(1, "required"),
	caasUrl: z.url("required"),
}) satisfies z.ZodSchema<ProjectSetupData>;

type Inputs = z.infer<typeof schema>;

export { schema, type Inputs };

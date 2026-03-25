import Step1 from "@components/entry-wizard/step-1/step-1";
import Step2 from "@components/entry-wizard/step-2/step-2";
import Step3 from "@components/entry-wizard/step-3/step-3";
import { createFileRoute } from "@tanstack/react-router";
import * as z from "zod";

export const Route = createFileRoute("/setup/_setup/wizard")({
	component: RouteComponent,
	validateSearch: z.object({
		step: z.number().int().positive().optional().default(1),
	}),
});

function RouteComponent() {
	return (
		<>
			{Route.useSearch().step === 1 && <Step1 />}
			{Route.useSearch().step === 2 && <Step2 />}
			{Route.useSearch().step === 3 && <Step3 />}
		</>
	);
}

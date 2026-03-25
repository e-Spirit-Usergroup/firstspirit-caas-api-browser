import Step1 from "@components/entry-wizard/step-1/step-1";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/setup/_setup/wizard")({
	component: RouteComponent,
});

function RouteComponent() {
	return <Step1 />;
}

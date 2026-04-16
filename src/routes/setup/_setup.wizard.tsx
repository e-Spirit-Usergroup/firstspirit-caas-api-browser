import SetupForm from "@components/entry-wizard/setup-form";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/setup/_setup/wizard")({
	component: RouteComponent,
});

function RouteComponent() {
	return <SetupForm />;
}

import { createFileRoute } from "@tanstack/react-router";
import InputFile from "@/components/input-file";

export const Route = createFileRoute("/setup/_setup/file-upload")({
	component: RouteComponent,
});

function RouteComponent() {
	return <InputFile />;
}

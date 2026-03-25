import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { isCaaSConfigStoreInitialized } from "@/stores/caas-config-store";

export const Route = createFileRoute("/")({
	component: Index,
});

function Index() {
	const navigate = useNavigate();

	useEffect(() => {
		isCaaSConfigStoreInitialized()
			? navigate({ to: "/app" })
			: navigate({ to: "/setup" });
	}, [navigate]);

	return;
}

import { createRootRoute, Outlet } from "@tanstack/react-router";
import { Toaster, type ToasterProps } from "sonner";

import "/node_modules/flag-icons/css/flag-icons.min.css";

import "../globals.css";

import useUserPreferences from "@/stores/user-preferences-store";

export const Route = createRootRoute({
	component: () => {
		const theme = useUserPreferences((state) => state.theme);

		const toasterProps: ToasterProps = {
			position: "top-center",
			closeButton: true,
			theme,
		};

		return (
			<>
				<Outlet />
				<Toaster {...toasterProps} />
			</>
		);
	},
});

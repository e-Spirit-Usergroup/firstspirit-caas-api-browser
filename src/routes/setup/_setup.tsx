import {
	createFileRoute,
	Link,
	Outlet,
	useMatchRoute,
} from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Footer } from "@/components/footer";
import Icon from "@/components/icons/icon";
import SetupNavbar from "@/components/setup-navbar";

export const Route = createFileRoute("/setup/_setup")({
	component: RouteComponent,
});

function RouteComponent() {
	const matchRoute = useMatchRoute();
	const { t } = useTranslation();
	const isIndex = matchRoute({ to: "/setup", fuzzy: false });

	return (
		<div className="flex min-h-screen flex-col">
			<div className="flex-1">
				<SetupNavbar />

				<div className="flex-1 h-full w-full overflow-y-auto max-w-3xl flex-col lg:max-w-7xl mx-auto">
					<div className="container mx-auto p-4 w-full pt-20">
						{!isIndex && (
							<Link
								to={"/setup"}
								className="mb-2 hover:text-blue-400 transition-colors inline-flex items-center gap-1"
							>
								<Icon icon="caret-left" className="inline me-1" />
								{t("setup.goBack")}
							</Link>
						)}
						<div className="flex p-4 bg-white dark:bg-neutral-900 rounded-lg">
							<Outlet />
						</div>
					</div>
				</div>
			</div>
			<Footer />
		</div>
	);
}

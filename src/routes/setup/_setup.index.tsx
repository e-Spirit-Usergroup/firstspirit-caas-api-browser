import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/setup/_setup/")({
	component: RouteComponent,
});

function RouteComponent() {
	const { t } = useTranslation();

	return (
		<>
			{/* left */}
			<Link
				to={"/setup/file-upload"}
				className="text-center flex-1 flex flex-col gap-4 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors p-12 cursor-pointer"
			>
				<h2 className="font-bold text-xl">
					{t("setup.uploadConfigFile.title")}
				</h2>
				<p className="text-neutral-500">
					{t("setup.uploadConfigFile.description")}
				</p>
				<img
					src="/undraw/undraw_files-uploading_qf8u.svg"
					alt="wizard"
					className="w-full max-w-48 max-h-48 mx-auto mt-4"
				/>
			</Link>
			{/* right */}
			<Link
				to={"/setup/wizard"}
				className="text-center flex-1 flex flex-col gap-4 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors p-12 cursor-pointer"
			>
				<h2 className="font-bold text-xl">{t("setup.wizardSetup.title")}</h2>
				<p className="text-neutral-500">{t("setup.wizardSetup.description")}</p>
				<img
					src="/undraw/undraw_terms_sx63.svg"
					alt="wizard"
					className="w-full max-w-48 max-h-48 mx-auto mt-4"
				/>
			</Link>
		</>
	);
}

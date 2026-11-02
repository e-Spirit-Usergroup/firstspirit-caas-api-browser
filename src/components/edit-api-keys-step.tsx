import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { useId } from "react";
import { type SubmitHandler, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import type { z } from "zod";
import { normalizeCaasApiKeys } from "@/lib/caas-api-keys";
import { testCaaSApiKeys } from "@/lib/caas-connection-test";
import type { CaasApiKeys } from "@/types/configuration";
import { stageOptionTexts } from "@/types/stage";
import { caasApiKeysSchema } from "./entry-wizard/setup-form.schema";
import type { ProjectRow } from "./projects-table";
import { Button } from "./ui/button";
import {
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "./ui/dialog";
import { FormField } from "./ui/form-field";
import { Input } from "./ui/input";
import { Spinner } from "./ui/spinner";

type ApiKeysInputs = z.infer<typeof caasApiKeysSchema>;

type EditApiKeysStepProps = {
	project: ProjectRow;
	onSave: (project: ProjectRow, caasApiKeys: CaasApiKeys) => void;
	onBack: () => void;
};

/** Second step of the Manage Projects dialog, shown in place of the projects table. */
function EditApiKeysStep({ project, onSave, onBack }: EditApiKeysStepProps) {
	const { t } = useTranslation();
	const previewApiKeyId = useId();
	const releaseApiKeyId = useId();

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<ApiKeysInputs>({
		resolver: zodResolver(caasApiKeysSchema),
		defaultValues: {
			preview: project.project.caasApiKeys.preview ?? "",
			release: project.project.caasApiKeys.release ?? "",
		},
		mode: "onChange",
	});

	const onSubmit: SubmitHandler<ApiKeysInputs> = async (data) => {
		const caasApiKeys = normalizeCaasApiKeys(data);
		const isConnected = await testCaaSApiKeys(
			project.project.caasUrl,
			caasApiKeys,
			() => {},
			t,
		);
		if (isConnected) onSave(project, caasApiKeys);
	};

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
			<DialogHeader>
				<div className="flex items-center gap-2">
					<Button
						type="button"
						variant="ghost"
						size="icon"
						onClick={onBack}
						disabled={isSubmitting}
						aria-label={t("app.settings.manageProjects.back")}
					>
						<ArrowLeft className="size-4" />
					</Button>
					<DialogTitle>
						{t("app.settings.manageProjects.editApiKeys")}
					</DialogTitle>
				</div>
				<DialogDescription>
					{`${project.customerName} · ${stageOptionTexts[project.stage]} · ${project.projectName}`}
				</DialogDescription>
				<DialogDescription>
					{t("app.settings.manageProjects.editApiKeysDescription")}
				</DialogDescription>
			</DialogHeader>
			<div className="flex flex-col gap-4 sm:max-w-md">
				<FormField
					label={t("setup.wizardSetup.step1.form.caasApiKey.previewLabel")}
					htmlFor={previewApiKeyId}
					error={
						errors.preview
							? t(
									`setup.wizardSetup.step1.form.caasApiKey.validation.${errors.preview.message}`,
								)
							: undefined
					}
				>
					<Input
						type="password"
						id={previewApiKeyId}
						placeholder={t(
							"setup.wizardSetup.step1.form.caasApiKey.placeholder",
						)}
						{...register("preview")}
						disabled={isSubmitting}
					/>
				</FormField>
				<FormField
					label={t("setup.wizardSetup.step1.form.caasApiKey.releaseLabel")}
					htmlFor={releaseApiKeyId}
				>
					<Input
						type="password"
						id={releaseApiKeyId}
						placeholder={t(
							"setup.wizardSetup.step1.form.caasApiKey.placeholder",
						)}
						{...register("release", { deps: "preview" })}
						disabled={isSubmitting}
					/>
				</FormField>
			</div>
			<DialogFooter>
				<Button
					type="button"
					variant="outline"
					onClick={onBack}
					disabled={isSubmitting}
				>
					{t("app.settings.manageProjects.cancel")}
				</Button>
				<Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
					{isSubmitting && <Spinner data-icon="inline-start" />}
					{t("app.settings.manageProjects.save")}
				</Button>
			</DialogFooter>
		</form>
	);
}

export { EditApiKeysStep };

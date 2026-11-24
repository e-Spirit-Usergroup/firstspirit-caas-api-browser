import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { useId } from "react";
import { type SubmitHandler, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { normalizeCaasApiKeys } from "@/lib/caas-api-keys";
import { testCaaSApiKeys } from "@/lib/caas-connection-test";
import { inferNavServiceUrl } from "@/lib/nav-service-url";
import type { CaasApiKeys } from "@/types/configuration";
import { stageOptionTexts } from "@/types/stage";
import { caasApiKeysSchema, schema } from "./entry-wizard/setup-form.schema";
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

const editProjectSchema = z.object({
	caasApiKeys: caasApiKeysSchema,
	navigationServiceUrl: schema.shape.navigationServiceUrl,
});

type EditProjectInputs = z.infer<typeof editProjectSchema>;

type EditApiKeysStepProps = {
	project: ProjectRow;
	onSave: (
		project: ProjectRow,
		caasApiKeys: CaasApiKeys,
		navigationServiceUrl: string,
	) => void;
	onBack: () => void;
};

/** Second step of the Manage Projects dialog, shown in place of the projects table. */
function EditApiKeysStep({ project, onSave, onBack }: EditApiKeysStepProps) {
	const { t } = useTranslation();
	const previewApiKeyId = useId();
	const releaseApiKeyId = useId();
	const navServiceUrlId = useId();
	const inferredNavServiceUrl = inferNavServiceUrl(project.project.caasUrl);
	const storedNavServiceUrl = project.project.navigationServiceUrl ?? "";

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<EditProjectInputs>({
		resolver: zodResolver(editProjectSchema),
		defaultValues: {
			caasApiKeys: {
				preview: project.project.caasApiKeys.preview ?? "",
				release: project.project.caasApiKeys.release ?? "",
			},
			// An empty field means "derive from the CaaS URL".
			navigationServiceUrl:
				storedNavServiceUrl === inferredNavServiceUrl
					? ""
					: storedNavServiceUrl,
		},
		mode: "onChange",
	});

	const onSubmit: SubmitHandler<EditProjectInputs> = async (data) => {
		const caasApiKeys = normalizeCaasApiKeys(data.caasApiKeys);
		const isConnected = await testCaaSApiKeys(
			project.project.caasUrl,
			caasApiKeys,
			() => {},
			t,
		);
		if (isConnected) onSave(project, caasApiKeys, data.navigationServiceUrl);
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
						{t("app.settings.manageProjects.editProject")}
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
						errors.caasApiKeys?.preview
							? t(
									`setup.wizardSetup.step1.form.caasApiKey.validation.${errors.caasApiKeys.preview.message}`,
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
						{...register("caasApiKeys.preview")}
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
						{...register("caasApiKeys.release", {
							deps: "caasApiKeys.preview",
						})}
						disabled={isSubmitting}
					/>
				</FormField>
				<FormField
					label={t("setup.wizardSetup.step1.form.navServiceUrl.label")}
					htmlFor={navServiceUrlId}
					error={
						errors.navigationServiceUrl
							? t(
									`setup.wizardSetup.step1.form.navServiceUrl.validation.${errors.navigationServiceUrl.message}`,
								)
							: undefined
					}
				>
					<Input
						type="url"
						id={navServiceUrlId}
						placeholder={inferredNavServiceUrl}
						{...register("navigationServiceUrl")}
						disabled={isSubmitting}
					/>
					<p className="text-muted-foreground text-xs">
						{t("setup.wizardSetup.step1.form.navServiceUrl.hint")}
					</p>
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

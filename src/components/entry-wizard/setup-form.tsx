import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { useId, useMemo, useState } from "react";
import { type SubmitHandler, useForm, useFormState } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import ConnectionStatusIcon from "@/components/ui/connection-status-icon";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { testCaaSConnection } from "@/lib/caas-connection-test";
import { discoverSchemasAndLocales } from "@/lib/caas-discovery";
import { useCaaSConfigStore } from "@/stores/caas-config-store";
import type { ConnectionStatusType } from "@/types/connection-status";
import { stageTypes } from "@/types/stage";
import { CustomerNameField } from "./customer-name-field";
import { type Inputs, schema } from "./setup-form.schema";

function SetupForm() {
	const { upsertProjectSetupData, setProjectSchemasAndLocales, customers } =
		useCaaSConfigStore();
	const { t } = useTranslation();
	const navigate = useNavigate();

	const stageId = useId();
	const projectNameId = useId();
	const caasApiKeyId = useId();
	const caasUrlId = useId();

	const [connectionStatus, setConnectionStatus] =
		useState<ConnectionStatusType>("untouched");
	const [isDiscoveringMetadata, setIsDiscoveringMetadata] = useState(false);

	const customerOptions = useMemo(
		() => customers.map((c) => c.customerName),
		[customers],
	);

	const { register, handleSubmit, control, setValue, watch, setError } =
		useForm<Inputs>({
			resolver: zodResolver(schema),
			defaultValues: {
				customerName: "",
				stage: "dev",
				projectName: "",
				caasApiKey: "",
				caasUrl: "",
			},
			mode: "onChange",
		});

	const onSubmit: SubmitHandler<Inputs> = async (data) => {
		const normalizedCustomerName = data.customerName.trim().toLowerCase();
		const normalizedProjectName = data.projectName.trim().toLowerCase();
		const hasDuplicateProject = customers.some(
			(customer) =>
				customer.customerName.trim().toLowerCase() === normalizedCustomerName &&
				customer.stages[data.stage].some(
					(project) =>
						project.projectName.trim().toLowerCase() === normalizedProjectName,
				),
		);

		if (hasDuplicateProject) {
			setError("projectName", { type: "manual", message: "duplicate" });
			toast.error(
				t("setup.wizardSetup.step1.form.projectName.validation.duplicate"),
			);
			return;
		}

		const isConnected = await testCaaSConnection(
			data.caasUrl,
			data.caasApiKey,
			setConnectionStatus,
			t,
		);
		if (!isConnected) return;

		try {
			setIsDiscoveringMetadata(true);
			const { databaseSchemas, locales } = await discoverSchemasAndLocales({
				caasUrl: data.caasUrl,
				caasApiKey: data.caasApiKey,
			});

			if (!locales.length) {
				toast.error(t("setup.wizardSetup.step1.form.discovery.noLocales"));
				setConnectionStatus("disconnected");
				return;
			}

			upsertProjectSetupData(data);
			setProjectSchemasAndLocales({
				customerName: data.customerName.trim(),
				stage: data.stage,
				projectName: data.projectName.trim(),
				databaseSchemas,
				locales,
			});
			toast.success(
				t("setup.wizardSetup.step1.form.discovery.success", {
					schemas: databaseSchemas.length,
					entityTypes: databaseSchemas.reduce(
						(acc, s) => acc + (s.entityTypeNames?.length ?? 0),
						0,
					),
					locales: locales.length,
				}),
			);
			navigate({ to: "/app" });
		} catch {
			toast.error(t("setup.wizardSetup.step1.form.discovery.error"));
			setConnectionStatus("disconnected");
		} finally {
			setIsDiscoveringMetadata(false);
		}
	};

	const { errors } = useFormState({ control });
	const selectedStage = watch("stage");
	const isFormLocked = connectionStatus === "connected" || isDiscoveringMetadata;

	return (
		<form
			className="flex flex-col gap-4 p-4 w-full"
			onSubmit={handleSubmit(onSubmit)}
		>
			<CustomerNameField
				customers={customerOptions}
				isFormLocked={isFormLocked}
				onValueChange={(value, shouldDirty = true) =>
					setValue("customerName", value, { shouldValidate: true, shouldDirty })
				}
				error={
					errors.customerName
						? t(
								`setup.wizardSetup.step1.form.customerName.validation.${errors.customerName.message}`,
							)
						: undefined
				}
			/>
			<input type="hidden" {...register("customerName")} />

			<FormField
				label={t("setup.wizardSetup.step1.form.stage.label")}
				htmlFor={stageId}
			>
				<Select
					value={selectedStage}
					onValueChange={(value: Inputs["stage"]) => setValue("stage", value)}
					disabled={isFormLocked}
				>
					<SelectTrigger id={stageId}>
						<SelectValue
							placeholder={t("setup.wizardSetup.step1.form.stage.label")}
						/>
					</SelectTrigger>
					<SelectContent>
						{stageTypes.map((stage) => (
							<SelectItem key={stage} value={stage}>
								{t(`setup.wizardSetup.step1.form.stage.options.${stage}`)}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<input type="hidden" {...register("stage")} />
			</FormField>

			<FormField
				label={t("setup.wizardSetup.step1.form.projectName.label")}
				htmlFor={projectNameId}
				error={
					errors.projectName
						? t(
								`setup.wizardSetup.step1.form.projectName.validation.${errors.projectName.message}`,
							)
						: undefined
				}
			>
				<Input
					type="text"
					id={projectNameId}
					placeholder={t(
						"setup.wizardSetup.step1.form.projectName.placeholder",
					)}
					{...register("projectName")}
					disabled={isFormLocked}
				/>
			</FormField>

			<FormField
				label={t("setup.wizardSetup.step1.form.caasApiKey.label")}
				htmlFor={caasApiKeyId}
				error={
					errors.caasApiKey
						? t(
								`setup.wizardSetup.step1.form.caasApiKey.validation.${errors.caasApiKey.message}`,
							)
						: undefined
				}
			>
				<Input
					type="password"
					id={caasApiKeyId}
					placeholder={t(
						"setup.wizardSetup.step1.form.caasApiKey.placeholder",
					)}
					{...register("caasApiKey")}
					disabled={isFormLocked}
				/>
			</FormField>

			<FormField
				label={t("setup.wizardSetup.step1.form.caasUrl.label")}
				htmlFor={caasUrlId}
				error={
					errors.caasUrl
						? t(
								`setup.wizardSetup.step1.form.caasUrl.validation.${errors.caasUrl.message}`,
							)
						: undefined
				}
			>
				<Input
					type="text"
					id={caasUrlId}
					placeholder={t("setup.wizardSetup.step1.form.caasUrl.placeholder")}
					{...register("caasUrl")}
					disabled={isFormLocked}
				/>
			</FormField>

			{connectionStatus !== "connected" && (
				<Button type="submit" disabled={isDiscoveringMetadata}>
					{isDiscoveringMetadata
						? t("setup.wizardSetup.step1.form.discovery.inProgress")
						: t("setup.wizardSetup.step1.form.submitBtn")}
				</Button>
			)}
			<span className="inline-flex items-center gap-2 font-semibold text-sm">
				<ConnectionStatusIcon connectionStatus={connectionStatus} />
				{`${t("setup.wizardSetup.step1.form.connectionStatus.label")}: `}
				{t(`setup.wizardSetup.step1.form.connectionStatus.${connectionStatus}`)}
			</span>
		</form>
	);
}

export default SetupForm;

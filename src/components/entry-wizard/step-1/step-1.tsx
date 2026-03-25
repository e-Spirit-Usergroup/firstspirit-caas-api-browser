import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { useId, useState } from "react";
import {
	type SubmitHandler,
	useForm,
	useFormState,
	useWatch,
} from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import ConnectionStatusIcon from "@/components/ui/connection-status-icon";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useCaaSConfigStore } from "@/stores/caas-config-store";
import type { ConnectionStatusType } from "@/types/connection-status";
import { type Inputs, schema } from "./schema";

function Step1() {
	const { setProjectSetupData: setProjectSettings } = useCaaSConfigStore();
	const { t } = useTranslation();
	const navigate = useNavigate();

	const customerNameId = useId();
	const stageId = useId();
	const projectNameId = useId();
	const caasApiKeyId = useId();
	const caasUrlId = useId();

	const [connectionStatus, setConnectionStatus] =
		useState<ConnectionStatusType>("untouched");

	const { register, handleSubmit, control, setValue, watch } = useForm<Inputs>({
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

	const onSubmit: SubmitHandler<Inputs> = (data) => {
		testConnection().then((isConnected) => {
			if (isConnected) {
				setProjectSettings({
					...data,
				});
			}
		});
	};

	const nextStep = () => {
		navigate({ to: "/setup/wizard", search: { step: 2 } });
	};

	const { errors } = useFormState({ control });
	const values = useWatch({ control });
	const selectedStage = watch("stage");

	const testConnection = async () => {
		try {
			if (!values.caasUrl) {
				setConnectionStatus("disconnected");
				toast.error("CaaS URL is required");
				return false;
			}
			const url: URL = new URL(values.caasUrl);
			const searchParams = new URLSearchParams();

			searchParams.append("filter", `{"_id": ""}`);
			searchParams.append("np", "");
			searchParams.append("rep", "pj");

			url.search = searchParams.toString();

			const response = await fetch(url.toString(), {
				headers: {
					Authorization: `Bearer ${values.caasApiKey}`,
					"Content-Type": "application/json",
				},
			});

			const statusCode = response?.status;

			if (statusCode === 200) {
				setConnectionStatus("connected");
				toast.success(
					t("setup.wizardSetup.step1.form.connectionStatus.toast.status200"),
				);
				return true;
			} else if (statusCode === 401) {
				setConnectionStatus("disconnected");
				toast.error(
					t("setup.wizardSetup.step1.form.connectionStatus.toast.status401"),
				);
				return false;
			} else if (statusCode === 403) {
				setConnectionStatus("disconnected");
				toast.error(
					t("setup.wizardSetup.step1.form.connectionStatus.toast.status403"),
				);
				return false;
			} else if (statusCode === 404) {
				setConnectionStatus("disconnected");
				toast.error(
					t("setup.wizardSetup.step1.form.connectionStatus.toast.status404"),
				);
				return false;
			}
		} catch (e) {
			console.log("error", e);
			setConnectionStatus("disconnected");
			toast.error(
				t("setup.wizardSetup.step1.form.connectionStatus.toast.statusError"),
			);
			return false;
		}
	};

	return (
		<form
			className="flex flex-col gap-4 p-4 w-full"
			onSubmit={handleSubmit(onSubmit)}
		>
			<div>
				<label
					htmlFor={customerNameId}
					className="text-sm font-medium mb-1.5 inline-block"
				>
					{t("setup.wizardSetup.step1.form.customerName.label")}
				</label>
				<Input
					type="text"
					id={customerNameId}
					placeholder={t(
						"setup.wizardSetup.step1.form.customerName.placeholder",
					)}
					{...register("customerName")}
					disabled={connectionStatus === "connected"}
				/>
				{errors.customerName && (
					<p className="text-red-500 text-sm mt-1">
						{t(
							`setup.wizardSetup.step1.form.customerName.validation.${errors.customerName.message}`,
						)}
					</p>
				)}
			</div>
			<div>
				<label
					htmlFor={stageId}
					className="text-sm font-medium mb-1.5 inline-block"
				>
					{t("setup.wizardSetup.step1.form.stage.label")}
				</label>
				<Select
					value={selectedStage}
					onValueChange={(value: Inputs["stage"]) => setValue("stage", value)}
					disabled={connectionStatus === "connected"}
				>
					<SelectTrigger id={stageId}>
						<SelectValue
							placeholder={t("setup.wizardSetup.step1.form.stage.label")}
						/>
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="dev">
							{t("setup.wizardSetup.step1.form.stage.options.dev")}
						</SelectItem>
						<SelectItem value="qa">
							{t("setup.wizardSetup.step1.form.stage.options.qa")}
						</SelectItem>
						<SelectItem value="prod">
							{t("setup.wizardSetup.step1.form.stage.options.prod")}
						</SelectItem>
					</SelectContent>
				</Select>
				<input type="hidden" {...register("stage")} />
			</div>
			<div>
				<label
					htmlFor={projectNameId}
					className="text-sm font-medium mb-1.5 inline-block"
				>
					{t("setup.wizardSetup.step1.form.projectName.label")}
				</label>
				<Input
					type="text"
					id={projectNameId}
					placeholder={t(
						"setup.wizardSetup.step1.form.projectName.placeholder",
					)}
					{...register("projectName")}
					disabled={connectionStatus === "connected"}
				/>
				{errors.projectName && (
					<p className="text-red-500 text-sm mt-1">
						{t(
							`setup.wizardSetup.step1.form.projectName.validation.${errors.projectName.message}`,
						)}
					</p>
				)}
			</div>
			<div>
				<label
					htmlFor={caasApiKeyId}
					className="text-sm font-medium mb-1.5 inline-block"
				>
					{t("setup.wizardSetup.step1.form.caasApiKey.label")}
				</label>
				<Input
					type="password"
					id={caasApiKeyId}
					placeholder={t("setup.wizardSetup.step1.form.caasApiKey.placeholder")}
					{...register("caasApiKey")}
					disabled={connectionStatus === "connected"}
				/>
				{errors.caasApiKey && (
					<p className="text-red-500 text-sm mt-1">
						{t(
							`setup.wizardSetup.step1.form.caasApiKey.validation.${errors.caasApiKey.message}`,
						)}
					</p>
				)}
			</div>

			<div>
				<label
					htmlFor={caasUrlId}
					className="text-sm font-medium mb-1.5 inline-block"
				>
					{t("setup.wizardSetup.step1.form.caasUrl.label")}
				</label>
				<Input
					type="text"
					id={caasUrlId}
					placeholder={t("setup.wizardSetup.step1.form.caasUrl.placeholder")}
					{...register("caasUrl")}
					disabled={connectionStatus === "connected"}
				/>
				{errors.caasUrl && (
					<p className="text-red-500 text-sm mt-1">
						{t(
							`setup.wizardSetup.step1.form.caasUrl.validation.${errors.caasUrl.message}`,
						)}
					</p>
				)}
			</div>

			{connectionStatus !== "connected" && (
				<Button type="submit">
					{t("setup.wizardSetup.step1.form.submitBtn")}
				</Button>
			)}
			<span className="inline-flex items-center gap-2 font-semibold text-sm">
				<ConnectionStatusIcon connectionStatus={connectionStatus} />
				{`${t("setup.wizardSetup.step1.form.connectionStatus.label")}: `}
				{t(`setup.wizardSetup.step1.form.connectionStatus.${connectionStatus}`)}
			</span>
			{connectionStatus === "connected" && (
				<Button onClick={nextStep.bind(null)}>
					{t("setup.wizardSetup.step1.form.nextStep")}
				</Button>
			)}
		</form>
	);
}

export default Step1;

import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useId, useMemo, useState } from "react";
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
import { stageTypes } from "@/types/stage";
import { type Inputs, schema } from "./schema";

function Step1() {
	const { setWizardProjectSetupData, clearWizardDraft, customers } =
		useCaaSConfigStore();
	const { t } = useTranslation();
	const navigate = useNavigate();

	const customerNameId = useId();
	const existingCustomerId = useId();
	const stageId = useId();
	const projectNameId = useId();
	const caasApiKeyId = useId();
	const caasUrlId = useId();

	const [connectionStatus, setConnectionStatus] =
		useState<ConnectionStatusType>("untouched");
	const customerOptions = useMemo(
		() => customers.map((customer) => customer.customerName),
		[customers],
	);
	const hasCustomerOptions = customerOptions.length > 0;
	const [customerInputMode, setCustomerInputMode] = useState<
		"new" | "existing"
	>(hasCustomerOptions ? "existing" : "new");
	const [newCustomerName, setNewCustomerName] = useState("");
	const [existingCustomerName, setExistingCustomerName] = useState(
		customerOptions[0] ?? "",
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

	const onSubmit: SubmitHandler<Inputs> = (data) => {
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
			setError("projectName", {
				type: "manual",
				message: "duplicate",
			});
			toast.error(
				t("setup.wizardSetup.step1.form.projectName.validation.duplicate"),
			);
			return;
		}

		testConnection().then((isConnected) => {
			if (isConnected) {
				clearWizardDraft();
				setWizardProjectSetupData({
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

	useEffect(() => {
		if (!hasCustomerOptions && customerInputMode === "existing") {
			setCustomerInputMode("new");
			setValue("customerName", newCustomerName, {
				shouldValidate: true,
				shouldDirty: true,
			});
			return;
		}

		if (hasCustomerOptions && !customerOptions.includes(existingCustomerName)) {
			const fallbackCustomer = customerOptions[0];
			setExistingCustomerName(fallbackCustomer);
			if (customerInputMode === "existing") {
				setValue("customerName", fallbackCustomer, {
					shouldValidate: true,
					shouldDirty: true,
				});
			}
		}
	}, [
		customerInputMode,
		customerOptions,
		existingCustomerName,
		hasCustomerOptions,
		newCustomerName,
		setValue,
	]);

	useEffect(() => {
		if (
			customerInputMode === "existing" &&
			hasCustomerOptions &&
			!values.customerName
		) {
			const value = existingCustomerName || customerOptions[0];
			setExistingCustomerName(value);
			setValue("customerName", value, {
				shouldValidate: true,
				shouldDirty: false,
			});
		}
	}, [
		customerInputMode,
		customerOptions,
		existingCustomerName,
		hasCustomerOptions,
		setValue,
		values.customerName,
	]);

	const onCustomerModeChange = (mode: "new" | "existing") => {
		if (mode === "existing" && !hasCustomerOptions) {
			setCustomerInputMode("new");
			setValue("customerName", newCustomerName, {
				shouldValidate: true,
				shouldDirty: true,
			});
			return;
		}

		setCustomerInputMode(mode);
		if (mode === "existing") {
			const value = existingCustomerName || customerOptions[0];
			setExistingCustomerName(value);
			setValue("customerName", value, {
				shouldValidate: true,
				shouldDirty: true,
			});
			return;
		}

		setValue("customerName", newCustomerName, {
			shouldValidate: true,
			shouldDirty: true,
		});
	};

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
			<div className="min-w-0">
				<label
					htmlFor={
						customerInputMode === "existing"
							? existingCustomerId
							: customerNameId
					}
					className="text-sm font-medium mb-1.5 inline-block"
				>
					{t("setup.wizardSetup.step1.form.customerName.label")}
				</label>
				{hasCustomerOptions && (
					<div className="mb-2 grid grid-cols-2 gap-2">
						<Button
							type="button"
							variant={customerInputMode === "new" ? "default" : "outline"}
							onClick={() => onCustomerModeChange("new")}
							disabled={connectionStatus === "connected"}
							className="w-full"
						>
							{t("setup.wizardSetup.step1.form.customerName.mode.newCustomer")}
						</Button>
						<Button
							type="button"
							variant={customerInputMode === "existing" ? "default" : "outline"}
							onClick={() => onCustomerModeChange("existing")}
							disabled={connectionStatus === "connected"}
							className="w-full"
						>
							{t(
								"setup.wizardSetup.step1.form.customerName.mode.existingCustomer",
							)}
						</Button>
					</div>
				)}
				{(!hasCustomerOptions || customerInputMode === "new") && (
					<Input
						type="text"
						id={customerNameId}
						placeholder={t(
							"setup.wizardSetup.step1.form.customerName.placeholder",
						)}
						value={newCustomerName}
						onChange={(event) => {
							const value = event.target.value;
							setNewCustomerName(value);
							setValue("customerName", value, {
								shouldValidate: true,
								shouldDirty: true,
							});
						}}
						disabled={connectionStatus === "connected"}
					/>
				)}
				{customerInputMode === "existing" && hasCustomerOptions && (
					<Select
						value={existingCustomerName}
						onValueChange={(value) => {
							setExistingCustomerName(value);
							setValue("customerName", value, {
								shouldValidate: true,
								shouldDirty: true,
							});
						}}
						disabled={connectionStatus === "connected"}
					>
						<SelectTrigger id={existingCustomerId}>
							<SelectValue
								placeholder={t(
									"setup.wizardSetup.step1.form.customerName.existingPlaceholder",
								)}
							/>
						</SelectTrigger>
						<SelectContent>
							{customerOptions.map((customerName) => (
								<SelectItem key={customerName} value={customerName}>
									{customerName}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				)}
				<input type="hidden" {...register("customerName")} />
				{errors.customerName && (
					<p className="text-red-500 text-sm mt-1">
						{t(
							`setup.wizardSetup.step1.form.customerName.validation.${errors.customerName.message}`,
						)}
					</p>
				)}
			</div>

			<div className="min-w-0">
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
						{stageTypes.map((stage) => (
							<SelectItem key={stage} value={stage}>
								{t(`setup.wizardSetup.step1.form.stage.options.${stage}`)}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<input type="hidden" {...register("stage")} />
			</div>

			<div className="min-w-0">
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

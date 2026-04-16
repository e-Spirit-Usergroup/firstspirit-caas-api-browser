import { useEffect, useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

type CustomerNameFieldProps = {
	customers: string[];
	isFormLocked: boolean;
	onValueChange: (value: string, shouldDirty?: boolean) => void;
	error?: string;
};

function CustomerNameField({
	customers,
	isFormLocked,
	onValueChange,
	error,
}: CustomerNameFieldProps) {
	const { t } = useTranslation();
	const customerNameId = useId();
	const existingCustomerId = useId();

	const hasCustomerOptions = customers.length > 0;
	const [customerInputMode, setCustomerInputMode] = useState<"new" | "existing">(
		hasCustomerOptions ? "existing" : "new",
	);
	const [newCustomerName, setNewCustomerName] = useState("");
	const [existingCustomerName, setExistingCustomerName] = useState(
		customers[0] ?? "",
	);

	useEffect(() => {
		if (!hasCustomerOptions && customerInputMode === "existing") {
			setCustomerInputMode("new");
			onValueChange(newCustomerName, true);
			return;
		}
		if (hasCustomerOptions && !customers.includes(existingCustomerName)) {
			const fallback = customers[0];
			setExistingCustomerName(fallback);
			if (customerInputMode === "existing") {
				onValueChange(fallback, true);
			}
		}
	}, [
		customerInputMode,
		customers,
		existingCustomerName,
		hasCustomerOptions,
		newCustomerName,
		onValueChange,
	]);

	useEffect(() => {
		if (
			customerInputMode === "existing" &&
			hasCustomerOptions &&
			!existingCustomerName
		) {
			const value = customers[0] ?? "";
			setExistingCustomerName(value);
			onValueChange(value, false);
		}
	}, [
		customerInputMode,
		customers,
		existingCustomerName,
		hasCustomerOptions,
		onValueChange,
	]);

	const onCustomerModeChange = (mode: "new" | "existing") => {
		if (mode === "existing" && !hasCustomerOptions) {
			setCustomerInputMode("new");
			onValueChange(newCustomerName, true);
			return;
		}
		setCustomerInputMode(mode);
		if (mode === "existing") {
			const value = existingCustomerName || customers[0];
			setExistingCustomerName(value);
			onValueChange(value, true);
			return;
		}
		onValueChange(newCustomerName, true);
	};

	return (
		<div className="min-w-0">
			<label
				htmlFor={
					customerInputMode === "existing" ? existingCustomerId : customerNameId
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
						disabled={isFormLocked}
						className="w-full"
					>
						{t("setup.wizardSetup.step1.form.customerName.mode.newCustomer")}
					</Button>
					<Button
						type="button"
						variant={customerInputMode === "existing" ? "default" : "outline"}
						onClick={() => onCustomerModeChange("existing")}
						disabled={isFormLocked}
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
						onValueChange(value, true);
					}}
					disabled={isFormLocked}
				/>
			)}
			{customerInputMode === "existing" && hasCustomerOptions && (
				<Select
					value={existingCustomerName}
					onValueChange={(value) => {
						setExistingCustomerName(value);
						onValueChange(value, true);
					}}
					disabled={isFormLocked}
				>
					<SelectTrigger id={existingCustomerId}>
						<SelectValue
							placeholder={t(
								"setup.wizardSetup.step1.form.customerName.existingPlaceholder",
							)}
						/>
					</SelectTrigger>
					<SelectContent>
						{customers.map((name) => (
							<SelectItem key={name} value={name}>
								{name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			)}
			{error && <p className="text-red-500 text-sm mt-1">{error}</p>}
		</div>
	);
}

export { CustomerNameField };

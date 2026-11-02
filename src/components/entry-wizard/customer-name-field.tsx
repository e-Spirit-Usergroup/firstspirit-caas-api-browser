import { PlusIcon } from "lucide-react";
import { useId, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectSeparator,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

const ADD_NEW_CUSTOMER_VALUE = "__add_new_customer__";

type CustomerNameFieldProps = {
	customers: string[];
	isFormLocked: boolean;
	value: string;
	onValueChange: (value: string, shouldDirty?: boolean) => void;
	error?: string;
};

function CustomerNameField({
	customers,
	isFormLocked,
	value,
	onValueChange,
	error,
}: CustomerNameFieldProps) {
	const { t } = useTranslation();
	const customerNameId = useId();
	const existingCustomerId = useId();
	const newCustomerInputRef = useRef<HTMLInputElement>(null);

	const hasCustomerOptions = customers.length > 0;
	const isExistingSelection = hasCustomerOptions && customers.includes(value);
	const isAddingNew = !isExistingSelection;
	const selectValue = isExistingSelection ? value : ADD_NEW_CUSTOMER_VALUE;

	const onSelectChange = (nextValue: string) => {
		if (nextValue === ADD_NEW_CUSTOMER_VALUE) {
			onValueChange("", true);
			requestAnimationFrame(() => newCustomerInputRef.current?.focus());
			return;
		}
		onValueChange(nextValue, true);
	};

	return (
		<div className="min-w-0">
			<label
				htmlFor={isAddingNew ? customerNameId : existingCustomerId}
				className="mb-1.5 inline-block text-sm font-medium"
			>
				{t("setup.wizardSetup.step1.form.customerName.label")}
			</label>
			<div className="flex flex-col gap-2">
				{hasCustomerOptions && (
					<Select
						value={selectValue}
						items={[
							...customers.map((name) => ({
								value: name,
								label: name,
							})),
							{
								value: ADD_NEW_CUSTOMER_VALUE,
								label: t("setup.wizardSetup.step1.form.customerName.addNew"),
							},
						]}
						onValueChange={onSelectChange}
						disabled={isFormLocked}
					>
						<SelectTrigger id={existingCustomerId} className="w-full">
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
							<SelectSeparator />
							<SelectItem value={ADD_NEW_CUSTOMER_VALUE}>
								<PlusIcon />
								{t("setup.wizardSetup.step1.form.customerName.addNew")}
							</SelectItem>
						</SelectContent>
					</Select>
				)}
				{isAddingNew && (
					<Input
						ref={newCustomerInputRef}
						type="text"
						id={customerNameId}
						placeholder={t(
							"setup.wizardSetup.step1.form.customerName.placeholder",
						)}
						value={value}
						onChange={(event) => onValueChange(event.target.value, true)}
						disabled={isFormLocked}
					/>
				)}
			</div>
			{error && <p className="mt-1 text-sm text-red-500">{error}</p>}
		</div>
	);
}

export { CustomerNameField };

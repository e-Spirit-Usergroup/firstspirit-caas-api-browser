import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { type SubmitHandler, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import Icon from "@/components/icons/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SaveConfigToJson } from "@/lib/config";
import { useCaaSConfigStore } from "@/stores/caas-config-store";
import { type Inputs, schema } from "./schema";

function Step3() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const [setupComplete, setSetupComplete] = useState(false);
	const {
		setLocales,
		databaseSchemas,
		projectSetupData: projectSettings,
	} = useCaaSConfigStore();
	const [localeInput, setLocaleInput] = useState<string>("");

	const { handleSubmit, control, setValue } = useForm<Inputs>({
		resolver: zodResolver(schema),
		mode: "onChange",
	});

	const values = useWatch({ control });

	const onSubmit: SubmitHandler<Inputs> = (data) => {
		if (data.locales.length === 0) {
			toast.error("Locales can't be empty");
			return;
		}
		setLocales(data.locales);
		toast.success(t("setup.wizardSetup.step3.form.locale.toast.localesSaved"));
		SaveConfigToJson({
			projectSettings,
			databaseSchemas,
			locales: data.locales,
		});
		setSetupComplete(true);
	};

	const addNewLocale = (locale: string) => {
		console.log("Adding locale:", locale);
		const newLocales = values.locales ? [...values.locales] : [];
		if (newLocales.includes(locale)) {
			toast.error(t("setup.wizardSetup.step3.form.locale.toast.alreadyExists"));
			return;
		}
		newLocales.push(locale);
		const parsed = schema.safeParse({ locales: newLocales });
		if (!parsed.success) {
			toast.error(t("setup.wizardSetup.step3.form.locale.invalidFormat"));
			return;
		}
		setValue("locales", newLocales);
	};

	const removeLocale = (locale: string) => {
		console.log("Removing locale:", locale);
		let newLocales = values.locales ? [...values.locales] : [];
		newLocales = newLocales.filter((l) => l !== locale);
		setValue("locales", newLocales);
	};

	const handleAddLocale = () => {
		if (localeInput.trim()) {
			addNewLocale(localeInput.trim());
			setLocaleInput("");
		}
	};

	return (
		<div className="flex flex-col p-4 gap-4 w-full">
			<form
				onSubmit={handleSubmit(onSubmit)}
				className="flex flex-col gap-4 w-full"
			>
				<div className="p-4 rounded-md border border-neutral-200">
					<h2 className="text-lg font-bold mb-2">
						{t("setup.wizardSetup.step3.form.title")}
					</h2>
					<div className="flex gap-2">
						<Input
							value={localeInput}
							onChange={(e) => setLocaleInput(e.target.value)}
							type="text"
							name="locale"
							placeholder={t("setup.wizardSetup.step3.form.locale.placeholder")}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									e.preventDefault();
									handleAddLocale();
								}
							}}
						/>
						<Button type="button" onClick={() => handleAddLocale()}>
							<Icon icon="plus" />
							{t("setup.wizardSetup.step3.form.locale.add")}
						</Button>
					</div>
				</div>

				<div className="w-full rounded-full" />

				{values?.locales?.length && (
					<div className="p-4 flex flex-col gap-4">
						{values?.locales?.map((locale) => (
							<div
								key={locale}
								className="flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-md"
							>
								<div className="flex-1 font-bold text-sm">{locale}</div>
								<Button
									size="sm"
									type="button"
									variant="ghost"
									className="group/btn"
									onClick={() => removeLocale(locale)}
								>
									<Icon
										icon="delete"
										className="group-hover/btn:text-red-500"
									/>
								</Button>
							</div>
						))}
					</div>
				)}

				{!setupComplete && (
					<Button type="submit" disabled={!values.locales?.length}>
						{t("setup.wizardSetup.step3.form.submitBtn")}
					</Button>
				)}
			</form>
			{setupComplete && (
				<Button onClick={() => navigate({ to: "/app" })}>
					<Icon icon="running-man" className="size-4" />
					{t("setup.wizardSetup.step3.form.nextStep")}
				</Button>
			)}
		</div>
	);
}

export default Step3;

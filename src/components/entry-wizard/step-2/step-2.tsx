import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { Loader } from "lucide-react";
import { useState } from "react";
import { type SubmitHandler, useFieldArray, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import Icon from "@/components/icons/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCaaSConfigStore } from "@/stores/caas-config-store";
import { DatabaseSchemaComponent } from "./database-schema-component";
import { type Inputs, schema } from "./schema";

function Step2() {
	const { t } = useTranslation();
	const { setDatabaseSchemas, projectSetupData: projectSettings } =
		useCaaSConfigStore();
	const [isResolvingSchemas, setIsResolvingSchemas] = useState<boolean>(false);
	const [schemaNameInput, setSchemaNameInput] = useState<string>("");
	type ConfigurationMode = "manual" | "automatic";
	const [configurationMode, setConfigurationMode] =
		useState<ConfigurationMode>("automatic");
	const [submitted, setSubmitted] = useState(false);
	const navigate = useNavigate();
	const { handleSubmit, control, setValue } = useForm<Inputs>({
		resolver: zodResolver(schema),
		mode: "onChange",
		defaultValues: {
			databaseSchemas: [],
		},
	});

	const nextStep = () => {
		navigate({ to: "/setup/wizard", search: { step: 3 } });
	};

	const { fields, append, remove } = useFieldArray<Inputs>({
		control,
		name: "databaseSchemas",
	});

	const onSubmit: SubmitHandler<Inputs> = (data) => {
		console.log(data);
		setDatabaseSchemas(data.databaseSchemas);
		setSubmitted(true);
		toast.success(
			t("setup.wizardSetup.step2.form.configurationMode.toast.schemasSaved"),
		);
	};

	const addNewSchema = (schemaName: string) => {
		if (fields.some((field) => field.name === schemaName.trim())) {
			return;
		}
		if (schemaName.trim()) {
			append({ name: schemaName.trim(), entityTypeNames: [] });
			setSchemaNameInput("");
		}
	};

	const removeSchema = (schemaName: string) => {
		const schemaIndex = fields.findIndex((field) => field.name === schemaName);
		if (schemaIndex !== -1) {
			remove(schemaIndex);
		}
	};

	const addEntityType = (name: string, schemaName: string) => {
		if (
			fields[
				fields.findIndex((field) => field.name === schemaName)
			]?.entityTypeNames.includes(name)
		) {
			return;
		}
		if (name && schemaName) {
			const schemaIndex = fields.findIndex(
				(field) => field.name === schemaName,
			);

			if (schemaIndex !== -1) {
				fields[schemaIndex].entityTypeNames.push(name);
				setValue(
					`databaseSchemas.${schemaIndex}.entityTypeNames`,
					fields[schemaIndex].entityTypeNames,
				);
			}
			console.log(fields);
		}
	};

	const removeEntityType = (name: string, schemaName: string) => {
		if (name && schemaName) {
			const schemaIndex = fields.findIndex(
				(field) => field.name === schemaName,
			);

			if (schemaIndex !== -1) {
				fields[schemaIndex].entityTypeNames = fields[
					schemaIndex
				].entityTypeNames.filter((entityType) => entityType !== name);
				setValue(
					`databaseSchemas.${schemaIndex}.entityTypeNames`,
					fields[schemaIndex].entityTypeNames,
				);
			}
		}
	};

	async function getCaaSData(
		additionalFilter?: { entityType: { $nin: string[] } },
		page?: number,
	) {
		//@ts-expect-error - we check this before allowing to proceed to this step
		const url = new URL(projectSettings.caasUrl);

		const searchParams = new URLSearchParams();
		searchParams.append("page", page ? page.toString() : "1");
		searchParams.append("pagesize", "100");
		searchParams.append("keys", JSON.stringify({ schema: 1, entityType: 1 }));

		searchParams.append("filter", JSON.stringify({ fsType: "Dataset" }));

		if (additionalFilter) {
			searchParams.append("filter", JSON.stringify(additionalFilter));
		}

		url.search = searchParams.toString();

		const response = await fetch(url.toString(), {
			headers: {
				Authorization: `Bearer ${projectSettings.caasApiKey}`,
			},
		});
		const resData = await response.json();

		return resData;
	}

	async function autoResolveSchemas() {
		setIsResolvingSchemas(true);
		const databaseSchemas: {
			name: string;
			entityTypeNames: string[];
		}[] = [];

		let hasMoreEntityTypes = true;

		while (hasMoreEntityTypes) {
			const allEntityTypes = databaseSchemas.flatMap(
				(schema) => schema.entityTypeNames,
			);

			const entityTypeFilters = {
				entityType: {
					[`$nin`]: allEntityTypes,
				},
			};

			const resData = await getCaaSData(
				allEntityTypes.length ? entityTypeFilters : undefined,
				1,
			);

			if (resData?._embedded?.["rh:doc"]?.length > 0) {
				resData._embedded["rh:doc"].forEach(
					(item: { schema?: string; entityType?: string }) => {
						if (
							item?.schema &&
							!databaseSchemas.some((schema) => schema.name === item.schema)
						) {
							console.debug("Found new schema: ", item.schema);
							databaseSchemas.push({
								name: item.schema,
								entityTypeNames: [],
							});
						} else if (item?.entityType && item?.schema) {
							const schemaIndex = databaseSchemas.findIndex(
								(field) => field.name === item.schema,
							);
							if (
								schemaIndex !== -1 &&
								!databaseSchemas[schemaIndex].entityTypeNames.includes(
									item.entityType,
								)
							) {
								console.debug(
									`Found entity type: ${item.entityType} for schema: ${item.schema}`,
								);
								databaseSchemas[schemaIndex].entityTypeNames.push(
									item.entityType,
								);
							}
						}
					},
				);
			} else {
				hasMoreEntityTypes = false;
			}
		}
		console.info(
			t("setup.wizardSetup.step2.form.configurationMode.toast.schemasFound", {
				schemas: databaseSchemas.length,
				entityTypes: databaseSchemas.reduce(
					(acc, schema) => acc + schema.entityTypeNames.length,
					0,
				),
			}),
		);
		toast.success(
			t("setup.wizardSetup.step2.form.configurationMode.toast.schemasFound", {
				schemas: databaseSchemas.length,
				entityTypes: databaseSchemas.reduce(
					(acc, schema) => acc + schema.entityTypeNames.length,
					0,
				),
			}),
		);
		setValue("databaseSchemas", databaseSchemas);
		setIsResolvingSchemas(false);
	}

	return (
		<div className="flex flex-col w-full p-4 gap-4">
			<div className="flex justify-between items-center gap-4 w-full">
				<h2 className="text-lg font-bold">
					{t("setup.wizardSetup.step2.form.title")}
				</h2>
				<div className="flex gap-2 items-center text-sm">
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger className="flex items-center gap-1">
								{t("setup.wizardSetup.step2.form.configurationMode.label")}
								<Icon icon="information-circle" className="size-4" />
							</TooltipTrigger>
							<TooltipContent className="w-72">
								<p>
									{t("setup.wizardSetup.step2.form.configurationMode.tooltip")}
								</p>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>

					<Select
						value={configurationMode}
						onValueChange={(value: ConfigurationMode) =>
							setConfigurationMode(value)
						}
					>
						<SelectTrigger className="flex-initial w-32">
							<SelectValue placeholder="Configuration Mode" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="manual">
								<span className="inline-flex items-center gap-2">
									{t(
										"setup.wizardSetup.step2.form.configurationMode.options.manual",
									)}
								</span>
							</SelectItem>
							<SelectItem value="automatic">
								<span className="inline-flex items-center gap-2">
									{t(
										"setup.wizardSetup.step2.form.configurationMode.options.automatic",
									)}
								</span>
							</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>
			<form
				onSubmit={handleSubmit(onSubmit)}
				className="flex flex-col gap-4 w-full"
			>
				{isResolvingSchemas ? (
					<div className="mx-auto m-8 flex flex-col gap-4 items-center">
						<Loader className="animate-spin-slow size-10" />
						<p>
							{t(
								"setup.wizardSetup.step2.form.configurationMode.resolvingSchemas",
							)}
						</p>
					</div>
				) : (
					<>
						{configurationMode === "manual" && (
							<div className="p-4 rounded-md border border-neutral-200">
								<h2 className="text-lg font-bold mb-2">
									{t(
										"setup.wizardSetup.step2.form.configurationMode.manual.addNewSchema",
									)}
								</h2>
								<div className="flex gap-2">
									<Input
										value={schemaNameInput}
										onChange={(e) => setSchemaNameInput(e.target.value)}
										type="text"
										name="schema-name"
										placeholder={t(
											"setup.wizardSetup.step2.form.configurationMode.manual.schemaNamePlaceholder",
										)}
										onKeyDown={(e) => {
											if (e.key === "Enter") {
												e.preventDefault();
												addNewSchema(schemaNameInput);
											}
										}}
									/>
									<Button
										type="button"
										onClick={() => addNewSchema(schemaNameInput)}
									>
										<Icon icon="plus" />
										{t(
											"setup.wizardSetup.step2.form.configurationMode.manual.addSchemaBtn",
										)}
									</Button>
								</div>
							</div>
						)}

						<div className=" w-full rounded-full" />
						{fields.map((field) => (
							<DatabaseSchemaComponent
								key={field.id}
								schema={field}
								addEntityType={addEntityType}
								removeEntityType={removeEntityType}
								removeSchema={removeSchema}
							/>
						))}
					</>
				)}

				{!submitted && (
					<div className="flex gap-4 w-full">
						{configurationMode === "automatic" && (
							<Button
								onClick={() => autoResolveSchemas()}
								className="w-full bg-neo text-white hover:bg-neo/70"
								type="button"
								disabled={isResolvingSchemas}
							>
								{t(
									"setup.wizardSetup.step2.form.configurationMode.automaticBtn",
								)}
							</Button>
						)}
						<Button
							type="submit"
							className="w-full"
							disabled={!fields.length && configurationMode === "automatic"}
						>
							{t("setup.wizardSetup.step2.form.submitBtn")}
						</Button>
					</div>
				)}
				{submitted && (
					<Button onClick={nextStep.bind(null)}>
						{t("setup.wizardSetup.step2.form.nextStep")}
					</Button>
				)}
			</form>
		</div>
	);
}

export default Step2;

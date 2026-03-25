import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useId, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Navbar } from "@/components/app-navbar";
import { Footer } from "@/components/footer";
import Icon from "@/components/icons/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import JSONViewer from "@/components/ui/json-viewer";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectSeparator,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import {
	isCaaSConfigStoreInitialized,
	useCaaSConfigStore,
} from "@/stores/caas-config-store";
import { useSettingsStore } from "@/stores/settings-store";
import {
	type FilterType,
	filterTypeOptionColors,
	filterTypeOptionTexts,
	type NameOrIdentifier,
	nameOrIdentifierOptionTexts,
} from "@/types/form";
import type { PageInfos } from "@/types/page-infos";

type FormData = {
	filterType?: FilterType | "none";
	useNameOrIdentifier: NameOrIdentifier;
	name?: string;
	identifier?: string;
	route?: string;
	schema?: string;
	entityType?: string;
	np?: boolean;
	rep?: boolean;
	count?: boolean;
};

export const Route = createFileRoute("/app/_app/")({
	component: RouteComponent,
});

function RouteComponent() {
	const { t } = useTranslation();
	const selectNameOrIdentifierId = useId();
	const filterSelectId = useId();

	const { databaseSchemas, projectSetupData: projectSettings } =
		useCaaSConfigStore();
	const [responseData, setResponseData] = useState(null);
	const [currentUrl, setCurrentUrl] = useState<string>("");
	const { register, handleSubmit, setValue, watch } = useForm<FormData>();
	const { locale, np, rep, count } = useSettingsStore();
	const navigate = useNavigate();

	const [pageInfos, setPageInfos] = useState<PageInfos>({
		totalPages: 0,
		currentPage: 1,
	});

	const filterType = watch("filterType");
	const schema = watch("schema");
	const entityType = watch("entityType");
	const useNameOrIdentifier = watch("useNameOrIdentifier");

	useEffect(() => {
		isCaaSConfigStoreInitialized()
			? navigate({ to: "/app" })
			: navigate({ to: "/setup" });
	}, [navigate]);

	async function onSubmit(data: FormData) {
		//@ts-expect-error - we check this before allowing to proceed to this step
		const url = new URL(projectSettings.caasUrl);

		const searchParams = new URLSearchParams();

		if (np) searchParams.append("np", "");
		else pageInfos.currentPage = 1;

		if (count) searchParams.append("count", "");
		else pageInfos.currentPage = 1;

		if (rep) {
			searchParams.append("rep", "pj");
			pageInfos.currentPage = 1;
		}

		searchParams.append("page", pageInfos.currentPage.toString());

		// Add Filter
		let filter = {};

		if (locale) {
			const localeArray = locale.split("_");
			filter = {
				...filter,
				"locale.country": localeArray[1],
				"locale.language": localeArray[0],
			};
		}

		if (data.filterType && data.filterType !== "none") {
			filter = {
				...filter,
				fsType: data.filterType,
			};

			if (data.schema && data.schema !== "none") {
				filter = {
					...filter,
					schema: data.schema,
				};
			}

			if (data.entityType && data.entityType !== "none") {
				filter = {
					...filter,
					entityType: data.entityType,
				};
			}

			if (data.name && data.name !== "") {
				filter = {
					...filter,
					name: data.name,
				};
			}

			if (data.identifier && data.identifier !== "") {
				filter = {
					...filter,
					identifier: data.identifier,
				};
			}

			if (data.route && data.route !== "") {
				filter = {
					...filter,
					route: data.route,
				};
			}
		}

		searchParams.append("filter", JSON.stringify(filter));

		url.search = searchParams.toString();
		setCurrentUrl(url.toString());

		const response = await fetch(url.toString(), {
			headers: {
				Authorization: `Bearer ${projectSettings.caasApiKey}`,
			},
		});
		const resData = await response.json();

		setPageInfos((prev) => ({
			...prev,
			totalPages: resData._total_pages,
		}));

		setResponseData(resData);
	}

	function pagination(direction: "next" | "previous") {
		if (direction === "next") {
			if (pageInfos.currentPage < pageInfos.totalPages) {
				pageInfos.currentPage++;
				console.log("currentPage", pageInfos.currentPage);
				handleSubmit(onSubmit)();
			}
		} else if (direction === "previous") {
			if (pageInfos.currentPage > 1) {
				pageInfos.currentPage--;
				console.log("currentPage", pageInfos.currentPage);
				handleSubmit(onSubmit)();
			}
		}
	}

	async function onCopyUrl() {
		if (currentUrl) {
			await navigator.clipboard.writeText(currentUrl);
			toast.success(t("app.form.copyUrlToClipboardBtn.success"));
		} else toast.error(t("app.form.copyUrlToClipboardBtn.error"));
	}

	return (
		<div className="mx-auto flex h-full w-full flex-col lg:flex-row">
			{/* Left Side - Form*/}
			<div className="lg:flex-1 lg:h-screen p-4 overflow-y-scroll no-scrollbar">
				<Navbar className="mb-4" />
				<form
					onSubmit={handleSubmit(onSubmit)}
					className="grid grid-cols-12 gap-4 mb-4 flex-1"
				>
					<div className="col-span-12 bg-blue-100 dark:bg-neutral-800 p-4 rounded-lg text-blue-950 dark:text-blue-100">
						<span className="inline-flex items-center gap-1">
							<span className="font-semibold">{t("app.form.decodedUrl")}</span>
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<button
											type="button"
											onClick={onCopyUrl}
											className="px-2.5 cursor-pointer"
											aria-label={t("app.form.copyUrlToClipboardBtn.label")}
										>
											<Icon icon="clipboard" className="size-4" />
										</button>
									</TooltipTrigger>
									<TooltipContent className="max-w-64">
										<p>{t("app.form.copyUrlToClipboardBtn.label")}</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						</span>
						<span className="mt-2 block bg-neutral-300 text-neutral-700 dark:bg-neutral-900 dark:text-blue-400 p-1.5 text-sm font-mono break-all">
							{currentUrl
								? decodeURIComponent(currentUrl)
								: t("app.form.noUrlToDisplay")}
						</span>
					</div>
					<div className="col-span-12 flex flex-row gap-4">
						<Select
							onValueChange={(value: FilterType) => {
								setValue("filterType", value);
								setValue("name", undefined);
								setValue("schema", undefined);
								setValue("entityType", undefined);
								setValue("identifier", undefined);
								setValue("route", undefined);
							}}
							value={filterType ?? "none"}
						>
							<SelectTrigger className="flex-initial w-46" id={filterSelectId}>
								<SelectValue placeholder="Type" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem key={0} value="none">
									<span className="inline-flex items-center gap-2">
										<span
											className="inline-block size-3 rounded-full"
											style={{
												backgroundColor: "rgba(0,0,0,0)",
											}}
										/>
										{t("app.form.filterDropdown.noFilter")}
									</span>
								</SelectItem>
								<SelectSeparator />
								{(Object.keys(filterTypeOptionTexts) as FilterType[]).map(
									(type) => (
										<SelectItem key={type} value={type}>
											<span className="inline-flex items-center gap-2">
												<span
													className="inline-block size-3 rounded-full"
													style={{
														backgroundColor: filterTypeOptionColors[type],
													}}
												/>
												{filterTypeOptionTexts[type]}
											</span>
										</SelectItem>
									),
								)}
							</SelectContent>
						</Select>
						<Label htmlFor={filterSelectId}>
							{t("app.form.filterDropdown.selectFilterType")}
						</Label>
					</div>

					{filterType &&
						filterType !== "none" &&
						filterType !== "Dataset" &&
						filterType !== "ProjectProperties" && (
							<div className="col-span-12 flex gap-4">
								<Select
									onValueChange={(value: NameOrIdentifier) => {
										setValue("useNameOrIdentifier", value);
										setValue("name", undefined);
										setValue("identifier", undefined);
										setValue("route", undefined);
									}}
									value={useNameOrIdentifier}
								>
									<SelectTrigger
										className="flex-initial w-42 gap-2"
										id={selectNameOrIdentifierId}
									>
										<SelectValue placeholder="Select" />
									</SelectTrigger>
									<SelectContent>
										{(
											Object.keys(
												nameOrIdentifierOptionTexts,
											) as NameOrIdentifier[]
										)
											.filter((type) => {
												if (
													filterType === "PageRef"
													//||filterType === "Page"
												)
													return true;
												return type !== "route";
											})
											.map((type) => (
												<SelectItem key={type} value={type}>
													<span className="inline-flex items-center gap-2">
														<span className="inline-block size-3 rounded-full" />
														{nameOrIdentifierOptionTexts[type]}
													</span>
												</SelectItem>
											))}
									</SelectContent>
								</Select>

								{useNameOrIdentifier === "identifier" ? (
									<Input
										type="text"
										placeholder="Identifier"
										{...register("identifier")}
									/>
								) : useNameOrIdentifier === "name" ? (
									<Input type="text" placeholder="Name" {...register("name")} />
								) : useNameOrIdentifier === "route" ? (
									<Input
										type="text"
										placeholder="Route"
										{...register("route")}
									/>
								) : (
									<Label htmlFor={selectNameOrIdentifierId}>
										{t(
											"app.form.filterParameterDropdown.selectFilterParameter",
										)}
									</Label>
								)}
							</div>
						)}

					{filterType === "Dataset" && databaseSchemas?.length ? (
						<>
							<div className="col-span-6">
								<Select
									onValueChange={(value) => {
										setValue("schema", value);
										setValue("entityType", undefined);
									}}
									value={schema ?? "none"}
								>
									<SelectTrigger className="flex-initial">
										<SelectValue placeholder="Select schema" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem key={0} value="none">
											<span className="inline-flex items-center gap-2">
												{t("app.form.entityTypeDropdown.noSchemaFilter")}
											</span>
										</SelectItem>
										<SelectSeparator />
										{databaseSchemas.map((schema) => (
											<SelectItem key={schema.name} value={schema.name}>
												<span className="inline-flex items-center gap-2">
													{schema.name}
												</span>
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="col-span-6">
								<Select
									onValueChange={(value) => setValue("entityType", value)}
									value={entityType ?? "none"}
									disabled={!schema || schema === "none"}
								>
									<SelectTrigger className="flex-initial">
										<SelectValue placeholder="Select entity type" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem key={0} value="none">
											<span className="inline-flex items-center gap-2">
												{t("app.form.entityTypeDropdown.noEntityTypeFilter")}
											</span>
										</SelectItem>
										{databaseSchemas?.filter(
											(schema) => schema.name === watch("schema"),
										)[0]?.entityTypeNames?.length && <SelectSeparator />}
										{databaseSchemas
											.filter((schema) => schema.name === watch("schema")) // Filter by selected schema
											.flatMap((schema) =>
												schema.entityTypeNames?.map((entityType) => (
													<SelectItem
														key={"${schema.name}-${entityType}"}
														value={entityType}
													>
														<span className="inline-flex items-center gap-2">
															{entityType}
														</span>
													</SelectItem>
												)),
											)}
									</SelectContent>
								</Select>
							</div>
						</>
					) : null}
					<div className="col-span-12"></div>
					<div className="col-span-12">
						<div className="group/button relative inline-block">
							<span className="absolute inset-1 group-hover/button:inset-0 rounded-lg bg-linear-to-r from-pink-500 via-fuchsia-600 opacity-75 group-hover/button:opacity-100 to-purple-500 blur-sm transition-all"></span>
							<Button
								type="submit"
								variant="default"
								className="px-6! flex gap-2 items-center cursor-pointer relative"
							>
								<Icon icon="running-man" className="size-4" />
								<span>{t("app.settings.executeRequest")}</span>
							</Button>
						</div>
					</div>
				</form>
			</div>

			{/* Right Side - Visualized response */}
			<div className="flex flex-col flex-1 h-svh p-2 overflow-hidden">
				<JSONViewer
					json={responseData}
					className="h-full overflow-y-scroll no-scrollbar"
				/>

				{pageInfos?.totalPages > 1 && (
					<div className="flex w-full items-center justify-between mt-2">
						<Button
							variant="ghost"
							size="default"
							className="text-primary"
							onClick={() => pagination("previous")}
							disabled={pageInfos.currentPage <= 1}
						>
							<Icon icon="caret-left" className="size-4" />
							{t("app.pagination.previous")}
						</Button>
						<span className="text-sm">
							{t("app.pagination.pageXOfY", {
								x: pageInfos.currentPage,
								y: pageInfos.totalPages,
							})}
						</span>
						<Button
							variant="ghost"
							size="default"
							className="text-primary"
							onClick={() => pagination("next")}
							disabled={pageInfos.currentPage >= pageInfos.totalPages}
						>
							{t("app.pagination.next")}
							<Icon icon="caret-right" className="size-4" />
						</Button>
					</div>
				)}
			</div>
		</div>
	);
}

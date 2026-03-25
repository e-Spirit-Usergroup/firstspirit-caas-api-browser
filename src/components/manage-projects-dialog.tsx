import { Description } from "@radix-ui/react-dialog";
import { MoreHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { SaveSelectedProjectsToJson } from "@/lib/config";
import { useCaaSConfigStore } from "@/stores/caas-config-store";
import type { ProjectConfig } from "@/types/configuration";
import { stageOptionTexts, stageTypes } from "@/types/stage";
import Icon from "./icons/icon";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "./ui/alert-dialog";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Input } from "./ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "./ui/table";

type ManageProjectsDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onAddNewProjectClick: () => void;
};

type ProjectRow = {
	customerName: string;
	stage: (typeof stageTypes)[number];
	projectName: string;
	project: ProjectConfig;
};

function ManageProjectsDialog({
	open,
	onOpenChange,
	onAddNewProjectClick,
}: ManageProjectsDialogProps) {
	const { t } = useTranslation();
	const { customers, removeProject } = useCaaSConfigStore();
	const [selectedProjectKeys, setSelectedProjectKeys] = useState<Set<string>>(
		new Set(),
	);
	const [projectPendingDeletion, setProjectPendingDeletion] =
		useState<ProjectRow | null>(null);
	const [isBulkDeleteAlertOpen, setIsBulkDeleteAlertOpen] = useState(false);
	const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
	const [exportPassword, setExportPassword] = useState("");
	const [isExporting, setIsExporting] = useState(false);

	const projects = useMemo(
		() =>
			customers.flatMap((customer) =>
				stageTypes.flatMap((stage) =>
					customer.stages[stage].map((project) => ({
						customerName: customer.customerName,
						stage,
						projectName: project.projectName,
						project,
					})),
				),
			),
		[customers],
	);

	const sortedProjects = useMemo(
		() =>
			[...projects].sort((left, right) => {
				const customerCompare = left.customerName.localeCompare(
					right.customerName,
					undefined,
					{ sensitivity: "base" },
				);
				if (customerCompare !== 0) {
					return customerCompare;
				}

				const stageCompare =
					stageTypes.indexOf(left.stage) - stageTypes.indexOf(right.stage);
				if (stageCompare !== 0) {
					return stageCompare;
				}

				return left.projectName.localeCompare(right.projectName, undefined, {
					sensitivity: "base",
				});
			}),
		[projects],
	);

	const selectedProjects = useMemo(
		() =>
			sortedProjects.filter((project) =>
				selectedProjectKeys.has(
					`${project.customerName}::${project.stage}::${project.projectName}`,
				),
			),
		[sortedProjects, selectedProjectKeys],
	);
	const allProjectKeys = useMemo(
		() =>
			sortedProjects.map(
				(project) =>
					`${project.customerName}::${project.stage}::${project.projectName}`,
			),
		[sortedProjects],
	);
	const isAllProjectsSelected =
		allProjectKeys.length > 0 &&
		allProjectKeys.every((projectKey) => selectedProjectKeys.has(projectKey));
	const isSomeProjectsSelected =
		!isAllProjectsSelected && selectedProjectKeys.size > 0;

	const toggleProjectSelection = (project: ProjectRow, checked: boolean) => {
		const key = `${project.customerName}::${project.stage}::${project.projectName}`;
		setSelectedProjectKeys((previous) => {
			const next = new Set(previous);
			if (checked) {
				next.add(key);
			} else {
				next.delete(key);
			}
			return next;
		});
	};
	const toggleAllProjectsSelection = (checked: boolean) => {
		if (checked) {
			setSelectedProjectKeys(new Set(allProjectKeys));
			return;
		}
		setSelectedProjectKeys(new Set());
	};

	const deleteSingleProject = () => {
		if (!projectPendingDeletion) {
			return;
		}
		removeProject(projectPendingDeletion);
		const key = `${projectPendingDeletion.customerName}::${projectPendingDeletion.stage}::${projectPendingDeletion.projectName}`;
		setSelectedProjectKeys((previous) => {
			const next = new Set(previous);
			next.delete(key);
			return next;
		});
		setProjectPendingDeletion(null);
	};

	const deleteSelectedProjects = () => {
		selectedProjects.forEach((project) => {
			removeProject(project);
		});
		setSelectedProjectKeys(new Set());
		setIsBulkDeleteAlertOpen(false);
	};

	const exportSelectedProjects = async () => {
		if (!exportPassword.trim()) {
			return;
		}

		const customerMap = new Map<
			string,
			Record<(typeof stageTypes)[number], ProjectConfig[]>
		>();
		for (const project of selectedProjects) {
			const stages = customerMap.get(project.customerName) ?? {
				dev: [],
				qa: [],
				prod: [],
			};
			stages[project.stage].push(project.project);
			customerMap.set(project.customerName, stages);
		}

		const customersForExport = Array.from(customerMap.entries()).map(
			([customerName, stages]) => ({
				customerName,
				stages,
			}),
		);

		try {
			setIsExporting(true);
			await SaveSelectedProjectsToJson(
				{
					customers: customersForExport,
				},
				exportPassword,
			);
			setExportPassword("");
			setIsExportDialogOpen(false);
		} catch {
			toast.error(t("app.settings.manageProjects.exportEncryptionFailed"));
		} finally {
			setIsExporting(false);
		}
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(nextOpen) => {
				onOpenChange(nextOpen);
				if (!nextOpen) {
					setSelectedProjectKeys(new Set());
				}
			}}
		>
			<DialogContent className="sm:max-w-4xl w-[95vw]">
				<DialogHeader>
					<DialogTitle>{t("app.settings.manageProjects.title")}</DialogTitle>
				</DialogHeader>
				<Description className="text-sm mt-0">
					{t("app.settings.manageProjects.subtitle")}
				</Description>
				<div className="flex items-center justify-end">
					<Button asChild>
						<a href="/setup" onClick={onAddNewProjectClick}>
							<Icon icon="plus" className="size-4" />
							{t("app.settings.dialog.addProject")}
						</a>
					</Button>
				</div>
				<div className="rounded-md border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="w-10">
									<Checkbox
										checked={
											isAllProjectsSelected
												? true
												: isSomeProjectsSelected
													? "indeterminate"
													: false
										}
										onCheckedChange={(checked: boolean | "indeterminate") =>
											toggleAllProjectsSelection(checked === true)
										}
										aria-label="Select all projects"
									/>
								</TableHead>
								<TableHead>{t("app.form.customer")}</TableHead>
								<TableHead>{t("app.form.stage")}</TableHead>
								<TableHead>{t("app.form.project")}</TableHead>
								<TableHead className="text-right">
									{t("app.settings.manageProjects.actions")}
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{sortedProjects.length ? (
								sortedProjects.map((project) => (
									<TableRow
										key={`${project.customerName}-${project.stage}-${project.projectName}`}
									>
										<TableCell>
											<Checkbox
												checked={selectedProjectKeys.has(
													`${project.customerName}::${project.stage}::${project.projectName}`,
												)}
												onCheckedChange={(checked: boolean | "indeterminate") =>
													toggleProjectSelection(project, checked === true)
												}
												aria-label={t(
													"app.settings.manageProjects.selectProject",
													{
														projectName: project.projectName,
													},
												)}
											/>
										</TableCell>
										<TableCell>{project.customerName}</TableCell>
										<TableCell>{stageOptionTexts[project.stage]}</TableCell>
										<TableCell>{project.projectName}</TableCell>
										<TableCell className="text-right">
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button
														type="button"
														variant="ghost"
														size="icon"
														aria-label={t(
															"app.settings.manageProjects.actions",
														)}
													>
														<MoreHorizontal className="size-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuItem disabled>
														{t("app.settings.manageProjects.updateProject")}
													</DropdownMenuItem>
													<DropdownMenuItem
														className="text-destructive focus:text-destructive"
														onClick={() => setProjectPendingDeletion(project)}
													>
														{t("app.settings.manageProjects.removeProject")}
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</TableCell>
									</TableRow>
								))
							) : (
								<TableRow>
									<TableCell
										colSpan={5}
										className="text-center text-muted-foreground"
									>
										{t("app.settings.manageProjects.emptyState")}
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>
				<div className="flex items-center justify-start">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								type="button"
								variant="outline"
								disabled={selectedProjects.length === 0}
							>
								{t("app.settings.manageProjects.actions")}
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="start">
							<DropdownMenuItem onClick={() => setIsExportDialogOpen(true)}>
								{t("app.settings.manageProjects.exportSelected")}
							</DropdownMenuItem>
							<DropdownMenuItem
								className="text-destructive focus:text-destructive"
								onClick={() => setIsBulkDeleteAlertOpen(true)}
							>
								{t("app.settings.manageProjects.deleteSelected")}
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</DialogContent>
			<AlertDialog
				open={isExportDialogOpen}
				onOpenChange={(nextOpen: boolean) => {
					setIsExportDialogOpen(nextOpen);
					if (!nextOpen) {
						setExportPassword("");
					}
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{t("app.settings.manageProjects.exportEncryptionTitle")}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{t("app.settings.manageProjects.exportEncryptionDescription")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<Input
						type="password"
						value={exportPassword}
						onChange={(event) => setExportPassword(event.target.value)}
						placeholder={t(
							"app.settings.manageProjects.exportPasswordPlaceholder",
						)}
					/>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isExporting}>
							{t("app.settings.manageProjects.cancel")}
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={(event) => {
								event.preventDefault();
								void exportSelectedProjects();
							}}
							disabled={!exportPassword.trim() || isExporting}
						>
							{t("app.settings.manageProjects.exportConfirm")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
			<AlertDialog
				open={projectPendingDeletion !== null}
				onOpenChange={(nextOpen: boolean) => {
					if (!nextOpen) {
						setProjectPendingDeletion(null);
					}
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{t("app.settings.manageProjects.removeProject")}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{projectPendingDeletion
								? t("app.settings.manageProjects.confirmRemove", {
										customerName: projectPendingDeletion.customerName,
										projectName: projectPendingDeletion.projectName,
										stage: stageOptionTexts[projectPendingDeletion.stage],
									})
								: ""}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>
							{t("app.settings.manageProjects.cancel")}
						</AlertDialogCancel>
						<AlertDialogAction
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
							onClick={deleteSingleProject}
						>
							{t("app.settings.manageProjects.confirm")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
			<AlertDialog
				open={isBulkDeleteAlertOpen}
				onOpenChange={setIsBulkDeleteAlertOpen}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{t("app.settings.manageProjects.deleteSelected")}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{t("app.settings.manageProjects.confirmRemoveSelected", {
								count: selectedProjects.length,
							})}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>
							{t("app.settings.manageProjects.cancel")}
						</AlertDialogCancel>
						<AlertDialogAction
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
							onClick={deleteSelectedProjects}
						>
							{t("app.settings.manageProjects.confirm")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</Dialog>
	);
}

export default ManageProjectsDialog;

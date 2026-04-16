import { Description } from "@radix-ui/react-dialog";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { discoverSchemasAndLocales } from "@/lib/caas-discovery";
import { useCaaSConfigStore } from "@/stores/caas-config-store";
import { stageTypes } from "@/types/stage";
import Icon from "./icons/icon";
import {
	BulkDeleteDialog,
	DeleteProjectDialog,
	ExportProjectsDialog,
} from "./project-action-dialogs";
import type { ProjectRow } from "./projects-table";
import { ProjectsTable, getProjectKey } from "./projects-table";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "./ui/dropdown-menu";

type ManageProjectsDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onAddNewProjectClick: () => void;
};

function ManageProjectsDialog({
	open,
	onOpenChange,
	onAddNewProjectClick,
}: ManageProjectsDialogProps) {
	const { t } = useTranslation();
	const { customers, removeProject, setProjectSchemasAndLocales } = useCaaSConfigStore();
	const [selectedProjectKeys, setSelectedProjectKeys] = useState<Set<string>>(new Set());
	const [projectPendingDeletion, setProjectPendingDeletion] = useState<ProjectRow | null>(null);
	const [isBulkDeleteAlertOpen, setIsBulkDeleteAlertOpen] = useState(false);
	const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
	const [updatingProjectKey, setUpdatingProjectKey] = useState<string | null>(null);

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
				if (customerCompare !== 0) return customerCompare;

				const stageCompare =
					stageTypes.indexOf(left.stage) - stageTypes.indexOf(right.stage);
				if (stageCompare !== 0) return stageCompare;

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
					getProjectKey(project.customerName, project.stage, project.projectName),
				),
			),
		[sortedProjects, selectedProjectKeys],
	);

	const allProjectKeys = useMemo(
		() =>
			sortedProjects.map((project) =>
				getProjectKey(project.customerName, project.stage, project.projectName),
			),
		[sortedProjects],
	);

	const isAllProjectsSelected =
		allProjectKeys.length > 0 &&
		allProjectKeys.every((key) => selectedProjectKeys.has(key));
	const isSomeProjectsSelected = !isAllProjectsSelected && selectedProjectKeys.size > 0;

	const toggleProjectSelection = (project: ProjectRow, checked: boolean) => {
		const key = getProjectKey(project.customerName, project.stage, project.projectName);
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
		setSelectedProjectKeys(checked ? new Set(allProjectKeys) : new Set());
	};

	const deleteSingleProject = () => {
		if (!projectPendingDeletion) return;
		removeProject(projectPendingDeletion);
		const key = getProjectKey(
			projectPendingDeletion.customerName,
			projectPendingDeletion.stage,
			projectPendingDeletion.projectName,
		);
		setSelectedProjectKeys((previous) => {
			const next = new Set(previous);
			next.delete(key);
			return next;
		});
		setProjectPendingDeletion(null);
	};

	const deleteSelectedProjects = () => {
		for (const project of selectedProjects) {
			removeProject(project);
		}
		setSelectedProjectKeys(new Set());
		setIsBulkDeleteAlertOpen(false);
	};

	const updateProjectMetadata = async (project: ProjectRow) => {
		const key = getProjectKey(project.customerName, project.stage, project.projectName);
		setUpdatingProjectKey(key);
		try {
			const { databaseSchemas, locales } = await discoverSchemasAndLocales({
				caasUrl: project.project.caasUrl,
				caasApiKey: project.project.caasApiKey,
			});
			if (!locales.length) {
				toast.error(t("app.settings.manageProjects.noLocalesDiscovered"));
				return;
			}
			setProjectSchemasAndLocales({
				customerName: project.customerName,
				stage: project.stage,
				projectName: project.projectName,
				databaseSchemas,
				locales,
			});
			toast.success(
				t("app.settings.manageProjects.updateSuccess", {
					projectName: project.projectName,
					schemas: databaseSchemas.length,
					entityTypes: databaseSchemas.reduce(
						(acc, schema) => acc + (schema.entityTypeNames?.length ?? 0),
						0,
					),
					locales: locales.length,
				}),
			);
		} catch {
			toast.error(t("app.settings.manageProjects.updateFailed"));
		} finally {
			setUpdatingProjectKey(null);
		}
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(nextOpen) => {
				onOpenChange(nextOpen);
				if (!nextOpen) setSelectedProjectKeys(new Set());
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
				<ProjectsTable
					projects={sortedProjects}
					selectedProjectKeys={selectedProjectKeys}
					updatingProjectKey={updatingProjectKey}
					isAllSelected={isAllProjectsSelected}
					isSomeSelected={isSomeProjectsSelected}
					onToggleAll={toggleAllProjectsSelection}
					onToggleProject={toggleProjectSelection}
					onUpdateMetadata={(project) => void updateProjectMetadata(project)}
					onDeleteProject={setProjectPendingDeletion}
				/>
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

			<DeleteProjectDialog
				project={projectPendingDeletion}
				onConfirm={deleteSingleProject}
				onOpenChange={(isOpen) => {
					if (!isOpen) setProjectPendingDeletion(null);
				}}
			/>
			<BulkDeleteDialog
				open={isBulkDeleteAlertOpen}
				count={selectedProjects.length}
				onConfirm={deleteSelectedProjects}
				onOpenChange={setIsBulkDeleteAlertOpen}
			/>
			<ExportProjectsDialog
				open={isExportDialogOpen}
				selectedProjects={selectedProjects}
				onOpenChange={setIsExportDialogOpen}
			/>
		</Dialog>
	);
}

export default ManageProjectsDialog;

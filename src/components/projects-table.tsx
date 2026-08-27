import { MoreHorizontal } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ProjectConfig } from "@/types/configuration";
import { stageOptionTexts, type stageTypes } from "@/types/stage";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "./ui/table";

export type ProjectRow = {
	customerName: string;
	stage: (typeof stageTypes)[number];
	projectName: string;
	project: ProjectConfig;
};

export const getProjectKey = (
	customerName: string,
	stage: string,
	projectName: string,
) => `${customerName}::${stage}::${projectName}`;

type ProjectsTableProps = {
	projects: ProjectRow[];
	selectedProjectKeys: Set<string>;
	updatingProjectKey: string | null;
	isAllSelected: boolean;
	isSomeSelected: boolean;
	onToggleAll: (checked: boolean) => void;
	onToggleProject: (project: ProjectRow, checked: boolean) => void;
	onUpdateMetadata: (project: ProjectRow) => void;
	onDeleteProject: (project: ProjectRow) => void;
};

function ProjectsTable({
	projects,
	selectedProjectKeys,
	updatingProjectKey,
	isAllSelected,
	isSomeSelected,
	onToggleAll,
	onToggleProject,
	onUpdateMetadata,
	onDeleteProject,
}: ProjectsTableProps) {
	const { t } = useTranslation();

	return (
		<div className="rounded-md border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="w-10">
							<Checkbox
								checked={isAllSelected}
								indeterminate={isSomeSelected && !isAllSelected}
								onCheckedChange={(checked) => onToggleAll(checked)}
								aria-label={t("app.settings.selectAllProjects")}
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
					{projects.length ? (
						projects.map((project) => {
							const key = getProjectKey(
								project.customerName,
								project.stage,
								project.projectName,
							);
							return (
								<TableRow
									key={`${project.customerName}-${project.stage}-${project.projectName}`}
								>
									<TableCell>
										<Checkbox
											checked={selectedProjectKeys.has(key)}
											onCheckedChange={(checked) =>
												onToggleProject(project, checked)
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
											<DropdownMenuTrigger
												render={
													<Button
														type="button"
														variant="ghost"
														size="icon"
														aria-label={t(
															"app.settings.manageProjects.actions",
														)}
													/>
												}
											>
												<MoreHorizontal className="size-4" />
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuItem
													onClick={() => onUpdateMetadata(project)}
													disabled={updatingProjectKey === key}
												>
													{updatingProjectKey === key
														? t("app.settings.manageProjects.updatingProject")
														: t("app.settings.manageProjects.updateProject")}
												</DropdownMenuItem>
												<DropdownMenuItem
													variant="destructive"
													onClick={() => onDeleteProject(project)}
												>
													{t("app.settings.manageProjects.removeProject")}
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</TableCell>
								</TableRow>
							);
						})
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
	);
}

export { ProjectsTable };

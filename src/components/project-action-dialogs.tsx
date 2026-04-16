import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { SaveSelectedProjectsToJson } from '@/lib/config';
import type { ProjectConfig } from '@/types/configuration';
import { stageOptionTexts, type stageTypes } from '@/types/stage';
import type { ProjectRow } from './projects-table';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from './ui/alert-dialog';
import { Input } from './ui/input';

type DeleteProjectDialogProps = {
    project: ProjectRow | null;
    onConfirm: () => void;
    onOpenChange: (open: boolean) => void;
};

function DeleteProjectDialog({
    project,
    onConfirm,
    onOpenChange,
}: DeleteProjectDialogProps) {
    const { t } = useTranslation();

    return (
        <AlertDialog
            open={project !== null}
            onOpenChange={(nextOpen: boolean) => {
                if (!nextOpen) onOpenChange(false);
            }}
        >
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        {t('app.settings.manageProjects.removeProject')}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {project
                            ? t('app.settings.manageProjects.confirmRemove', {
                                  customerName: project.customerName,
                                  projectName: project.projectName,
                                  stage: stageOptionTexts[project.stage],
                              })
                            : ''}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>
                        {t('app.settings.manageProjects.cancel')}
                    </AlertDialogCancel>
                    <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={onConfirm}
                    >
                        {t('app.settings.manageProjects.confirm')}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

type BulkDeleteDialogProps = {
    open: boolean;
    count: number;
    onConfirm: () => void;
    onOpenChange: (open: boolean) => void;
};

function BulkDeleteDialog({
    open,
    count,
    onConfirm,
    onOpenChange,
}: BulkDeleteDialogProps) {
    const { t } = useTranslation();

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        {t('app.settings.manageProjects.deleteSelected')}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {t(
                            'app.settings.manageProjects.confirmRemoveSelected',
                            { count }
                        )}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>
                        {t('app.settings.manageProjects.cancel')}
                    </AlertDialogCancel>
                    <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={onConfirm}
                    >
                        {t('app.settings.manageProjects.confirm')}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

type ExportProjectsDialogProps = {
    open: boolean;
    selectedProjects: ProjectRow[];
    onOpenChange: (open: boolean) => void;
};

function ExportProjectsDialog({
    open,
    selectedProjects,
    onOpenChange,
}: ExportProjectsDialogProps) {
    const { t } = useTranslation();
    const [exportPassword, setExportPassword] = useState('');
    const [isExporting, setIsExporting] = useState(false);

    const handleOpenChange = (nextOpen: boolean) => {
        onOpenChange(nextOpen);
        if (!nextOpen) setExportPassword('');
    };

    const exportSelectedProjects = async () => {
        if (!exportPassword.trim()) return;

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
            ([customerName, stages]) => ({ customerName, stages })
        );

        try {
            setIsExporting(true);
            await SaveSelectedProjectsToJson(
                { customers: customersForExport },
                exportPassword
            );
            setExportPassword('');
            onOpenChange(false);
        } catch {
            toast.error(
                t('app.settings.manageProjects.exportEncryptionFailed')
            );
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={handleOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        {t('app.settings.manageProjects.exportEncryptionTitle')}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {t(
                            'app.settings.manageProjects.exportEncryptionDescription'
                        )}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <Input
                    type="password"
                    value={exportPassword}
                    onChange={(event) => setExportPassword(event.target.value)}
                    placeholder={t(
                        'app.settings.manageProjects.exportPasswordPlaceholder'
                    )}
                />
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isExporting}>
                        {t('app.settings.manageProjects.cancel')}
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(event) => {
                            event.preventDefault();
                            void exportSelectedProjects();
                        }}
                        disabled={!exportPassword.trim() || isExporting}
                    >
                        {t('app.settings.manageProjects.exportConfirm')}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export { DeleteProjectDialog, BulkDeleteDialog, ExportProjectsDialog };

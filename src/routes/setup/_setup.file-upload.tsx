import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@components/ui/alert-dialog';
import { Button } from '@components/ui/button';
import { FileDropZone } from '@components/ui/file-drop-zone';
import { Input } from '@components/ui/input';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
    hasEncryptedApiKeys,
    mergeImportedCustomers,
    parseImportedConfig,
} from '@/lib/config-import';
import { useCaaSConfigStore } from '@/stores/caas-config-store';

export const Route = createFileRoute('/setup/_setup/file-upload')({
    component: RouteComponent,
});

function RouteComponent() {
    const { t } = useTranslation();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadSuccessful, setUploadSuccessful] = useState(false);
    const [isDecryptDialogOpen, setIsDecryptDialogOpen] = useState(false);
    const [decryptionPassword, setDecryptionPassword] = useState('');
    const [decryptionPasswordError, setDecryptionPasswordError] = useState('');
    const [pendingEncryptedConfig, setPendingEncryptedConfig] =
        useState<unknown>(null);
    const [isDecryptingImport, setIsDecryptingImport] = useState(false);
    const { setConfigData } = useCaaSConfigStore();
    const navigate = useNavigate();

    const handleFileSelect = (file: File) => {
        setSelectedFile(file);
        setPendingEncryptedConfig(null);
        setDecryptionPassword('');
        setDecryptionPasswordError('');
        setIsDecryptDialogOpen(false);
    };

    const applyParsedConfig = async (
        config: unknown,
        password?: string
    ): Promise<boolean> => {
        const { customers, activeSelection } = await parseImportedConfig(
            config,
            password
        );
        const store = useCaaSConfigStore.getState();
        const { merged, importedCount, duplicateCount } =
            mergeImportedCustomers(store.customers, customers);

        if (importedCount === 0) {
            toast.error(
                'No new projects imported. All imported CaaS URLs already exist.'
            );
            return false;
        }

        const nextSelection = store.activeSelection ?? activeSelection;
        setConfigData(merged, nextSelection);
        toast.success(t('setup.fileUpload.toast.configLoadedSuccessfully'));
        if (duplicateCount > 0) {
            toast.success(
                `Imported ${importedCount} project(s). Skipped ${duplicateCount} duplicate(s).`
            );
        }
        setUploadSuccessful(true);
        navigate({ to: '/app' });
        return true;
    };

    const saveConfigToStore = () => {
        const reader = new FileReader();
        reader.onload = async () => {
            try {
                const config = JSON.parse(reader.result as string);
                if (hasEncryptedApiKeys(config)) {
                    setPendingEncryptedConfig(config);
                    setIsDecryptDialogOpen(true);
                    return;
                }
                await applyParsedConfig(config);
            } catch {
                toast.error('Invalid JSON file. Please check the file format.');
            }
        };
        reader.onerror = () => {
            toast.error('Error reading the file. Please try again.');
        };
        reader.readAsText(selectedFile as Blob);
    };

    const saveEncryptedConfigToStore = async () => {
        if (!pendingEncryptedConfig || !decryptionPassword.trim()) return;

        try {
            setIsDecryptingImport(true);
            setDecryptionPasswordError('');
            const isSaved = await applyParsedConfig(
                pendingEncryptedConfig,
                decryptionPassword
            );
            if (isSaved) {
                setPendingEncryptedConfig(null);
                setDecryptionPassword('');
                setDecryptionPasswordError('');
                setIsDecryptDialogOpen(false);
            }
        } catch (error) {
            if (
                error instanceof Error &&
                error.message === 'INVALID_DECRYPTION_PASSWORD'
            ) {
                setDecryptionPasswordError(
                    t('setup.fileUpload.toast.invalidDecryptionPassword')
                );
                return;
            }
            toast.error('Invalid JSON file. Please check the file format.');
        } finally {
            setIsDecryptingImport(false);
        }
    };

    return (
        <div className="flex flex-col gap-4 w-full">
            <FileDropZone
                selectedFile={selectedFile}
                onFileSelect={handleFileSelect}
            />

            {!uploadSuccessful ? (
                <Button
                    type="button"
                    variant="default"
                    onClick={() => saveConfigToStore()}
                >
                    {t('setup.fileUpload.submitBtn')}
                </Button>
            ) : null}

            <AlertDialog
                open={isDecryptDialogOpen}
                onOpenChange={(nextOpen: boolean) => {
                    setIsDecryptDialogOpen(nextOpen);
                    if (!nextOpen) {
                        setDecryptionPassword('');
                        setDecryptionPasswordError('');
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {t('setup.fileUpload.decryptDialog.title')}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('setup.fileUpload.decryptDialog.description')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <Input
                        type="password"
                        value={decryptionPassword}
                        onChange={(event) => {
                            setDecryptionPassword(event.target.value);
                            if (decryptionPasswordError) {
                                setDecryptionPasswordError('');
                            }
                        }}
                        placeholder={t(
                            'setup.fileUpload.decryptDialog.passwordPlaceholder'
                        )}
                    />
                    {decryptionPasswordError ? (
                        <p className="text-sm text-destructive">
                            {decryptionPasswordError}
                        </p>
                    ) : null}
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDecryptingImport}>
                            {t('setup.fileUpload.decryptDialog.cancel')}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            disabled={
                                !decryptionPassword.trim() || isDecryptingImport
                            }
                            onClick={(event) => {
                                event.preventDefault();
                                void saveEncryptedConfigToStore();
                            }}
                        >
                            {t('setup.fileUpload.decryptDialog.confirm')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

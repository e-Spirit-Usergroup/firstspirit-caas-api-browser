import { useNavigate } from '@tanstack/react-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { cn } from '@/lib/tw-utils';
import { useCaaSConfigStore } from '@/stores/caas-config-store';
import Icon from './icons/icon';
import { Button } from './ui/button';

function InputFile() {
    const { t } = useTranslation();
    const [isDragOver, setIsDragOver] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadSuccessful, setUploadSuccessful] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const {
        setDatabaseSchemas,
        setLocales,
        setProjectSetupData: setProjectSettings,
    } = useCaaSConfigStore();
    const navigate = useNavigate();

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            // Check if file is JSON
            if (
                file.type === 'application/json' ||
                file.name.endsWith('.json')
            ) {
                setSelectedFile(file);
            } else {
                toast.error('Please select a JSON file');
            }
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            setSelectedFile(files[0]);
        }
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const saveConfigToStore = () => {
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const config = JSON.parse(reader.result as string);

                if (
                    // !config.databaseSchemas ||
                    !config.locales ||
                    !config.projectSettings
                ) {
                    toast.error(
                        'Invalid config file. Missing required sections: locales, or projectSettings'
                    );
                    return;
                }

                if (
                    config.databaseSchemas &&
                    (!Array.isArray(config.databaseSchemas) ||
                        !config.databaseSchemas.every(
                            (schema: {
                                name?: unknown;
                                entityTypeNames?: unknown;
                            }) =>
                                typeof schema.name === 'string' &&
                                (schema.entityTypeNames === null ||
                                    Array.isArray(schema.entityTypeNames))
                        ))
                ) {
                    toast.error('Invalid databaseSchemas format');
                    return;
                }

                if (
                    !Array.isArray(config.locales) ||
                    !config.locales.every(
                        (locale: string) => typeof locale === 'string'
                    )
                ) {
                    toast.error('Invalid locales format');
                    return;
                }

                const ps = config.projectSettings;
                const customerName =
                    typeof ps === 'object' && ps !== null && 'customerName' in ps
                        ? ps.customerName
                        : null;
                const stage =
                    typeof ps === 'object' && ps !== null && 'stage' in ps
                        ? ps.stage
                        : 'prod';
                const projectName =
                    typeof ps === 'object' && ps !== null && 'projectName' in ps
                        ? ps.projectName
                        : null;
                if (
                    typeof ps !== 'object' ||
                    ps === null ||
                    (customerName !== null && typeof customerName !== 'string') ||
                    (stage !== null &&
                        stage !== 'dev' &&
                        stage !== 'qa' &&
                        stage !== 'prod') ||
                    (projectName !== null && typeof projectName !== 'string') ||
                    (ps.caasApiKey !== null &&
                        typeof ps.caasApiKey !== 'string') ||
                    (ps.caasUrl !== null && typeof ps.caasUrl !== 'string')
                ) {
                    toast.error('Invalid projectSettings format');
                    return;
                }

                // Save to store
                setDatabaseSchemas(config.databaseSchemas);
                setLocales(config.locales);
                setProjectSettings({
                    customerName,
                    stage,
                    projectName,
                    caasApiKey: ps.caasApiKey,
                    caasUrl: ps.caasUrl,
                });

                toast.success(
                    t('setup.fileUpload.toast.configLoadedSuccessfully')
                );
                setUploadSuccessful(true);
                navigate({ to: '/app' });
            } catch {
                toast.error('Invalid JSON file. Please check the file format.');
            }
        };
        reader.onerror = () => {
            toast.error('Error reading the file. Please try again.');
        };
        reader.readAsText(selectedFile as Blob);
    };

    return (
        <div className="flex flex-col gap-4 w-full">
            {/** biome-ignore lint/a11y/noStaticElementInteractions: We need to be able to interact with this element for the file drag an drop */}
            {/** biome-ignore lint/a11y/useKeyWithClickEvents: above */}
            <div
                className={cn(
                    'w-full cursor-pointer border-2 border-dashed rounded-xl p-12 text-center flex flex-col gap-2 transition-colors',
                    isDragOver &&
                        'border-blue-500 bg-blue-100 dark:border-blue-400 dark:bg-blue-900/30',
                    !isDragOver &&
                        selectedFile &&
                        'border-green-400 bg-green-50 dark:border-green-500 dark:bg-green-900/20',
                    !isDragOver &&
                        !selectedFile &&
                        'border-blue-300 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20'
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleClick}
            >
                <div className="flex items-center justify-center w-full">
                    <Icon
                        icon={!selectedFile ? 'upload' : 'check-circle'}
                        className={cn(
                            'size-12',
                            selectedFile ? 'fill-green-500' : 'fill-blue-400'
                        )}
                    />
                </div>
                <span>
                    {selectedFile ? (
                        <>
                            <span className="text-green-600 font-medium">
                                {selectedFile.name}
                            </span>
                            <br />
                            <span className="text-sm text-gray-500">
                                {t(
                                    'setup.fileUpload.title.selectDifferentFile'
                                )}
                            </span>
                        </>
                    ) : isDragOver ? (
                        t('setup.fileUpload.dropYourConfigFile')
                    ) : (
                        <>
                            {t('setup.fileUpload.title.text')}
                            <span className="text-blue-400 underline">
                                {t('setup.fileUpload.title.browse')}
                            </span>
                        </>
                    )}
                </span>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json"
                    className="hidden"
                    onChange={handleFileSelect}
                />
            </div>

            {!uploadSuccessful ? (
                <Button
                    type="button"
                    variant="default"
                    onClick={() => saveConfigToStore()}
                >
                    {t('setup.fileUpload.submitBtn')}
                </Button>
            ) : null}
        </div>
    );
}

export default InputFile;

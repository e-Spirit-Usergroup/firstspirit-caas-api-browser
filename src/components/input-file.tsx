import { useNavigate } from '@tanstack/react-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { decryptCaasApiKey } from '@/lib/config-crypto';
import { normalizeCaasUrlForStorage } from '@/lib/caas-url';
import { cn } from '@/lib/tw-utils';
import { useCaaSConfigStore } from '@/stores/caas-config-store';
import type {
    ActiveProjectSelection,
    CustomerConfig,
    DatabaseSchema,
} from '@/types/configuration';
import { stageTypes, type StageType } from '@/types/stage';
import Icon from './icons/icon';
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
import { Button } from './ui/button';
import { Input } from './ui/input';

const stageSet = new Set<StageType>(stageTypes);
const createEmptyStages = (): CustomerConfig['stages'] => ({
    dev: [],
    qa: [],
    prod: [],
});
const caasHostTenantPattern = /^(.+?)(?:-[^-]+)?-caas-api$/i;

const getTenantKeyFromCaasUrl = (caasUrl: string): string | null => {
    try {
        const normalizedUrl = normalizeCaasUrlForStorage(caasUrl);
        const hostLabel = new URL(normalizedUrl).hostname.split('.')[0]?.toLowerCase();
        if (!hostLabel) {
            return null;
        }
        const match = hostLabel.match(caasHostTenantPattern);
        return match?.[1]?.toLowerCase() ?? null;
    } catch {
        return null;
    }
};

const hasEncryptedApiKeys = (config: unknown): boolean => {
    if (!config || typeof config !== 'object' || !('customers' in config)) {
        return false;
    }
    const rawCustomers = (config as { customers?: unknown }).customers;
    if (!Array.isArray(rawCustomers)) {
        return false;
    }

    for (const rawCustomer of rawCustomers) {
        if (
            typeof rawCustomer !== 'object' ||
            rawCustomer === null ||
            typeof (rawCustomer as { stages?: unknown }).stages !== 'object' ||
            (rawCustomer as { stages?: unknown }).stages === null
        ) {
            continue;
        }
        const stages = (rawCustomer as { stages: Record<string, unknown> }).stages;
        for (const stage of stageTypes) {
            const rawProjects = stages[stage];
            if (!Array.isArray(rawProjects)) {
                continue;
            }
            for (const rawProject of rawProjects) {
                if (
                    typeof rawProject === 'object' &&
                    rawProject !== null &&
                    'encryptedCaasApiKey' in rawProject
                ) {
                    return true;
                }
            }
        }
    }

    return false;
};

function InputFile() {
    const { t } = useTranslation();
    const [isDragOver, setIsDragOver] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadSuccessful, setUploadSuccessful] = useState(false);
    const [isDecryptDialogOpen, setIsDecryptDialogOpen] = useState(false);
    const [decryptionPassword, setDecryptionPassword] = useState('');
    const [decryptionPasswordError, setDecryptionPasswordError] = useState('');
    const [pendingEncryptedConfig, setPendingEncryptedConfig] = useState<unknown>(null);
    const [isDecryptingImport, setIsDecryptingImport] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const {
        setConfigData,
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
            setPendingEncryptedConfig(null);
            setDecryptionPassword('');
            setDecryptionPasswordError('');
            setIsDecryptDialogOpen(false);
        }
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const saveParsedConfigToStore = async (
        config: unknown,
        passwordForEncryptedKeys?: string
    ): Promise<boolean> => {
        const isValidDatabaseSchemas = (value: unknown): boolean =>
            value === null ||
            (Array.isArray(value) &&
                value.every(
                    (schema: { name?: unknown; entityTypeNames?: unknown }) =>
                        typeof schema.name === 'string' &&
                        (schema.entityTypeNames === null ||
                            Array.isArray(schema.entityTypeNames))
                ));
        const isStringArray = (value: unknown): value is string[] =>
            Array.isArray(value) &&
            value.every((item) => typeof item === 'string');
        const hasAnyProject = (customers: CustomerConfig[]): boolean =>
            customers.some((customer) =>
                stageTypes.some((stage) => customer.stages[stage].length > 0)
            );

        if (!config || typeof config !== 'object' || !('customers' in config)) {
            toast.error('Invalid config format. Expected top-level customers array.');
            return false;
        }
        if (!Array.isArray(config.customers)) {
            toast.error('Invalid customers format');
            return false;
        }

        const customers: CustomerConfig[] = [];
        for (const customer of config.customers as Array<{
            customer?: unknown;
            customerName?: unknown;
            stages?: Record<string, unknown>;
        }>) {
            const customerNameValue =
                typeof customer?.customer === 'string'
                    ? customer.customer
                    : customer?.customerName;
            if (
                typeof customer !== 'object' ||
                customer === null ||
                typeof customerNameValue !== 'string' ||
                typeof customer.stages !== 'object' ||
                customer.stages === null
            ) {
                throw new Error('Invalid customer format');
            }
            const customerName = customerNameValue;
            const stages = {
                dev: [] as CustomerConfig['stages']['dev'],
                qa: [] as CustomerConfig['stages']['qa'],
                prod: [] as CustomerConfig['stages']['prod'],
            };

            for (const stage of stageTypes) {
                const rawProjects = customer.stages?.[stage];
                if (rawProjects === undefined) {
                    continue;
                }
                if (!Array.isArray(rawProjects)) {
                    throw new Error(`Invalid projects for stage "${stage}"`);
                }

                for (const project of rawProjects) {
                    if (
                        typeof project !== 'object' ||
                        project === null ||
                        (!('projectName' in project) && !('project' in project)) ||
                        (!('caasUrl' in project) && !('caasApiUrl' in project)) ||
                        (!('caasApiKey' in project) && !('encryptedCaasApiKey' in project)) ||
                        !('databaseSchemas' in project) ||
                        !('locales' in project)
                    ) {
                        throw new Error('Invalid project format');
                    }
                    const typedProject = project as {
                        project?: unknown;
                        projectName?: unknown;
                        caasApiUrl?: unknown;
                        caasUrl?: unknown;
                        caasApiKey?: unknown;
                        encryptedCaasApiKey?: unknown;
                        databaseSchemas: unknown;
                        locales: unknown;
                    };
                    const projectNameValue =
                        typeof typedProject.project === 'string'
                            ? typedProject.project
                            : typedProject.projectName;
                    const caasUrlValue =
                        typeof typedProject.caasApiUrl === 'string'
                            ? typedProject.caasApiUrl
                            : typedProject.caasUrl;

                    if (
                        typeof projectNameValue !== 'string' ||
                        typeof caasUrlValue !== 'string' ||
                        !isValidDatabaseSchemas(
                            typedProject.databaseSchemas
                        ) ||
                        !isStringArray(typedProject.locales)
                    ) {
                        throw new Error('Invalid project payload');
                    }

                    let caasApiKey: string | null = null;
                    if (typeof typedProject.caasApiKey === 'string') {
                        caasApiKey = typedProject.caasApiKey;
                    } else if (typedProject.encryptedCaasApiKey !== undefined) {
                        if (typeof typedProject.encryptedCaasApiKey !== 'string') {
                            throw new Error('Invalid project payload');
                        }
                        if (!passwordForEncryptedKeys?.trim()) {
                            throw new Error('ENCRYPTED_PASSWORD_REQUIRED');
                        }
                        try {
                            caasApiKey = await decryptCaasApiKey(
                                typedProject.encryptedCaasApiKey,
                                passwordForEncryptedKeys
                            );
                        } catch {
                            throw new Error('INVALID_DECRYPTION_PASSWORD');
                        }
                    }

                    if (typeof caasApiKey !== 'string') {
                        throw new Error('Invalid project payload');
                    }

                    stages[stage].push({
                        customerName,
                        stage,
                        projectName: projectNameValue,
                        caasUrl: caasUrlValue,
                        caasApiKey,
                        databaseSchemas:
                            typedProject.databaseSchemas as DatabaseSchema[] | null,
                        locales: typedProject.locales,
                    });
                }
            }

            customers.push({
                customerName,
                stages,
            });
        }

        if (!hasAnyProject(customers)) {
            toast.error('Config must contain at least one project');
            return false;
        }

        const rawSelection =
            config && typeof config === 'object' && 'activeSelection' in config
                ? config.activeSelection
                : null;
        let activeSelection: ActiveProjectSelection | null = null;
        if (rawSelection !== null) {
            if (
                typeof rawSelection !== 'object' ||
                rawSelection === null ||
                typeof (rawSelection as { customerName?: unknown }).customerName !==
                    'string' ||
                typeof (rawSelection as { stage?: unknown }).stage !== 'string' ||
                !stageSet.has((rawSelection as { stage: StageType }).stage) ||
                typeof (rawSelection as { projectName?: unknown }).projectName !==
                    'string'
            ) {
                toast.error('Invalid activeSelection format');
                return false;
            }
            activeSelection = {
                customerName: (rawSelection as { customerName: string }).customerName,
                stage: (rawSelection as { stage: StageType }).stage,
                projectName: (rawSelection as { projectName: string }).projectName,
            };
        }

        const store = useCaaSConfigStore.getState();
        const mergedCustomers = store.customers.map((customer) => ({
            ...customer,
            stages: {
                dev: [...customer.stages.dev],
                qa: [...customer.stages.qa],
                prod: [...customer.stages.prod],
            },
        }));
        const knownUrls = new Set(
            mergedCustomers.flatMap((customer) =>
                stageTypes.flatMap((stage) =>
                    customer.stages[stage].map((project) =>
                        normalizeCaasUrlForStorage(project.caasUrl)
                    )
                )
            )
        );
        const customerMap = new Map(
            mergedCustomers.map((customer) => [customer.customerName, customer])
        );
        const customerMapByLowerName = new Map(
            mergedCustomers.map((customer) => [customer.customerName.toLowerCase(), customer])
        );
        const customerMapByTenant = new Map<string, CustomerConfig>();
        for (const customer of mergedCustomers) {
            for (const stage of stageTypes) {
                for (const project of customer.stages[stage]) {
                    const tenantKey = getTenantKeyFromCaasUrl(project.caasUrl);
                    if (tenantKey && !customerMapByTenant.has(tenantKey)) {
                        customerMapByTenant.set(tenantKey, customer);
                    }
                }
            }
        }

        let importedCount = 0;
        let duplicateCount = 0;

        for (const importedCustomer of customers) {
            for (const stage of stageTypes) {
                for (const project of importedCustomer.stages[stage]) {
                    const normalizedUrl = normalizeCaasUrlForStorage(project.caasUrl);
                    if (knownUrls.has(normalizedUrl)) {
                        duplicateCount += 1;
                        continue;
                    }

                    const tenantKey = getTenantKeyFromCaasUrl(normalizedUrl);
                    let customer =
                        (tenantKey ? customerMapByTenant.get(tenantKey) : undefined) ??
                        customerMapByLowerName.get(importedCustomer.customerName.toLowerCase()) ??
                        customerMap.get(importedCustomer.customerName);
                    if (!customer) {
                        customer = {
                            customerName: importedCustomer.customerName,
                            stages: createEmptyStages(),
                        };
                        customerMap.set(importedCustomer.customerName, customer);
                        customerMapByLowerName.set(
                            importedCustomer.customerName.toLowerCase(),
                            customer
                        );
                        mergedCustomers.push(customer);
                    }
                    if (tenantKey && !customerMapByTenant.has(tenantKey)) {
                        customerMapByTenant.set(tenantKey, customer);
                    }

                    customer.stages[stage].push({
                        ...project,
                        customerName: customer.customerName,
                        stage,
                        caasUrl: normalizedUrl,
                    });
                    knownUrls.add(normalizedUrl);
                    importedCount += 1;
                }
            }
        }

        if (importedCount === 0) {
            toast.error('No new projects imported. All imported CaaS URLs already exist.');
            return false;
        }

        const nextSelection = store.activeSelection ?? activeSelection;
        setConfigData(mergedCustomers, nextSelection);

        toast.success(
            t('setup.fileUpload.toast.configLoadedSuccessfully')
        );
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
                await saveParsedConfigToStore(config);
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
        if (!pendingEncryptedConfig || !decryptionPassword.trim()) {
            return;
        }

        try {
            setIsDecryptingImport(true);
            setDecryptionPasswordError('');
            const isSaved = await saveParsedConfigToStore(
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
                        placeholder={t('setup.fileUpload.decryptDialog.passwordPlaceholder')}
                    />
                    {decryptionPasswordError ? (
                        <p className="text-sm text-destructive">{decryptionPasswordError}</p>
                    ) : null}
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDecryptingImport}>
                            {t('setup.fileUpload.decryptDialog.cancel')}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            disabled={!decryptionPassword.trim() || isDecryptingImport}
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

export default InputFile;

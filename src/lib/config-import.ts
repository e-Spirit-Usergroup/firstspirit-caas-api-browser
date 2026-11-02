import { decryptCaasApiKey } from '@/lib/config-crypto';
import { normalizeCaasApiKeys } from '@/lib/caas-api-keys';
import { normalizeCaasUrlForStorage } from '@/lib/caas-url';
import type {
    ActiveProjectSelection,
    CaasApiKeys,
    CustomerConfig,
    DatabaseSchema,
} from '@/types/configuration';
import { modeTypes } from '@/types/mode';
import { migrateV1Config } from '@/stores/caas-config-store';
import { stageTypes, type StageType } from '@/types/stage';

const stageSet = new Set<StageType>(stageTypes);
const caasHostTenantPattern = /^(.+?)(?:-[^-]+)?-caas-api$/i;

const createEmptyStages = (): CustomerConfig['stages'] => ({
    dev: [],
    qa: [],
    prod: [],
});

export function hasEncryptedApiKeys(config: unknown): boolean {
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
                    ('encryptedCaasApiKey' in rawProject ||
                        'encryptedCaasApiKeys' in rawProject)
                ) {
                    return true;
                }
            }
        }
    }

    return false;
}

export function getTenantKeyFromCaasUrl(caasUrl: string): string | null {
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
}

const isValidDatabaseSchemas = (value: unknown): boolean =>
    value === null ||
    (Array.isArray(value) &&
        value.every(
            (schema: { name?: unknown; entityTypeNames?: unknown }) =>
                typeof schema.name === 'string' &&
                (schema.entityTypeNames === null || Array.isArray(schema.entityTypeNames))
        ));

const isStringArray = (value: unknown): value is string[] =>
    Array.isArray(value) && value.every((item) => typeof item === 'string');

const isApiKeyMap = (value: unknown): value is CaasApiKeys =>
    typeof value === 'object' &&
    value !== null &&
    modeTypes.every((mode) => {
        const key = (value as Record<string, unknown>)[mode];
        return key === undefined || typeof key === 'string';
    });

const decryptApiKey = async (encrypted: string, password?: string): Promise<string> => {
    if (!password?.trim()) {
        throw new Error('ENCRYPTED_PASSWORD_REQUIRED');
    }
    try {
        return await decryptCaasApiKey(encrypted, password);
    } catch {
        throw new Error('INVALID_DECRYPTION_PASSWORD');
    }
};

// Files up to version 2 hold a single key; like the store migration, it becomes the preview key.
const parseProjectApiKeys = async (
    project: {
        caasApiKey?: unknown;
        encryptedCaasApiKey?: unknown;
        caasApiKeys?: unknown;
        encryptedCaasApiKeys?: unknown;
    },
    password?: string,
): Promise<CaasApiKeys> => {
    let keys: CaasApiKeys;
    if (project.caasApiKeys !== undefined) {
        if (!isApiKeyMap(project.caasApiKeys)) {
            throw new Error('Invalid project payload');
        }
        keys = project.caasApiKeys;
    } else if (project.encryptedCaasApiKeys !== undefined) {
        if (!isApiKeyMap(project.encryptedCaasApiKeys)) {
            throw new Error('Invalid project payload');
        }
        keys = {};
        for (const mode of modeTypes) {
            const encrypted = project.encryptedCaasApiKeys[mode];
            if (encrypted) {
                keys[mode] = await decryptApiKey(encrypted, password);
            }
        }
    } else if (typeof project.caasApiKey === 'string') {
        keys = { preview: project.caasApiKey };
    } else if (typeof project.encryptedCaasApiKey === 'string') {
        keys = { preview: await decryptApiKey(project.encryptedCaasApiKey, password) };
    } else {
        throw new Error('Invalid project payload');
    }

    const normalizedKeys = normalizeCaasApiKeys(keys);
    if (!normalizedKeys.preview && !normalizedKeys.release) {
        throw new Error('Invalid project payload');
    }
    return normalizedKeys;
};

export async function parseImportedConfig(
    config: unknown,
    password?: string,
): Promise<{ customers: CustomerConfig[]; activeSelection: ActiveProjectSelection | null }> {
    if (!config || typeof config !== 'object') {
        throw new Error('Invalid config format. Expected top-level customers array.');
    }

    const version =
        typeof (config as { version?: unknown }).version === 'number'
            ? (config as { version: number }).version
            : 0;

    if (version < 2 && !('customers' in config)) {
        const oldFileData = config as {
            projectSettings?: unknown;
            databaseSchemas?: unknown;
            locales?: unknown;
        };
        const migrated = migrateV1Config({
            projectSetupData: oldFileData.projectSettings,
            databaseSchemas: oldFileData.databaseSchemas,
            locales: oldFileData.locales,
        });
        if (!migrated.customers.length) {
            throw new Error('Config must contain at least one project');
        }
        return migrated;
    }

    if (!('customers' in config)) {
        throw new Error('Invalid config format. Expected top-level customers array.');
    }
    if (!Array.isArray((config as { customers: unknown }).customers)) {
        throw new Error('Invalid customers format');
    }

    const customers: CustomerConfig[] = [];
    for (const customer of (config as { customers: Array<{
        customer?: unknown;
        customerName?: unknown;
        stages?: Record<string, unknown>;
    }> }).customers) {
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
                    (!('caasApiKey' in project) &&
                        !('encryptedCaasApiKey' in project) &&
                        !('caasApiKeys' in project) &&
                        !('encryptedCaasApiKeys' in project)) ||
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
                    caasApiKeys?: unknown;
                    encryptedCaasApiKeys?: unknown;
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
                    !isValidDatabaseSchemas(typedProject.databaseSchemas) ||
                    !isStringArray(typedProject.locales)
                ) {
                    throw new Error('Invalid project payload');
                }

                const caasApiKeys = await parseProjectApiKeys(typedProject, password);

                stages[stage].push({
                    customerName,
                    stage,
                    projectName: projectNameValue,
                    caasUrl: caasUrlValue,
                    caasApiKeys,
                    databaseSchemas: typedProject.databaseSchemas as DatabaseSchema[] | null,
                    locales: typedProject.locales,
                });
            }
        }

        customers.push({ customerName, stages });
    }

    const hasAnyProject = customers.some((customer) =>
        stageTypes.some((stage) => customer.stages[stage].length > 0)
    );
    if (!hasAnyProject) {
        throw new Error('Config must contain at least one project');
    }

    const rawSelection =
        config && typeof config === 'object' && 'activeSelection' in config
            ? (config as { activeSelection: unknown }).activeSelection
            : null;
    let activeSelection: ActiveProjectSelection | null = null;
    if (rawSelection !== null) {
        if (
            typeof rawSelection !== 'object' ||
            rawSelection === null ||
            typeof (rawSelection as { customerName?: unknown }).customerName !== 'string' ||
            typeof (rawSelection as { stage?: unknown }).stage !== 'string' ||
            !stageSet.has((rawSelection as { stage: StageType }).stage) ||
            typeof (rawSelection as { projectName?: unknown }).projectName !== 'string'
        ) {
            throw new Error('Invalid activeSelection format');
        }
        activeSelection = {
            customerName: (rawSelection as { customerName: string }).customerName,
            stage: (rawSelection as { stage: StageType }).stage,
            projectName: (rawSelection as { projectName: string }).projectName,
        };
    }

    return { customers, activeSelection };
}

export function mergeImportedCustomers(
    existingCustomers: CustomerConfig[],
    imported: CustomerConfig[],
): { merged: CustomerConfig[]; importedCount: number; duplicateCount: number } {
    const mergedCustomers = existingCustomers.map((customer) => ({
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

    for (const importedCustomer of imported) {
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

    return { merged: mergedCustomers, importedCount, duplicateCount };
}

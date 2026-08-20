import { CustomerNameField } from '@components/entry-wizard/customer-name-field';
import {
    type Inputs,
    schema,
} from '@components/entry-wizard/setup-form.schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { WandSparklesIcon } from 'lucide-react';
import { useId, useMemo, useRef, useState } from 'react';
import { type SubmitHandler, useForm, useFormState } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import Icon from '@/components/icons/icon';
import { Button } from '@/components/ui/button';
import ConnectionStatusIcon from '@/components/ui/connection-status-icon';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { testCaaSConnection } from '@/lib/caas-connection-test';
import { discoverSchemasAndLocales } from '@/lib/caas-discovery';
import { parseMagicPasteCaasUrl, MAGIC_PASTE_PROJECT_ID_PLACEHOLDER } from '@/lib/parse-magic-paste-caas-url';
import { useCaaSConfigStore } from '@/stores/caas-config-store';
import type { ConnectionStatusType } from '@/types/connection-status';
import { stageTypes } from '@/types/stage';

export const Route = createFileRoute('/setup/_setup/wizard')({
    component: RouteComponent,
});

function resolveCustomerName(name: string, existingNames: string[]) {
    const trimmed = name.trim();
    return (
        existingNames.find(
            (existing) => existing.trim().toLowerCase() === trimmed.toLowerCase()
        ) ?? trimmed
    );
}

function RouteComponent() {
    const { upsertProjectSetupData, setProjectSchemasAndLocales, customers } =
        useCaaSConfigStore();
    const { t } = useTranslation();
    const navigate = useNavigate();

    const stageId = useId();
    const projectNameId = useId();
    const caasApiKeyId = useId();
    const caasUrlId = useId();
    const caasUrlInputRef = useRef<HTMLInputElement>(null);

    const [connectionStatus, setConnectionStatus] =
        useState<ConnectionStatusType>('untouched');
    const [isDiscoveringMetadata, setIsDiscoveringMetadata] = useState(false);

    const customerOptions = useMemo(
        () => customers.map((c) => c.customerName),
        [customers]
    );

    const { register, handleSubmit, control, setValue, watch, setError } =
        useForm<Inputs>({
            resolver: zodResolver(schema),
            defaultValues: {
                customerName: customerOptions[0] ?? '',
                stage: 'dev',
                projectName: '',
                caasApiKey: '',
                caasUrl: '',
            },
            mode: 'onChange',
        });
    const { ref: caasUrlRef, ...caasUrlRegister } = register('caasUrl');

    const onSubmit: SubmitHandler<Inputs> = async (data) => {
        const customerName = resolveCustomerName(
            data.customerName,
            customerOptions
        );
        const normalizedCustomerName = customerName.toLowerCase();
        const normalizedProjectName = data.projectName.trim().toLowerCase();
        const hasDuplicateProject = customers.some(
            (customer) =>
                customer.customerName.trim().toLowerCase() ===
                    normalizedCustomerName &&
                customer.stages[data.stage].some(
                    (project) =>
                        project.projectName.trim().toLowerCase() ===
                        normalizedProjectName
                )
        );

        if (hasDuplicateProject) {
            setError('projectName', { type: 'manual', message: 'duplicate' });
            toast.error(
                t(
                    'setup.wizardSetup.step1.form.projectName.validation.duplicate'
                )
            );
            return;
        }

        const isConnected = await testCaaSConnection(
            data.caasUrl,
            data.caasApiKey,
            setConnectionStatus,
            t
        );
        if (!isConnected) return;

        try {
            setIsDiscoveringMetadata(true);
            const { databaseSchemas, locales } =
                await discoverSchemasAndLocales({
                    caasUrl: data.caasUrl,
                    caasApiKey: data.caasApiKey,
                });

            if (!locales.length) {
                toast.error(
                    t('setup.wizardSetup.step1.form.discovery.noLocales')
                );
                setConnectionStatus('disconnected');
                return;
            }

            upsertProjectSetupData({ ...data, customerName });
            setProjectSchemasAndLocales({
                customerName,
                stage: data.stage,
                projectName: data.projectName.trim(),
                databaseSchemas,
                locales,
            });
            toast.success(
                t('setup.wizardSetup.step1.form.discovery.success', {
                    schemas: databaseSchemas.length,
                    entityTypes: databaseSchemas.reduce(
                        (acc, s) => acc + (s.entityTypeNames?.length ?? 0),
                        0
                    ),
                    locales: locales.length,
                })
            );
            navigate({ to: '/app' });
        } catch {
            toast.error(t('setup.wizardSetup.step1.form.discovery.error'));
            setConnectionStatus('disconnected');
        } finally {
            setIsDiscoveringMetadata(false);
        }
    };

    const { errors } = useFormState({ control });
    const selectedStage = watch('stage');
    const customerName = watch('customerName');
    const isFormLocked =
        connectionStatus === 'connected' || isDiscoveringMetadata;

    const onMagicPaste = async () => {
        let clipboardText = '';
        try {
            clipboardText = await navigator.clipboard.readText();
        } catch {
            toast.error(t('setup.wizardSetup.step1.form.magicPaste.clipboardError'));
            return;
        }

        const parsed = parseMagicPasteCaasUrl(clipboardText);
        if (!parsed) {
            toast.error(t('setup.wizardSetup.step1.form.magicPaste.invalidUrl'));
            return;
        }

        setValue(
            'customerName',
            resolveCustomerName(parsed.customerName, customerOptions),
            { shouldValidate: true, shouldDirty: true }
        );
        setValue('stage', parsed.stage, {
            shouldValidate: true,
            shouldDirty: true,
        });
        setValue('caasUrl', parsed.caasUrl, {
            shouldValidate: true,
            shouldDirty: true,
        });
        toast.success(t('setup.wizardSetup.step1.form.magicPaste.success'));

        const placeholderStart = parsed.caasUrl.indexOf(
            MAGIC_PASTE_PROJECT_ID_PLACEHOLDER
        );
        if (placeholderStart >= 0) {
            requestAnimationFrame(() => {
                const input = caasUrlInputRef.current;
                if (!input) {
                    return;
                }
                input.focus();
                input.setSelectionRange(
                    placeholderStart,
                    placeholderStart + MAGIC_PASTE_PROJECT_ID_PLACEHOLDER.length
                );
            });
        }
    };

    return (
        <form
            className="flex flex-col gap-4 p-4 w-full"
            onSubmit={handleSubmit(onSubmit)}
        >
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-end gap-1.5">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={onMagicPaste}
                        disabled={isFormLocked}
                    >
                        <WandSparklesIcon />
                        {t('setup.wizardSetup.step1.form.magicPaste.label')}
                    </Button>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger
                                type="button"
                                className="inline-flex"
                            >
                                <Icon
                                    icon="information-circle"
                                    className="size-5 text-blue-500"
                                />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-64">
                                <p>
                                    {t(
                                        'setup.wizardSetup.step1.form.magicPaste.tooltip'
                                    )}
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                <CustomerNameField
                    customers={customerOptions}
                    isFormLocked={isFormLocked}
                    value={customerName}
                    onValueChange={(value, shouldDirty = true) =>
                        setValue('customerName', value, {
                            shouldValidate: true,
                            shouldDirty,
                        })
                    }
                    error={
                        errors.customerName
                            ? t(
                                  `setup.wizardSetup.step1.form.customerName.validation.${errors.customerName.message}`
                              )
                            : undefined
                    }
                />
            </div>
            <input type="hidden" {...register('customerName')} />

            <FormField
                label={t('setup.wizardSetup.step1.form.stage.label')}
            >
                <RadioGroup
                    value={selectedStage}
                    onValueChange={(value: Inputs['stage']) =>
                        setValue('stage', value)
                    }
                    disabled={isFormLocked}
                    className="w-fit"
                    aria-label={t('setup.wizardSetup.step1.form.stage.label')}
                >
                    {stageTypes.map((stage) => {
                        const optionId = `${stageId}-${stage}`;
                        return (
                            <div
                                key={stage}
                                className="flex items-center gap-3"
                            >
                                <RadioGroupItem
                                    value={stage}
                                    id={optionId}
                                />
                                <Label htmlFor={optionId}>
                                    {t(
                                        `setup.wizardSetup.step1.form.stage.options.${stage}`
                                    )}
                                </Label>
                            </div>
                        );
                    })}
                </RadioGroup>
                <input type="hidden" {...register('stage')} />
            </FormField>

            <FormField
                label={t('setup.wizardSetup.step1.form.projectName.label')}
                htmlFor={projectNameId}
                error={
                    errors.projectName
                        ? t(
                              `setup.wizardSetup.step1.form.projectName.validation.${errors.projectName.message}`
                          )
                        : undefined
                }
            >
                <Input
                    type="text"
                    id={projectNameId}
                    placeholder={t(
                        'setup.wizardSetup.step1.form.projectName.placeholder'
                    )}
                    {...register('projectName')}
                    disabled={isFormLocked}
                />
            </FormField>

            <FormField
                label={t('setup.wizardSetup.step1.form.caasApiKey.label')}
                htmlFor={caasApiKeyId}
                error={
                    errors.caasApiKey
                        ? t(
                              `setup.wizardSetup.step1.form.caasApiKey.validation.${errors.caasApiKey.message}`
                          )
                        : undefined
                }
            >
                <Input
                    type="password"
                    id={caasApiKeyId}
                    placeholder={t(
                        'setup.wizardSetup.step1.form.caasApiKey.placeholder'
                    )}
                    {...register('caasApiKey')}
                    disabled={isFormLocked}
                />
            </FormField>

            <FormField
                label={t('setup.wizardSetup.step1.form.caasUrl.label')}
                htmlFor={caasUrlId}
                error={
                    errors.caasUrl
                        ? t(
                              `setup.wizardSetup.step1.form.caasUrl.validation.${errors.caasUrl.message}`
                          )
                        : undefined
                }
            >
                <Input
                    type="text"
                    id={caasUrlId}
                    placeholder={t(
                        'setup.wizardSetup.step1.form.caasUrl.placeholder'
                    )}
                    {...caasUrlRegister}
                    ref={(element) => {
                        caasUrlRef(element);
                        caasUrlInputRef.current = element;
                    }}
                    disabled={isFormLocked}
                />
            </FormField>

            {connectionStatus !== 'connected' && (
                <Button type="submit" disabled={isDiscoveringMetadata}>
                    {isDiscoveringMetadata
                        ? t('setup.wizardSetup.step1.form.discovery.inProgress')
                        : t('setup.wizardSetup.step1.form.submitBtn')}
                </Button>
            )}
            <span className="inline-flex items-center gap-2 font-semibold text-sm">
                <ConnectionStatusIcon connectionStatus={connectionStatus} />
                {`${t('setup.wizardSetup.step1.form.connectionStatus.label')}: `}
                {t(
                    `setup.wizardSetup.step1.form.connectionStatus.${connectionStatus}`
                )}
            </span>
        </form>
    );
}

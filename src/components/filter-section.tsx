import type { UseFormRegister, UseFormSetValue } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectSeparator,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { AppFormData } from '@/types/app-form';
import type { DatabaseSchema } from '@/types/configuration';
import {
    type FilterType,
    filterTypeOptionColors,
    filterTypeOptionTexts,
    type NameOrIdentifier,
    nameOrIdentifierOptionTexts,
} from '@/types/form';

type FilterSectionProps = {
    filterType: FilterType | 'none' | undefined;
    useNameOrIdentifier: NameOrIdentifier | undefined;
    schema: string | undefined;
    entityType: string | undefined;
    databaseSchemas: DatabaseSchema[] | null | undefined;
    filterSelectId: string;
    selectNameOrIdentifierId: string;
    setValue: UseFormSetValue<AppFormData>;
    register: UseFormRegister<AppFormData>;
};

function FilterSection({
    filterType,
    useNameOrIdentifier,
    schema,
    entityType,
    databaseSchemas,
    filterSelectId,
    selectNameOrIdentifierId,
    setValue,
    register,
}: FilterSectionProps) {
    const { t } = useTranslation();

    const handleFilterTypeChange = (value: FilterType | 'none') => {
        setValue('filterType', value);
        setValue('name', undefined);
        setValue('schema', undefined);
        setValue('entityType', undefined);
        setValue('identifier', undefined);
        setValue('route', undefined);
    };

    const handleNameOrIdentifierChange = (value: NameOrIdentifier) => {
        setValue('useNameOrIdentifier', value);
        setValue('name', undefined);
        setValue('identifier', undefined);
        setValue('route', undefined);
    };

    const selectedSchemaEntityTypes =
        databaseSchemas?.find((s) => s.name === schema)?.entityTypeNames ?? [];

    return (
        <>
            {/* Filter type selector */}
            <div className="col-span-12 flex flex-row gap-4">
                <Select
                    onValueChange={(value: FilterType) =>
                        handleFilterTypeChange(value as FilterType | 'none')
                    }
                    value={filterType ?? 'none'}
                >
                    <SelectTrigger
                        className="flex-initial w-46"
                        id={filterSelectId}
                    >
                        <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">
                            <span className="inline-flex items-center gap-2">
                                <span
                                    className="inline-block size-3 rounded-full"
                                    style={{ backgroundColor: 'rgba(0,0,0,0)' }}
                                />
                                {t('app.form.filterDropdown.noFilter')}
                            </span>
                        </SelectItem>
                        <SelectSeparator />
                        {(
                            Object.keys(filterTypeOptionTexts) as FilterType[]
                        ).map((type) => (
                            <SelectItem key={type} value={type}>
                                <span className="inline-flex items-center gap-2">
                                    <span
                                        className="inline-block size-3 rounded-full"
                                        style={{
                                            backgroundColor:
                                                filterTypeOptionColors[type],
                                        }}
                                    />
                                    {filterTypeOptionTexts[type]}
                                </span>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Label htmlFor={filterSelectId}>
                    {t('app.form.filterDropdown.selectFilterType')}
                </Label>
            </div>

            {/* Name / Identifier / Route selector */}
            {filterType &&
                filterType !== 'none' &&
                filterType !== 'Dataset' &&
                filterType !== 'ProjectProperties' && (
                    <div className="col-span-12 flex gap-4">
                        <Select
                            onValueChange={(value: NameOrIdentifier) =>
                                handleNameOrIdentifierChange(value)
                            }
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
                                        nameOrIdentifierOptionTexts
                                    ) as NameOrIdentifier[]
                                )
                                    .filter((type) => {
                                        if (filterType === 'PageRef')
                                            return true;
                                        return type !== 'route';
                                    })
                                    .map((type) => (
                                        <SelectItem key={type} value={type}>
                                            <span className="inline-flex items-center gap-2">
                                                <span className="inline-block size-3 rounded-full" />
                                                {
                                                    nameOrIdentifierOptionTexts[
                                                        type
                                                    ]
                                                }
                                            </span>
                                        </SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>

                        {useNameOrIdentifier === 'identifier' ? (
                            <Input
                                type="text"
                                placeholder="Identifier"
                                {...register('identifier')}
                            />
                        ) : useNameOrIdentifier === 'name' ? (
                            <Input
                                type="text"
                                placeholder="Name"
                                {...register('name')}
                            />
                        ) : useNameOrIdentifier === 'route' ? (
                            <Input
                                type="text"
                                placeholder="Route"
                                {...register('route')}
                            />
                        ) : (
                            <Label htmlFor={selectNameOrIdentifierId}>
                                {t(
                                    'app.form.filterParameterDropdown.selectFilterParameter'
                                )}
                            </Label>
                        )}
                    </div>
                )}

            {/* Dataset schema + entity type selectors */}
            {filterType === 'Dataset' && databaseSchemas?.length ? (
                <>
                    <div className="col-span-6">
                        <Select
                            onValueChange={(value) => {
                                setValue('schema', value);
                                setValue('entityType', undefined);
                            }}
                            value={schema ?? 'none'}
                        >
                            <SelectTrigger className="flex-initial">
                                <SelectValue placeholder="Select schema" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">
                                    <span className="inline-flex items-center gap-2">
                                        {t(
                                            'app.form.entityTypeDropdown.noSchemaFilter'
                                        )}
                                    </span>
                                </SelectItem>
                                <SelectSeparator />
                                {databaseSchemas.map((s) => (
                                    <SelectItem key={s.name} value={s.name}>
                                        <span className="inline-flex items-center gap-2">
                                            {s.name}
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="col-span-6">
                        <Select
                            onValueChange={(value) =>
                                setValue('entityType', value)
                            }
                            value={entityType ?? 'none'}
                            disabled={!schema || schema === 'none'}
                        >
                            <SelectTrigger className="flex-initial">
                                <SelectValue placeholder="Select entity type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">
                                    <span className="inline-flex items-center gap-2">
                                        {t(
                                            'app.form.entityTypeDropdown.noEntityTypeFilter'
                                        )}
                                    </span>
                                </SelectItem>
                                {selectedSchemaEntityTypes.length > 0 && (
                                    <SelectSeparator />
                                )}
                                {selectedSchemaEntityTypes.map((et) => (
                                    <SelectItem
                                        key={`${schema}-${et}`}
                                        value={et}
                                    >
                                        <span className="inline-flex items-center gap-2">
                                            {et}
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </>
            ) : null}
        </>
    );
}

export { FilterSection };

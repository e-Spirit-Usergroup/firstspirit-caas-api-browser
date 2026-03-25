export type FilterType =
    | 'PageRef'
    //| "Page"
    | 'Dataset'
    | 'Media'
    | 'GCAPage'
    | 'ProjectProperties';

export const filterTypeOptionTexts: Record<FilterType, string> = {
    PageRef: 'PageRef',
    //Page: "Page",
    Dataset: 'Dataset',
    Media: 'Media',
    GCAPage: 'GCAPage',
    ProjectProperties: 'ProjectSettings',
};

export const filterTypeOptionColors: Record<FilterType, string> = {
    PageRef: '#5f7da7',
    //Page: "#7b8b63",
    Dataset: '#7e6958',
    Media: '#c9b15f',
    GCAPage: '#72747f',
    ProjectProperties: '#72747f',
};

export type NameOrIdentifier = 'name' | 'identifier' | 'route';

export const nameOrIdentifierOptionTexts: Record<NameOrIdentifier, string> = {
    name: 'Name',
    identifier: 'Identifier',
    route: 'Route',
};

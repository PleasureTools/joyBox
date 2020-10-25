import { createEventDefinition } from 'ts-bus';

export const filterBySource = createEventDefinition<{ source: string }>()('filter_by_source');

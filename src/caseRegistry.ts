import caseRegistryData from './data/caseRegistry.json';

export interface CaseRef {
  id: string;
  caseName: string;
  year: number;
  areaOfLaw: string;
}

export const caseRegistry = caseRegistryData as CaseRef[];

export function getCaseRef(id: string): CaseRef | undefined {
  return caseRegistry.find((c) => c.id === id);
}

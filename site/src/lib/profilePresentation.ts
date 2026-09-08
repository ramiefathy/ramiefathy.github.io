/** Display-only projections of the structured profile and CV content. */
export function getProfileCity(location: string): string {
  return location.split(',')[0].trim();
}

export interface TimelineMilestone {
  id: string;
  year: number;
  endYear: number | null;
  title: string;
  role: string;
  tag: string;
  type: string;
}

/** Filter before sorting so presentation never reorders the source data. */
export function getTimelineRows(milestones: readonly TimelineMilestone[], types: readonly string[]) {
  return milestones
    .filter((milestone) => types.includes(milestone.type))
    .sort((a, b) => b.year - a.year || a.id.localeCompare(b.id))
    .map((milestone) => ({
      id: milestone.id,
      y: milestone.endYear === null
        ? `${milestone.year}—`
        : milestone.endYear === milestone.year
          ? String(milestone.year)
          : `${milestone.year}—${milestone.endYear}`,
      what: milestone.title,
      role: milestone.role,
      tag: milestone.tag
    }));
}

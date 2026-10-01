/** Repeated label columns indicate a side-by-side reference table, not a comparison. */
export function academyTableColumnPresentation(columns: string[], columnIndex: number) {
  const label = columns[0]?.trim().toLocaleLowerCase();
  const isLabel = columns[columnIndex]?.trim().toLocaleLowerCase() === label;
  const hasRepeatedLabel = columns.slice(1).some((column) => column.trim().toLocaleLowerCase() === label);

  return {
    isLabel,
    showCheck: !hasRepeatedLabel && columnIndex > 0,
  };
}

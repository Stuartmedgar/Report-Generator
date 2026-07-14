// Shared class-list parsing — used by CreateClass.tsx and the report writer's
// "upload a class list" flow. Surnames are always truncated to 2 letters for
// privacy (see CLAUDE.md) whether the class is set up upfront or mid-session.

export interface ParsedName {
  firstName: string;
  lastName: string;
}

export const truncateSurname = (surname: string): string => {
  if (!surname || surname.length === 0) return '';
  const truncated = surname.slice(0, 2);
  if (truncated.length === 1) return truncated.charAt(0).toUpperCase();
  return truncated.charAt(0).toUpperCase() + truncated.charAt(1).toLowerCase();
};

export function parseClassListText(text: string): ParsedName[] {
  const lines = text.trim().split('\n');
  const results: ParsedName[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (i === 0 && (line.toLowerCase().includes('first') || line.toLowerCase().includes('last'))) {
      const headers = line.toLowerCase().split(',').map(h => h.trim());
      const firstNameIndex = headers.findIndex(h => h.includes('first') || h.includes('given'));
      const lastNameIndex = headers.findIndex(h => h.includes('last') || h.includes('sur') || h.includes('family'));
      if (firstNameIndex >= 0 && lastNameIndex >= 0) {
        for (let j = 1; j < lines.length; j++) {
          const values = lines[j].split(',').map(v => v.trim());
          if (values.length >= 2 && values[firstNameIndex] && values[lastNameIndex]) {
            results.push({
              firstName: values[firstNameIndex],
              lastName: truncateSurname(values[lastNameIndex]),
            });
          }
        }
        break;
      }
    }

    const nameParts = line.split(/\s+/);
    if (nameParts.length >= 2) {
      const firstName = nameParts[0];
      const lastName = nameParts[nameParts.length - 1];
      if (firstName && lastName) {
        results.push({ firstName, lastName: truncateSurname(lastName) });
      }
    } else if (nameParts.length === 1 && nameParts[0]) {
      const singleName = nameParts[0];
      const useAsLastName = window.confirm(`Found single name "${singleName}". Use as Last Name (OK) or First Name (Cancel)?`);
      results.push({
        firstName: useAsLastName ? '' : singleName,
        lastName: useAsLastName ? truncateSurname(singleName) : '',
      });
    }
  }

  return results;
}

export const COMPETITION_CATEGORIES = [
  'World Rowing Championships',
  'World Rowing Under 19 Championships',
  'World Rowing Under 23 Championships',
  'World Rowing Cup',
  'Olympics',
  'Paralympics',
  'Continental Championships',
  'International Regattas',
]

export function yearOptions(fromYear = new Date().getFullYear(), toYear = 1990) {
  const years = []
  for (let y = fromYear; y >= toYear; y--) years.push(y)
  return years
}

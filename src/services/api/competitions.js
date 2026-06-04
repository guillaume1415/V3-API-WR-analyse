import { buildUrl, apiFetch } from './client'

export async function apiCompetitions(year, category) {
  const url = buildUrl('/competition', {
    'filter[StartDate]': `${year}-12-31T23:59:59.000Z`,
    'filter[competitionType.competitionCategory.DisplayName]': category,
    'filterOptions[StartDate]': 'lessThanEqualTo',
    include: 'competitionType,competitionType.competitionCategory,venue,venue.country',
    'sort[StartDate]': 'desc',
  })
  const payload = await apiFetch(url)
  const data = Array.isArray(payload.data) ? payload.data : []
  return data.filter((c) => String(c.StartDate || '').startsWith(String(year)))
}

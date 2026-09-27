/** Old Norse names for the days of the week, Sunday first (as JavaScript counts them). */
const days = ['Sunnudagr', 'Mánadagr', 'Týsdagr', 'Óðinsdagr', 'Þórsdagr', 'Frjádagr', 'Laugardagr']
const meanings = ["Sun's day", "Moon's day", "Týr's day", "Odin's day", "Thor's day", "Frigg's day", 'Washing day']

export function norseDayName(date: Date): { name: string; meaning: string } {
  return { name: days[date.getDay()], meaning: meanings[date.getDay()] }
}

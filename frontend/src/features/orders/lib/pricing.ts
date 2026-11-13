const unitRates: Record<string, number> = {
  'Wash & fold': 30.5,
  'Dry cleaning': 125,
  'Wash & press': 39,
  'Express wash': 90,
  Bedding: 87,
}

export function calculateOrderTotal(service: string, quantity: number) {
  return Number(((unitRates[service] ?? unitRates['Wash & fold']) * quantity).toFixed(2))
}

// According to https://byjus.com/maths/chord-of-circle/
export function chord(radius, apothem) {
  return 2 * Math.sqrt(radius**2 - apothem**2)
}

export function semichord(radius, apothem) {
  return Math.sqrt(radius**2 - apothem**2)
}
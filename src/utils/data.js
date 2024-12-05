export function makeData() {
  const data = Array.from({ length: 120 }, () => {
    const category = Math.floor(Math.random() * 10)
    let group

    const k = Math.random()
    if (k < .22) { 
      group = 0 
    } else if (k < .54) { 
      group = 1 
    } else { 
      group = 2
    }

    return { group, category }
  })

  return data
}
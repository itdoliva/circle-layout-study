import * as d3 from "d3"
import { chord, semichord } from "./geometry.js";

const ANGLE = 30

export function computeColumnIndices(nNodes, colSizes) {
  const columns = Array(colSizes.length).fill(0); // Initialize columns with 0 nodes
  
  // Start filling from the middle column and move outwards
  const middleIndex = Math.floor(colSizes.length / 2);
  let remainingNodes = nNodes;
  
  // Fill the middle column first
  const middleCapacity = Math.min(colSizes[middleIndex], remainingNodes);
  columns[middleIndex] = middleCapacity;
  remainingNodes -= middleCapacity;
  
  // Fill columns symmetrically around the middle
  for (let i = 1; i <= middleIndex && remainingNodes > 0; i++) {
      // Left column
      const leftCapacity = Math.min(colSizes[middleIndex - i], remainingNodes);
      columns[middleIndex - i] = leftCapacity;
      remainingNodes -= leftCapacity;
  
      // Right column
      if (remainingNodes > 0) {
          const rightCapacity = Math.min(colSizes[middleIndex + i], remainingNodes);
          columns[middleIndex + i] = rightCapacity;
          remainingNodes -= rightCapacity;
      }
  }

  const columnIndices = []
    
  let lastIndex = 0
  columns.forEach(n => {
    columnIndices.push(d3.range(lastIndex, lastIndex+n))
    lastIndex += n
  })
  
  return columnIndices // Output the distribution
}

export function getCircleCapacity(r, rLastCircle, padding, gapCol, gapRow) {
  // Calcs the number of nodes that fit in this circle
  let nNodesFit = 0
  const colSizes = []
  const colPositions = []
  
  // The number of gaps in the circle radius 
  // represents the number of cols in one circle side
  const nSideCols = Math.floor((r - (1.5*padding)) / gapCol)
  const colCount = 1 + nSideCols*2

  // Loop through columns to calc how many nodes they fit
  for (let i = 0; i < nSideCols + 1; i++) { // +1 for middle column
    const apothem = i * gapCol

    let colLength
    if (apothem <= rLastCircle) {
      colLength = (r + semichord(r, apothem)) - (rLastCircle + semichord(rLastCircle, apothem)) - 2*padding
    }
    else if (apothem <= (rLastCircle + padding)) {
      colLength = (r + semichord(r, apothem)) - (rLastCircle + apothem*Math.sin(ANGLE * (Math.PI / 180))) - 2*padding
    }
    else {
      colLength = chord(r, apothem) - 2*padding
    }

    const colSuits = Math.floor(colLength / gapRow) // Number of nodes the colLength suits
    
    colSizes.push(colSuits)
    colPositions.push(apothem)
    if (i > 0) {
      colSizes.splice(0, 0, colSuits)
      colPositions.splice(0, 0, -apothem)
    }

    nNodesFit += colSuits * (i > 0 ? 2 : 1) // Multiply by two for side column that exists in both circle sides
  }

  return { nNodesFit, colSizes, colPositions, colCount }
}


export function fitGapRow(group, rIdeal, padding, gapCol) {
  let gapRow = 16
  
  let rPrevCircle = 0
  let r = 40 // initRadius

  // While the group radius is smaller than the expected radius (rIdeal), keep increasing the gapRow
  while (true) {
    // For each circle in the group
    for (const idx of Array.from(group.keys()).sort()) {
      const circle = group.get(idx)
  
      // While the circle can't suit all its nodes, keep increasing the circle radius
      while (true) {
        // Calcs the number of nodes that fit in this circle
        const capacity = getCircleCapacity(r, rPrevCircle, padding, gapCol, gapRow)
        
        if (capacity.nNodesFit >= circle.nNodes) {          
          circle.iterations.push({ r, ...capacity })     
          break
        }
        
        r++
      }
  
      rPrevCircle = r
      r += padding
    }
  
    if (rPrevCircle >= rIdeal) break
    gapRow++
  }

  return gapRow
}

export function makeColumnSettings(group, rIdeal, padding, gapRow) {
  // Choose iteration with the closest radius to the ideal radius
  const rLastButOne = d3.max(group, ([_, circle]) => circle.iterations[circle.iterations.length-2]?.r || 0)
  const k = rIdeal / rLastButOne
  
  const rMax = rLastButOne * k

  padding = padding*k
  gapRow = gapRow*k

  // Make the circle settings
  const circleIndices = Array.from(group.keys()).sort()
  for (let i = 0; i < circleIndices.length; i++) {
    const idx = circleIndices[i]
    const circle = group.get(idx)
    console.log(circle)
    const prevCircle = i > 0 ? group.get(idx-1) : false

    let { r, colSizes, colPositions, colCount } = circle.iterations[circle.iterations.length - 2]

    r = r*k
  
    const yOffset = rMax - r
    
    const columnIndicesArr = computeColumnIndices(circle.nNodes, colSizes) 
    const columns = d3.range(colCount).map(j => {
      const x = colPositions[j] * k
      const y2 = semichord(r, x)

      let y1
 
      if (!prevCircle) {
        y1 = -semichord(r, x)
      }
      else if (Math.abs(x) <= prevCircle.settings.r) {
        y1 = semichord(prevCircle.settings.r, x) - (r - prevCircle.settings.r)
      }
      else if (Math.abs(x) <= prevCircle.settings.r + padding) {
        const oppositeSide = Math.abs(x)*Math.sin(ANGLE * (Math.PI / 180))
        y1 = oppositeSide - (r - oppositeSide)
      }
      else {
        y1 = -semichord(r, x)
      }

      const columnIndices = columnIndicesArr[j]
      const lengthAvailable = y2 - y1
      const lengthUsed = gapRow * (columnIndices.length - 1)
      const yOffset = (lengthAvailable - lengthUsed) / 2

      const columnNodes = columnIndices.map((idx, i) => ({
        ...circle.nodes[idx],
        y: -y2 + yOffset + gapRow*i
      }))

      return { 
        x, 
        y1: -y1 - padding, 
        y2: -y2 + padding,
        columnNodes
      }
    })

    circle.settings = {
      idx,
      r,
      yOffset,
      columns
    }
  }

  return group
}
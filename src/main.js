import * as d3 from 'd3';
import { makeData } from './utils/data.js';
import {  } from './utils/geometry.js';
import { fitGapRow, makeColumnSettings } from './utils/helpers.js';

const WIDTH = 600
const HEIGHT = 600
const PADDING = 20
const GAP_COL = 20

const rIdeal = Math.min(WIDTH, HEIGHT) * .45 // Outer circle radius

const group = d3.rollup(makeData(), nodes => ({ nodes, nNodes: nodes.length, iterations: [] }), d => d.group)

const gapRow = fitGapRow(group, rIdeal, PADDING, GAP_COL)

makeColumnSettings(group, rIdeal, PADDING, gapRow)

const svg = d3.select("#app").append("svg")
  .attr("width", WIDTH)
  .attr("height", HEIGHT)
  .style("background-color", "black")

const vis = svg.append('g')
  .attr('transform', `translate(${WIDTH/2}, ${HEIGHT/2})`)

vis.append('circle')
  .attr('fill', 'green')
  .attr('r', rIdeal)
  .style('opacity', .15)

const circles = vis.append('g')
  .attr('class', 'group')
.selectAll('g.circle')
  .data(group)
  // .data([Array.from(group.entries())[0]])
  .enter()
.append('g')
  .attr('transform', d => `translate(0, ${d[1].settings.yOffset})`)
  .attr('stroke', d => d3.schemeTableau10[d[1].settings.idx % 10])

circles.append('circle')
  .attr('r', d => d[1].settings.r)
  .attr('stroke', 'gray')
  .attr('stroke-width', 1)
  .attr('fill', 'none')

const column = circles.selectAll('g.column')
  .data(d => d[1].settings.columns)
  .enter()
.append('g')
  .attr('class', 'column')
  .attr('transform', d => `translate(${d.x}, 0)`)

column.append('line')
  .attr('y1', d => d.y1)
  .attr('y2', d => d.y2)
  .attr('opacity', .1)

column.selectAll('circle.node')
  .data(d => d.columnNodes)
  .enter()
.append('circle')
  .attr('class', 'node')
  .attr('cy', d => d.y)
  .attr('r', 2)


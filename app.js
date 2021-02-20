const WIDTH = 700;
const HEIGHT = 600;
const COLUMNS = 7;
const ROWS = 6;
const ANIMTATION_DURATION = 1000;

const columnLength = WIDTH / COLUMNS;
const rowLength = HEIGHT / ROWS;

const grid = [
  { type: "row", data: d3.range(ROWS + 1) },
  { type: "column", data: d3.range(COLUMNS + 1) },
].reduce((a, d) => {
  const dimension = d.data.map((x) => ({ type: d.type, value: x }));
  return [...a, ...dimension];
}, []);

const svg = d3.selectAll("svg").attr("width", WIDTH).attr("height", HEIGHT);

const yAxisRows = (d) => d * rowLength;
const xAxisColumns = (d) => d * columnLength;

svg
  .selectAll("line")
  .data(grid)
  .join("line")
  .attr("x1", (d) => (d.type === "row" ? 0 : xAxisColumns(d.value)))
  .attr("y1", (d) => (d.type === "row" ? yAxisRows(d.value) : 0))
  .attr("x2", (d) => (d.type === "row" ? WIDTH : xAxisColumns(d.value)))
  .attr("y2", (d) => (d.type === "row" ? yAxisRows(d.value) : HEIGHT));

const getCenter = (target, length) => target * length - length / 2;

const render = (selection, moves) => {
  selection
    .selectAll("circle")
    .data(moves, (d) => d.target)
    .join("circle")
    .attr("class", (d) => d.player)
    .attr("r", (2 / 3) * ((columnLength + rowLength) / 4))
    .attr("cx", (d) => getCenter(d.target[1], columnLength))
    .transition()
    .duration((d) => (d.target[0] / ROWS) * 1000)
    .attr("cy", (d) => getCenter(d.target[0], rowLength));
};

let allowMove = true;

const handleKeydown = (e) => {
  if (!allowMove) return;
  column = parseInt(e.key);
  if (!column | (column > COLUMNS)) return;
  allowMove = false;
  setTimeout(() => (allowMove = true), ANIMTATION_DURATION);
  move(column);
};

const moves = [];

const move = (column) => {
  const player = moves.length % 2 ? "player-2" : "player-1";
  const columnState = moves.map((d) => d.target).filter((d) => d[1] === column);
  const row = columnState.length ? d3.min(columnState, (d) => d[0]) - 1 : ROWS;
  moves.push({ player: player, target: [row, column] });
  render(svg, moves);
};

document.addEventListener("keydown", handleKeydown);

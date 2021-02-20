const WIDTH = 700;
const HEIGHT = 600;
const COLUMNS = 7;
const ROWS = 6;
const WINNING_SCORE = 4;
const ANIMTATION_DURATION = 1000;

const columnLength = WIDTH / COLUMNS;
const rowLength = HEIGHT / ROWS;
const rows = d3.range(1, ROWS + 1);
const columns = d3.range(1, COLUMNS + 1);

const lineGrid = [
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
  .data(lineGrid)
  .join("line")
  .attr("x1", (gridLine) =>
    gridLine.type === "row" ? 0 : xAxisColumns(gridLine.value)
  )
  .attr("y1", (gridLine) =>
    gridLine.type === "row" ? yAxisRows(gridLine.value) : 0
  )
  .attr("x2", (gridLine) =>
    gridLine.type === "row" ? WIDTH : xAxisColumns(gridLine.value)
  )
  .attr("y2", (gridLine) =>
    gridLine.type === "row" ? yAxisRows(gridLine.value) : HEIGHT
  );

const getCenter = (target, length) => target * length - length / 2;

const moveGroup = svg.append("g");
const winnerGroup = svg.append("g");

const renderMoves = (moves) => {
  moveGroup
    .selectAll("circle")
    .data(moves)
    .join("circle")
    .attr("class", (move) => move.player)
    .attr("r", (2 / 3) * ((columnLength + rowLength) / 4))
    .attr("cx", (move) => getCenter(move.target[1], columnLength))
    .transition()
    .duration((move) => (move.target[0] / ROWS) * 1000)
    .attr("cy", (move) => getCenter(move.target[0], rowLength));
};

const renderWin = (winner) => {
  winnerGroup
    .selectAll("circle")
    .data(winner.lane)
    .join("circle")
    .attr("class", winner.player)
    .attr("r", (2 / 3) * ((columnLength + rowLength) / 4))
    .attr("cx", (cell) => getCenter(cell[1], columnLength))
    .attr("cy", (cell) => getCenter(cell[0], rowLength))
    .transition()
    .duration(1000)
    .attr("r", (columnLength + rowLength) / 4);
};

let allowMove = true;

const handleKeydown = (e) => {
  if (!allowMove) return;
  column = parseInt(e.key);
  if (!column | (column > COLUMNS)) return;
  allowMove = false;
  move(column);
};

const moves = [];

const move = (column) => {
  const player = moves.length % 2 ? "player-2" : "player-1";
  const columnState = moves
    .map((d) => d.target)
    .filter((cell) => cell[1] === column);
  const row = columnState.length
    ? d3.min(columnState, (cell) => cell[0]) - 1
    : ROWS;
  if (row < 1) return;
  moves.push({ player, target: [row, column] });
  const moveDuration = (moves[moves.length - 1].target[0] / ROWS) * 1000;
  renderMoves(moves, moveDuration);
  const winningLane = checkForWinningLane();
  if (!winningLane) {
    setTimeout(() => (allowMove = true), moveDuration);
    return;
  }
  setTimeout(() => renderWin({ player, lane: winningLane }), moveDuration);
};

const checkForWinningLane = () => {
  const lanes = getLanes();
  for (const lane of lanes) {
    let matches = [];
    for (const cell of lane) {
      const occupier = getOccupier(cell);
      if (!occupier) {
        matches = [];
      } else if (!matches.length) {
        matches.push({ player: occupier, cell: cell });
      } else if (matches[matches.length - 1].player === occupier) {
        matches.push({ player: occupier, cell: cell });
      } else {
        matches = [];
      }
      if (matches.length === WINNING_SCORE)
        return matches.map((match) => match.cell);
    }
  }
  return false;
};

const getOccupier = (cell) => {
  const move = moves.find(
    (move) => move.target[0] === cell[0] && move.target[1] === cell[1]
  );
  if (move) return move.player;
  return undefined;
};

const getLanes = () => {
  const rowLanes = rows.map((x) => columns.map((y) => [x, y]));
  const columnLanes = columns.map((y) => rows.map((x) => [x, y]));
  const diagonalLanes = [
    ...rows.map((x) => [x, 1]),
    ...rows.map((x) => [x, COLUMNS]),
    ...columns.map((y) => [1, y]),
  ].reduce((lanes, cell) => {
    const newLanes = [];
    [
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ].forEach((steps) => {
      const lane = [];
      let nextCell = [...cell];
      while (
        nextCell[0] > 0 &&
        nextCell[0] <= ROWS &&
        nextCell[1] > 0 &&
        nextCell[1] <= COLUMNS
      ) {
        lane.push(nextCell);
        nextCell = nextCell.map((d, i) => d + steps[i]);
      }
      newLanes.push(lane);
    });
    return [...lanes, ...newLanes];
  }, []);
  return [...rowLanes, ...columnLanes, ...diagonalLanes].filter(
    (lanes) => lanes.length >= WINNING_SCORE
  );
};

document.addEventListener("keydown", handleKeydown);

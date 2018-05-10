class Game {
	constructor(gridWidth) {
		this.gridWidth = gridWidth;
		this.grid = this.makeGrid();
		this.speed = 1;
		this.handlers = {
			start: function(e) {
				let circle = game.grid.toCircle(this)
				if (e.type != "click") {
					this.classList.toggle("select");
					propagate( (n) => {draw(getHexA(circle.coords, n), "select", "toggle")}, 2, 0);
				} else {
					this.classList.toggle("base");
					propagate( (n) => {draw(getHexA(circle.coords, n), "base", "toggle")}, 2, 0);
					startGame();
				}
			}
		}
		this.setDimensions();
		this.shuffleColors();
	}

	makeGrid() {
		let newGrid = new HexGrid(this, [this.gridWidth, this.gridWidth]);
		return newGrid;
	}

	setDimensions() {
		this.width = window.innerWidth;
		this.height = window.innerHeight;
		let smallest = Math.min(this.width, this.height);
		let total_dim = 10 > (smallest / this.gridWidth) ? 10 : (smallest / this.gridWidth);
		document.documentElement.style.setProperty("--total_dim", total_dim + "px");
	}

	shuffleColors() {
		let r = String(Math.floor(Math.random() * 255));
		let g = String(Math.floor(Math.random() * 255));
		let b = String(Math.floor(Math.random() * 255));
		
		document.documentElement.style.setProperty("--r", r);
		document.documentElement.style.setProperty("--g", g);
		document.documentElement.style.setProperty("--b", b);
	}
}

class HexGrid {
	constructor(game, [height, width]) {
		this.height = height;
		this.width = width;
		this.grid = [];
		this.game = game;

		for (let y = 0; y < this.height; y++) {
			for (let x = 0; x < this.width; x++) {
				this.grid[y * this.width + x] = new Circle(this, [y, x]);
			}
		}
		this.createHtml();
	}

	circle(row, col) {
		return this.grid[row * this.width + col];
	}

	toCircle(dom) {
		let id = dom.getAttribute("id");
		let re = (id, i) => {
			return Number(/#i(\d\d\d)(\d\d\d)/.exec(id)[i]);
		}
		let row = re(id, 1);
		let col = re(id, 2);
		return this.circle(row, col);
	}

	createHtml() {
		let hexContainer = document.createElement("div");
		hexContainer.classList.add("hex-container");
		document.body.appendChild(hexContainer);

		let lineCounter = -1
		for (let circle of this.grid) {
			if (circle.row != lineCounter) {
					lineCounter++;
					var curLine = document.createElement("div");
					curLine.classList.add("row");
					let rowType = (circle.row % 2 == 0) ? "even" : "odd";
					curLine.classList.add(rowType);
					hexContainer.appendChild(curLine);
			}
			circle.dom.classList.add("circle");
			curLine.appendChild(circle.dom);
		}
	}

	setOrigin() {
		let events = ["mouseenter", "mouseleave", "click"];
		for (let circle of this.grid) {
			for (let e of events) {
				circle.dom.addEventListener(e, this.game.handlers.start);
			}
		}
	}
}

class Circle {
	constructor(grid, [row, col]) {
		this.row = row;
		this.col = col;
		this.grid = grid;
		this.dom = this.createDOM();
	}

	createDOM() {
		let newCircle = document.createElement("div");

		// Generate circle coordinate
		newCircle.classList.add("circle");
		newCircle.setAttribute("id", this.id);
		return newCircle;
	}

	get id() {
		let row_id = String(this.row).padStart(3,0);
		let col_id = String(this.col).padStart(3,0);
		let id = `#i${row_id}${col_id}`;
		return id;
	}

	get coords() {
		return [this.row, this.col];
	}

	offset(target) {
		return [target.coords[0] - this.coords[0], target.coords[1] - this.coords[1]];
	}

	radius(target) {
		let offset = this.offset(target);
		return (Math.abs(offset[0]) + Math.abs(offset[1]) / 2);
	}

	distance(target) {
		let offset = this.offset(target);
		return (Math.abs(offset[0]) + Math.abs(offset[1]) / 2);
	}

	move(dir) {
		let next_row = 0;
		let next_col = 0;
		if(dir.includes("u")) next_row -= 1;
		if(dir.includes("d")) next_row += 1;
		if(dir.includes("l")) next_col -= 2 - Math.abs(next_row);
		if(dir.includes("r")) next_col += 2 - Math.abs(next_row);
		next_row += this.row;
		next_col += this.col;
		return this.grid.circle(next_row, next_col);
	}
}

function getCoords(circle) {
	let id = circle.getAttribute("id");
	let row = Number(id.slice(1,4));
	let col = Number(id.slice(4,7));
	return [row, col];
}

function getID(coord) {
	row_id = String(coord[0]).padStart(3,0);
	col_id = String(coord[1]).padStart(3,0);
	let id = `#i${row_id}${col_id}`;
	return id;
}

function getRadius(origin, coords) {
	let offset = getOffset(origin, coords);
	return (Math.abs(offset[0]) + Math.abs(offset[1]) / 2);
}

function getDistance(origin, coords) {
	let offset = getOffset(origin, coords);
	return Math.sqrt(((offset[0]) ** 2+ ((offset[1]) / 2) ** 2));
}

function getObject(coord) {
	return document.querySelector(getID(coord));
}

function getCircle(origin, offset) {
	// takes coords, returns coords
	return [origin[0] + offset[0], origin[1] + offset[1]];
}

function getOffset(origin, coords) {
	//takes coords, returns coords
	return [coords[0] - origin[0], coords[1] - origin[1]];
}

function getLine(origin, coords, line=[]) {
	let offset = getOffset(origin, coords);
	let row_dir = (offset[0] / Math.abs(offset[0]) || 0);
	let col_dir = (offset[1] / Math.abs(offset[1]) || 1);
	let moves = [
		[origin[0] + 0, origin[1] + 2 * col_dir], //horizontal
		[origin[0] + row_dir, origin[1] + col_dir], //diagonal
		[origin[0] - row_dir, origin[1] + col_dir],
		[origin[0] + row_dir, origin[1] - col_dir]
	]
	
	let next = moves.reduce((acc, curr) => {
		return getDistance(acc, coords) > getDistance(curr, coords) ? curr : acc
	});
	if (origin[0] != coords[0] || origin[1] != coords[1]) {
		line.push(next);
		return getLine(next, coords, line);
	} else {
		return line;
	}
}

function getHexA(coords, radius) {
	let row = coords[0];
	let col = coords[1];
	let result = []
	for (r = 0; r <= radius; r++) {
		result.push([row + r, col + radius * 2 - r])
		result.push([row + r, col + r - radius * 2])
	}
	for (r = -radius; r < 0; r++) {
		result.push([row + r, col + r + radius * 2])
		result.push([row + r, col - radius * 2 - r])
	}
	for (r = -radius + 2; r < radius - 1; r += 2) {
		result.push([row + radius, col + r]);
		result.push([row - radius, col + r]);
	}
	return result;
}

function getHex(origin, target, radius) {
	let row = origin[0];
	let col = origin[1];
	let result = [];
	let offset = getOffset(origin, target);
	let t_rad = getRadius(origin, target);
	let yd = (offset[0] / Math.abs(offset[0])) || 0; //anchor line up or down
	let xd = (offset[1] / Math.abs(offset[1])) || 1; //anchor line left or right
	let slope = Math.abs(offset[0] / offset[1])
	let yr, xr;
	if (slope != 0 && slope != Infinity && (t_rad <= 7 || slope == 1)) {
		yr = [-yd, 0];
		xr = [xd, -2 * xd];
	} else if	(slope < 1 && slope > 0) {
		yr = [-yd];
		xr = [xd];
	} else if (slope > 1) {
		yr = [0];
		xr = [-2 * xd];
	} else {
		yr = [-1, 1];
		xr = [-xd, -xd]
		xd = 2 * xd
	}

	for (s = 0; s < yr.length; s++) {
		for (r = 0; r <= radius; r++) {
			result.push([row + yd * radius + yr[s] * r,
			col + xd * radius + xr[s] * r]);
		}
	}
	return result
}


function propagate(fn, max, delay, n=0) {
	if (n < max) {
		n++;
		setTimeout(() => {
			fn(n);
			propagate(fn, max, delay, n)
		}, delay);
	}
}

function draw(coords, effect, type) {
	for (c of coords) {
		let circle = document.querySelector(getID(c));
		if (circle != undefined) {
			if (type == "toggle") {
				circle.classList.toggle(effect);
			} else if (type == "add") {
				circle.classList.add(effect);
			} else {
				circle.classList.remove(effect);
			}
		}
	}
}

function shuffleColors() {
	let r = String(Math.floor(Math.random() * 255));
	let g = String(Math.floor(Math.random() * 255));
	let b = String(Math.floor(Math.random() * 255));
	let a = String(Math.round(Math.floor((Math.random() * (10 - 2 + 1) ) + 2) * 100) / 100);

	document.documentElement.style.setProperty("--r", r);
	document.documentElement.style.setProperty("--g", g);
	document.documentElement.style.setProperty("--b", b);

	document.documentElement.style.setProperty("--color", `rgba(${r}, ${g}, ${b}, ${a}`);
	document.documentElement.style.setProperty("--d_color", `rgba(${r}, ${g}, ${b}, 0.1`);
	document.documentElement.style.setProperty("--i_color", `rgba(${255 - r}, ${255 - g}, ${255 - b}, ${a}`);
}

function dblClickHandler() {
	event.preventDefault()
	propagate((n) => { draw(getHex(base, getCoords(this), n), "wave", "add") }, 100, 1)
	// draw(getLine(base,getCoords(this)), "lightning", "add")
}

function clickHandler() {
	draw(getLine(base,getCoords(this)), "lightning", "toggle");
}

function mouseHandler() {
	draw(getLine(base,getCoords(this)), "route", "toggle");
}

function baseHandler() {
	shuffleColors();
	propagate((n) => { draw(getHexA(base, n), "wave", "add") }, 100, 1)
}

function clearAnimation() {
	this.classList.remove("wave");
	this.classList.remove("lightning");
}

function generateGrid() {
	let height = window.innerHeight;
	let width = window.innerWidth;
	let total_dim = 10 > (height / 50) ? 10 : (height / 50);

	// Calculating CSS variables
	dimensions = {
		b_width: width - total_dim * 0.5,
		c_diam: total_dim * 0.8,
		c_marg: -total_dim * 0.03,
		c_padd: -total_dim * 0.03,
		c_bord: total_dim * 0.05,
		half_dim: total_dim * 0.4
	}

	// Setting CSS Variables
	for (let i of Object.keys(dimensions)) {
		let varString = "--" + i;
		let valString = String(Math.round(dimensions[i] * 1000) / 1000) + "px";
		document.documentElement.style.setProperty(varString, valString);
	}

	// Calculate grid dimensions
	let row_length = Math.floor(dimensions.b_width / (total_dim * 0.84));
	let column_length = Math.floor(height / (total_dim * 0.84));

	// Generate grid
	for (let j = 0; j < column_length; j++) {
		let newRow = document.createElement("div");
		newRow.classList.add("row");

		// Add rows to grid
		let odd = !(j % 2 == 0);
		if (odd) {
			newRow.classList.add("odd");
			var start = 1;
		} else {
			var start = 0;
		}
		document.body.appendChild(newRow);

		// Add circles to row
		for (let i = start; i < row_length * 2; i += 2) {
			let newCircle = document.createElement("div");

			// Generate circle coordinate
			let coord = "i" + String(j).padStart(3,0) + String(i).padStart(3,0);
			newCircle.classList.add("circle");
			newCircle.setAttribute("id",coord);
			newRow.appendChild(newCircle);
		}
	}
}

function redraw() {
	document.body.innerHTML = "";
	generateGrid();
	selectOrigin();
}

function startHandler(e) {
	if (e.type != "click") {
		this.classList.toggle("select");
		propagate( (n) => {draw(getHexA(getCoords(this), n), "select", "toggle")}, 2, 0);
	} else {
		base = getCoords(this);
		this.classList.toggle("base");
		propagate( (n) => {draw(getHexA(getCoords(this), n), "base", "toggle")}, 2, 0);
		startGame();
	}
}

function selectOrigin() {
	circles = document.querySelectorAll(".circle");
	for (c of circles) {
		c.addEventListener("mouseenter", startHandler);
		c.addEventListener("mouseleave", startHandler);
		c.addEventListener("click", startHandler);
	}
}

function startGame () {
	circles = document.querySelectorAll(".circle");
	for (c of circles) {
			c.removeEventListener("mouseenter", startHandler);
			c.removeEventListener("mouseleave", startHandler);
			c.removeEventListener("click", startHandler);

			if (!c.classList.contains("select")) {
				c.addEventListener("click", clickHandler);
				c.addEventListener("animationend", clearAnimation);
				c.addEventListener("dblclick", dblClickHandler);
				c.addEventListener("mouseenter", mouseHandler);
				c.addEventListener("mouseleave", mouseHandler);
			}
	}
	bases = document.querySelectorAll(".select");
	for (b of bases) {
		b.addEventListener("click", baseHandler);
	}
	shuffleColors();
}

function main() {
	redraw();
	selectOrigin();
	window.addEventListener("resize",redraw);
}

let base;
// main();

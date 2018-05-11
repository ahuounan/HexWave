class Game {
	constructor() {
		this.speed = 1;
	}	
}

Game.prototype.handlers = {
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

class HexGrid {
	constructor(game, gridRadius) {
		this.game = game;
		this.gridRadius = gridRadius;
		this.grid = [];

		this.setGrid();
		this.createHtml();
		this.setCSSColors();
		this.setCSSDimensions();
	}

	setGrid() {
		for (let y = 0; y < this.gridRadius; y++) {
			let newRow = [];
			let start = (y % 2) == 0 ? 0 : 1;
			for (let x = start; x < this.gridRadius; x += 2) {
				newRow.push(new Circle(this, [y, x]));
			}
			this.grid.push(newRow);
		}
	}

	createHtml() {
		let hexContainer = document.createElement("div");
		hexContainer.classList.add("hex-container");
		document.body.appendChild(hexContainer);

		let rowCount = 0
		for (let row of this.grid) {
			var curLine = document.createElement("div");
			curLine.classList.add("row");
			let rowType = (rowCount % 2 == 0) ? "even" : "odd";
			curLine.classList.add(rowType);
			hexContainer.appendChild(curLine);
			rowCount++;
			for (var circle of row) {
				circle.dom.classList.add("circle");
				curLine.appendChild(circle.dom);
			}
		}
	}

	setCSSColors() {
		for (let color of ["r", "g", "b"]) {
			let random = String(Math.floor(Math.random() * 155));
			document.documentElement.style.setProperty("--" + color, random);
		}
	}

	setCSSDimensions() {
		let smallest = Math.min(window.innerWidth, window.innerHeight);
		let total_dim = 10 > (smallest / this.griRadius) ? 10 : (smallest / this.gridRadius);
		document.documentElement.style.setProperty("--total_dim", total_dim + "px");
	}

	getCircle([row, col]) {
		let colAdj = (row % 2) == 0 ? 0 : 1;
		if (this.grid[row] == undefined) return undefined;
		return this.grid[row][(col - colAdj) / 2];
	}

	toCircle(dom) {
		let id = dom.getAttribute("id");
		let re = (id, i) => {
			return Number(/#i(\d\d\d)(\d\d\d)/.exec(id)[i]);
		}
		let row = re(id, 1);
		let col = re(id, 2);
		return this.getCircle([row, col]);
	}

	setOrigin() {
		let events = ["mouseenter", "mouseleave", "click"];
		for (let circle of this.grid) {
			for (let e of events) {
				circle.dom.addEventListener(e, this.game.handlers.start);
			}
		}
	}

	getRing([aRowDir, aColDir], rad, dir, seg, origin=this.origin) {
		//aRow, aCol are direction of anchor line. They can be 1 or -1
		//rad is current radius of ring
		//dir is 1 for clockwise and -1 for counterclockwise
		//seg is number of sextants to draw
		console.log(seg);
		let oCrds = origin.coords;
		let cCrds = [oCrds[0] + aRowDir * (rad - 1), oCrds[1] + aColDir * (rad - 1)];
		let offset, y, x, s, z;
		let result = [];
		//Figure out which way it should move on anchor lines
		for (let i = 0; i <= seg * (rad - 1); i++) {
			let circle = this.getCircle(cCrds);
			if (circle != undefined) {
				result.push(circle)
				circle.dom.style.background = "red";
			}

			offset = [cCrds[0] - oCrds[0], cCrds[1] - oCrds[1]];
			y = Math.abs(offset[0]) / offset[0] || 0;
			x = Math.abs(offset[1]) / offset[1] || 1;
			s = Math.abs(offset[0] / offset[1]);
			if (Math.abs(s) != 1) {
				z = (Math.abs(s) > 1) ? 0 : 1;
			} else {
				z = (1 - dir * x * y) / 2
			}
			let nextRow = z * x * dir;
			let nextCol = - y * dir - x * (1 - Math.abs(y));
			nextCol *= (nextRow == 0) ? 2 : 1
			cCrds = [cCrds[0] + nextRow, cCrds[1] + nextCol];
		}
		return result;
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

	location(origin) {
		let offset = origin.offset()
		let yLoc = Math.abs(this.row - origin.row) / (this.row - origin.row) || 0;
		let xLoc = Math.abs(this.col - origin.col) / (this.col - origin.col) || 1;
		let slope = Math.abs(this.row) / Math.abs(this.col)

		return {y: yLoc, x: xLoc, s: slope}
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

	move([row, col]) {
		col *= (row == 0) ? 2 : 1;
		return this.grid.getCircle([this.row + row, this.col + col]);
	}
}


function getRadius(origin, coords) {
	let offset = getOffset(origin, coords);
	return (Math.abs(offset[0]) + Math.abs(offset[1]) / 2);
}

function getDistance(origin, coords) {
	let offset = getOffset(origin, coords);
	return Math.sqrt(((offset[0]) ** 2+ ((offset[1]) / 2) ** 2));
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
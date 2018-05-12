class Game {
	constructor() {
		this.speed = 1;
	}

	toCircle(dom) {
		let id = dom.getAttribute("id");
		let re = (id, i) => {
			return Number(/#(\d)i(\d\d\d)(\d\d\d)/.exec(id)[i]);
		}
		let grid = re(id, 1);
		let row = re(id, 2);
		let col = re(id, 3);
		return this.grids[grid - 1].getCircle([row, col]);
	}
}


class HexGrid {
	constructor(game, gridRadius) {
		this.game = game;
		this.gridRadius = gridRadius;
		this.grid = [];
		this.origin;
		this.base = []
		this.mode;

		// Object that maps blast direction to pre-generated lists of circle rings.
		// Speeds up blast animation in-game.
		this.blastDir;

		this.setGrid();
		this.createHtml();
		this.setCSSColors();
		this.setCSSDimensions();
		this.selectMode();
	}

	// Generate grid of circles, gridRadius x gridRadius
	// Even rows numbering: 0, 2, 4, etc
	// Odd rows numbering: 1, 3, 5, etc
	setGrid() {
		for (let y = 0; y < this.gridRadius; y++) {
			let newRow = [];
			let start = (y % 2) == 0 ? 0 : 1;
			for (let x = start; x < this.gridRadius * 2; x += 2) {
				newRow.push(new Circle(this, [y, x]));
			}
			this.grid.push(newRow);
		}
	}

	// Generates HTML for circle grid
	createHtml() {
		let hexContainer = document.createElement("div");
		
		let rowCount = 0
		for (let row of this.grid) {
			let curLine = document.createElement("div");
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
		hexContainer.classList.add("hex-container");
		document.body.appendChild(hexContainer);
	}

	// Shuffles HTML grid colors by generaing randomg RGB colors
	// and sends to CSS variables
	setCSSColors() {
		for (let color of ["r", "g", "b"]) {
			let random = String(Math.floor(Math.random() * 155));
			document.documentElement.style.setProperty("--" + color, random);
		}
	}

	// Sets HTML grid circle size depending on window size
	setCSSDimensions() {
		let smallest = Math.min(window.innerWidth, window.innerHeight);
		let total_dim = 5 > (smallest / this.gridRadius) ? 5 : (smallest / this.gridRadius);
		document.documentElement.style.setProperty("--total_dim", total_dim + "px");
		document.documentElement.style.setProperty("--gridRadius", (this.gridRadius * total_dim) + "px");
	}

	// Returns Circle object at coordinates row, col in grid
	getCircle([row, col]) {
		let colAdj = (row % 2) == 0 ? 0 : 1;
		if (this.grid[row] == undefined) return undefined;
		return this.grid[row][(col - colAdj) / 2];
	}

	// Generates ring or partial ring based on origin circle
	getRing([aRowDir, aColDir], rad, dir, seg, origin=this.origin) {
		//aRow, aCol are direction of anchor line. They can be 1 or -1
		//rad is current radius of ring
		//dir is 1 for clockwise and -1 for counterclockwise
		//seg is number of sextants to draw
		let oCrds = origin.coords;

		// Current coordinate, begins at origin + radius/direction
		let cCrds = [oCrds[0] + aRowDir * (rad - 1), oCrds[1] + aColDir * (rad - 1)];

		// Declare variables needed in calculations
		let offset, y, x, s, z;

		let result = [];
		for (let i = 0; i <= seg * (rad - 1) - 1; i++) {
			let circle = this.getCircle(cCrds);
			if (circle != undefined) {
				result.push(circle);
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

	// Takes list of circles and renders and colors/animations by toggling CSS classes
	draw(list, type, cls) {
		for (let circle of list) {
			circle.dom.classList[type](cls);
		}
	}

	// Grid enters set origin state, once origin is selected, starts the game
	selectMode() {
		this.mode = "select";
		let events = ["mouseenter", "mouseleave", "click"];
		let toggleEvents = (act) => {
			for (let row of this.grid) {
				for (let circle of row) {
					for (let e of events) {
						circle[act](e);
					}
				}
			}
		};
		let action = (this.origin === undefined) ? 'addEvents' : 'removeEvents';
		toggleEvents(action);
		if (this.origin !== undefined) this.startGame();
	}

	setOrigin(target) {
		this.mode = "game";
		this.origin = target;
		for (let rad = 2; rad < 4; rad++) {
			this.base.push(this.getRing([1, 1], rad, 1, 6, this.origin));
		}
		this.startGame();
	}

	// Grid enters start game state.
	startGame() {
		this.blastDir = this.loadBlasts();
		let events = ["mouseenter", "mouseleave", "click", "dblclick", "animationend"];
		for (let row of this.grid) {
			for (let circle of row) {
				for (let e of events) {
					circle.addEvents(e);
				}
			}
		}
	}

	loadBlasts() {
		// Preload blast lists to increase speed in game
		let aRowDir = [1, 0, -1];
		let aColDir = [1, -1];
		let dir = [1, -1];
		let seg = [1, 2, 3, 4, 5, 6];
		let blastDir = {}

		for (let r of aRowDir) {
			for (let c of aColDir) {
				for (let d of dir) {
					for (let s of seg) {
						blastDir[[r, c, d, s]] = []
						for (let rad = 2; rad < grid.gridRadius; rad++) {
							blastDir[[r, c, d, s]].push(this.getRing([r, c], rad, d, s, this.origin));
						}
					}
				}
			}
		}
		return blastDir;
	}
}

class Circle {
	constructor(grid, [row, col]) {
		this.row = row;
		this.col = col;
		this.grid = grid;
		this.dom = this.createDOM();
	}

	// Creates HTML object corresponding to circle
	createDOM() {
		let newCircle = document.createElement("div");

		// Generate circle coordinate
		newCircle.classList.add("circle");
		newCircle.setAttribute("id", this.id);
		return newCircle;
	}

	// Creates ID based on circle coordinates
	get id() {
		let row_id = String(this.row).padStart(3,0);
		let col_id = String(this.col).padStart(3,0);
		let id = `#i${row_id}${col_id}`;
		return id;
	}

	get coords() {
		return [this.row, this.col];
	}

	// Calculates row/col offset from target circle
	offset(target) {
		return [target.coords[0] - this.coords[0], target.coords[1] - this.coords[1]];
	}

	// Calculates straight-line distnace from target circle
	distance(target) {
		let offset = this.offset(target);
		return Math.sqrt((offset[0] ** 2 + (offset[1] / 2) ** 2));
	}
	
	// Draws a straight-line from this circle to target. 
	lightning(target) {
		this.draw("toggle", "lightning");

		let moves = this.grid.getRing([1, 1], 2, 1, 6, this);
		let next = moves.reduce((acc, curr) => {
			return acc.distance(target) > curr.distance(target) ? curr : acc;
		});

		if (this.coords[0] != target.coords[0] || this.coords[1] != target.coords[1]) {
			next.lightning(target);
		}
	}

	draw(type, cls) {
		this.dom.classList[type](cls);
	}

	// Adds event handler to circle
	addEvents(type) {
		this.dom.addEventListener(type, this);
	}

	// Removes event handler to circle
	removeEvents(type) {
		this.dom.removeEventListener(type, this);
	}

	// Switchboard for event handlers
	handleEvent(e) {
		if(this.grid.mode == "select") {
			this.selectHandler(e);
		} else if (this.grid.mode == "game") {
			switch(e.type) {
				case 'click':
					this.clickHandler(e);
					break
				case 'dblclick':
					this.dblClickHandler(e);
					break
				case 'mouseenter':
					this.enterHandler(e);
					break
				case 'mouseleave':
					this.leaveHandler(e);
					break
				case 'animationend':
					this.clearAnimation(e);
					break
			}
		}
	}

	selectHandler(e) {
		let cls = e.type == "click" ? "base" : "select"
		this.dom.classList.toggle(cls);
		for (let i = 2; i <=3; i++) {
			this.grid.draw(this.grid.getRing([1, 1], i, 1, 6, this), "toggle", cls);
		}

		if (e.type == "click") this.grid.setOrigin(this);
	}

	clickHandler(e) {
		this.grid.origin.lightning(this);
	}

	dblClickHandler(e) {

	}

	enterHandler(e) {

	}

	leaveHandler(e) {

	}

	clearAnimation(e) {
		this.dom.classList.remove("lightning");
	}
}

let game = new Game();
let grid = new HexGrid(game, 50);
grid.selectMode();
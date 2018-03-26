// For the Graphic Object for the background
var bg;
// For the Canvas ref
var canvas;
// Graphics object for the obstacles
var obs;
// The size of the canvas
var canvasSize;

// Size of the grid in term of cells
var gridSize;
// Size of the cells in term of pixels
var cellSize;
// The grid structure
var grid;

// Boolean for checking if the bg need to be drawn (the first time)
var drawBG = true;
// Boolean for checking if the obstacles need to be redrawn (added/removed obstacles)
var drawOBS = true;
// Boolean for checking if the bg will be drawn or not
var bgToggle = true;
// Boolean for checking is the algorithm has started
var running = false;
// Boolean for checking if the algorithm has failed
var failed = false;
// If the algorthm has been executed on the page
var completed = false;
// Boolean for checking if the algorithm has started
var started = false;

// If I'm dragging the start, the end or if I'm drawing/deleting walls
var dragStart = false;
var dragEnd = false;
var deleteWalls = false;
var drawWalls = false;
// The last cell I was in to avoid deleting a wall right after creating it and viceversa
var lastWall;
// Starting position of the dragged end/pos
var oldPos = {x : undefined, y : undefined};
// Offset of the mouse when something is selected
var mouseOffX;
var mouseOffY;
// The OpenSet, managed by a min-heap
var frontiera;
// The ClosedSet, managed as an array
var esplorati;
// An array containing the obstacles
var ostacoli;
// The start cell
var start;
// The end cell
var end;
// The last cell that has been considered in the algorithm
var last;

// Current id of the button pressed that specify the speed
var lastSpeedID = "30fps";

/**
 * @description Setup function of the p5js framework.
 */
function setup() {
	canvasSize = window.innerHeight - 15;
	// Create the canvas and attach it to the div
	canvas = createCanvas(canvasSize, canvasSize)
	canvas.parent("p5Canvas");
	// Create the graphic for the bg and set it density to 1
	bg = createGraphics(canvasSize, canvasSize);
	bg.pixelDensity(1);
	
	obs = createGraphics(canvasSize,canvasSize);
	obs.pixelDensity(1);
	// Set the framerate to regulate the speed of the simulation
	frameRate(30);  
	// Number of cells in the grid
	gridSize = 30;
	// Size of one cell
	cellSize = canvas.width / gridSize;
	// Array of obstacles
	ostacoli = [];
	// Create start and End cell in Random position each time.
	start = new Cell(Math.floor((random() * gridSize)), Math.floor((random() * gridSize)));
	end = new Cell(Math.floor((random() * gridSize)), Math.floor((random() * gridSize)));
	// Initialize the grid as a 2 dimensional array and randomly generate the obstacles
	grid = initArray();
	generateWalls();
	// Initialize the open set
	frontiera = new BinaryHeap(function(cell){
        return cell.f;
	});

	esplorati = [];
	// Add the start position to the OpenSet
	frontiera.push(start);
}

/**
 * @description drawing function called each frame by the p5js framework
 */
function draw(){ 
	background(255);
	/* 
	*	Draw the Background Grid to the Graphic object bg 
	*	if it's the first time drawing on the screen.
	*/
	if (drawBG){
		bg.background(color(255));
		bg.stroke(color(0));
		bg.strokeWeight(1);
		for(var i = 1; i < gridSize; i++){
            for (var j = 1; j < gridSize; j++){
				bg.line(0, j * cellSize - 1, canvasSize, j * cellSize - 1);           
			}
			bg.line(i * cellSize - 1, 0, i * cellSize - 1, canvasSize);           
		} 
		drawBG = false;
	}
	if (drawOBS){
		/* Draw Obstacles */
		for(var i = 0; i < ostacoli.length; i++){
			obs.fill(color(30, 20, 10));
			var found = 0;
			var q = 0;
			/*
			* If a neighboor of the obstacle in the left, right, top or down position draw connection between them
			*/
			while(found < 4 && q < ostacoli[i].neighbors.length){
				var ne = ostacoli[i].neighbors[q];
				if(ne.wall){
					obs.stroke(30, 20, 10);
					obs.strokeWeight(cellSize / 2);
					obs.beginShape();
					obs.vertex(ostacoli[i].x * cellSize + cellSize / 2, ostacoli[i].y * cellSize + cellSize / 2);
					if (ne.x === ostacoli[i].x + 1 && ne.y === ostacoli[i].y){
						obs.vertex(ne.x * cellSize, ne.y * cellSize + cellSize / 2);
						found++;
					}
					if (ne.x === ostacoli[i].x - 1 && ne.y === ostacoli[i].y){
						obs.vertex(ostacoli[i].x * cellSize, ne.y * cellSize + cellSize / 2);
						found++;
					}
					if (ne.x === ostacoli[i].x && ne.y === ostacoli[i].y + 1){
						obs.vertex(ne.x * cellSize + cellSize / 2, ne.y * cellSize);
						found++;
					}
					if(ne.x === ostacoli[i].x && ne.y === ostacoli[i].y - 1){
						obs.vertex(ne.x * cellSize + cellSize / 2, ostacoli[i].y * cellSize);
						found++;
					}
					obs.endShape();
				} 
				q++;
			}
			if(found == 0){
				// If no neighboor is a wall just draw an ellipse
				obs.ellipse(ostacoli[i].x * cellSize + cellSize / 2, ostacoli[i].y * cellSize + cellSize / 2, cellSize/4);
			}
		}
		drawOBS = false;
	}
	if(bgToggle)
		image(bg, 0, 0);
	image(obs, 0, 0);
	// If the alg. have been started once
	if(started){
		var current;
		// If it's currently running execute it and retrieve the current node in the open set that have been explored
		if (running){
			current = algorithm();
			last = current;
			completed = true;
		}
		else
			current = last; 

		/* Draw OpenSet */
		for(var i = 0; i < frontiera.size(); i++)
			frontiera.content[i].drawCell(color(255, 180, 180), cellSize);
		/* Draw ClosedSet */
		for(var i = 0; i < esplorati.length; i++)
			esplorati[i].drawCell(color(125, 0, 125), cellSize);
		if(!failed){
			/* Calculate path to the current node */
			var path = [];
			var tmp = last;
			path.push(tmp);
			while(tmp.previous){
				path.push(tmp.previous);
				tmp = tmp.previous;
			}
			/* Draw The Path, different color if it's completed */
			noFill();
			if(running){
				stroke(255, 0, 255);
				document.getElementById("pathLength").textContent = path.length;
			}
			else
				stroke(255, 215, 0);
			strokeWeight(cellSize / 4);
			beginShape();
			for(var i = 0; i < path.length; i++){
				vertex(path[i].x * cellSize + cellSize / 2, path[i].y * cellSize + cellSize / 2);
			}
			endShape();
		}
	}

	// Draw the start and the end position
	start.drawCell(color(0, 125, 250), cellSize);
	end.drawCell(color(255, 0, 0), cellSize);
}

/**
 * @description The A* algorithm itself.
 */
function algorithm(){
	// If the open set is empty, the algorithm has failed;
	if(frontiera.size() > 0){
		// Get the node with the lower value of f (Potentially closer to the end)
		var current = frontiera.pop();
		// If it's the end we are done
        if(current ===  end){
			console.log("Done");
			noLoop();
			running = false;
			complete = true;
			document.getElementById("restartButton").disabled = false;
		}
		else{
			// Add the current node to the closed set and explore the neighbors adding them to the openset;
			esplorati.push(current);
			for(var i = 0; i < current.neighbors.length; i++){
				var neigh = current.neighbors[i];
				// If neigh is not explored yet and it's not a wall, but it's already in the open set calculate the new g.
				// If the new g is lower than the old one then we have found a new optimal path to g.
				// Update the g value. If it's not in the open set then we found it for the first time, update the g.
				// If it's a new path then update the h and the f of the node, then let's memorize the node from where we got there.
				if(!esplorati.includes(neigh) && !neigh.wall){  
					var tmpG = current.g + neigh.weight;
					var newPath = false;
					var oldNode = false;
					if(frontiera.content.includes(neigh)){   
						if (tmpG < neigh.g){
							frontiera.remove(neigh);
							oldNode = true;
							neigh.g = tmpG;
							newPath = true;
						}
					}else{
						neigh.g = tmpG;
						newPath = true;
						oldNode = true;
					}
					if(newPath){
						neigh.h = heuristic(neigh, end);
						neigh.f = neigh.g + neigh.h;
						neigh.previous = current;
						if(oldNode){
							frontiera.push(neigh);
						}
					}
				}
			}
		}
        
    } else{
		/**
		 * The search has failed.
		 */
		document.getElementById("restartButton").disabled = false;
		document.getElementById("pathLength").textContent = "∞";
		document.getElementById("failCase").hidden = false;
        console.log("Fail");
		running = false;
		failed = true;
		noLoop();
        return;
	}
	return current;
}
/** 
 * @description Calculate the distance between 2 given cells.
 * @param {Cell} a - the first cell.
 * @param {Cell} b - the second cell.
 * @returns The distance between the 2 cells.
 */
function heuristic(a, b){
	// manhattan distance
	return Math.abs(b.x - a.x) + Math.abs(b.y - a.y);
}

/**
 *  @description 	Initialize the 2dimension array representing the grid of cells.
 * 					Also add the neighbors for each cell.
 */
function initArray(){
    var tmp = [];
    for (i = 0; i < gridSize; i++){
        var cl = []; 
        for (j = 0; j < gridSize; j++){
			if(i == start.x && j == start.y)
				cl[j] = start;
			else if(i == end.x && j == end.y)
				cl[j] = end;
			else
				cl[j] = new Cell(i, j);
        }
        tmp[i] = cl;
    }
    for(var i = 0; i < gridSize; i++){
        for(var j = 0; j < gridSize; j++){
            tmp[i][j].addNeighbors(tmp);
        }
    }
    return tmp;
}

/**
 * @description Called if the mouse is dragged by the p5js framework.
 */
function mouseDragged(){
	// If I'm in the canvas
	if (mouseX > 0 && mouseX < canvasSize && mouseY > 0 && mouseY < canvasSize){
		// Move the start point
		if(dragStart){
			start.x = mouseX / cellSize - mouseOffX;
			start.y = mouseY / cellSize - mouseOffY;
		}
		// Move the end point
		else if(dragEnd){
			end.x = mouseX / cellSize - mouseOffX;
			end.y = mouseY / cellSize - mouseOffY;
		}
		// Delete walls and redraw
		else if(deleteWalls){
			var c = grid[Math.floor(mouseX / cellSize)][Math.floor(mouseY / cellSize)];
			if(lastWall != undefined && (c != lastWall) && c != start && c != end){
				if (c.wall){
					removeFromArray(ostacoli, c);
					c.wall = false;
				}

				lastWall = c;
				drawOBS = true;
				obs.clear();
			}
		}
		// Add walls and redraw
		else if(drawWalls){
			var c = grid[Math.floor(mouseX / cellSize)][Math.floor(mouseY / cellSize)];
			if(lastWall != undefined && (c != lastWall) && c != start && c != end){
				if(!c.wall){
					c.wall = true;
					ostacoli.push(c);
					lastWall = c;
					drawOBS = true;
					obs.clear();
				}
			}
		}
	}
}	

/**
 * @description Called if the mouse is released by the p5js framework.
 */
function mouseReleased(){
	// Place the start point in it's position, or reset if out of the canvas
	if (dragStart){
		dragStart = false;
		if(mouseX < 0 || mouseX > canvasSize || mouseY < 0 || mouseY > canvasSize){
			start.x = oldPos.x;
			start.y = oldPos.y;
		}
		else{
			start.x = Math.floor(mouseX / cellSize);
			start.y = Math.floor(mouseY / cellSize);
		}
		oldPos = {x : undefined, y : undefined};
		if(grid[start.x][start.y].wall){
			removeFromArray(ostacoli, grid[start.x][start.y]);
			grid[start.x][start.y].wall = false;
			drawOBS = true;
			obs.clear();
		}
		grid[start.x][start.y] = start;
		start.addNeighbors(grid);
		for(var i = 0; i < start.neighbors.length; i++){
			start.neighbors[i].addNeighbors(grid);
		}
		frontiera.push(start);
	}

	// Place the end point in it's position, or reset if out of the canvas
	if (dragEnd){
		dragEnd = false;
		if(mouseX < 0 || mouseX > canvasSize || mouseY < 0 || mouseY > canvasSize){
			end.x = oldPos.x;
			end.y = oldPos.y;
		}
		else{
			end.x = Math.floor(mouseX / cellSize);
			end.y = Math.floor(mouseY / cellSize);
		}
		oldPos = {x : undefined, y : undefined};
		if(grid[end.x][end.y].wall){
			removeFromArray(ostacoli, grid[end.x][end.y]);
			grid[end.x][end.y].wall = false;
			drawOBS = true;
			obs.clear();
		}
		grid[end.x][end.y] = end;
		end.addNeighbors(grid);
		for(var i = 0; i < end.neighbors.length; i++){
			end.neighbors[i].addNeighbors(grid);
		}
	}
	// redraw obstacles.
	if(deleteWalls){
		deleteWalls = false;
		drawOBS = true;
		obs.clear();
		lastWall = undefined;
	}
	if(drawWalls){
		drawWalls = false;
		drawOBS = true;
		obs.clear();
		lastWall = undefined;
			
	}
}

/**
 * @description Called if the mouse is pressed by the p5js framework.
 */
function mousePressed(){
	// Only if the alg is not running.
	if(! started){
		if(mouseX < canvasSize && mouseX > 0 && mouseY > 0 && mouseY < canvasSize){
			var c = grid[Math.floor(mouseX / cellSize)][Math.floor(mouseY / cellSize)];
			if(c === start){
				console.log("Start");
				oldPos.x = start.x; oldPos.y = start.y;
				grid[start.x][start.y] = new Cell(start.x, start.y);
				dragStart = true;
				frontiera.remove(start);
				mouseOffX = (mouseX / cellSize - c.x);
				mouseOffY = (mouseY / cellSize - c.y);
				for(var i = 0; i < c.neighbors.length; i++){
					c.neighbors[i].addNeighbors(grid);
				}
			}
			else if (c === end){
				console.log("End");
				oldPos.x = end.x; oldPos.y = end.y;
				grid[end.x][end.y] = new Cell(end.x, end.y);
				mouseOffX = (mouseX / cellSize - c.x)
				mouseOffY = (mouseY / cellSize - c.y)
				dragEnd = true;
				for(var i = 0; i < c.neighbors.length; i++){
					c.neighbors[i].addNeighbors(grid);
				}
			}
			else if(c.wall){
				console.log("Wall");
				deleteWalls = true;
				removeFromArray(ostacoli, c);
				c.wall = false;
				drawOBS = true;
				obs.clear();
				lastWall = c;
			}
			else{
				drawWalls = true;
				c.wall = true;
				ostacoli.push(c);
				drawOBS = true;
				obs.clear();
				lastWall = c;
			}
		}
	}
}

/**
 * @description Toggle the grid and call the draw function iin the case it's not already looping.
 */
function gridToggle(){
	bgToggle = !bgToggle;
	draw();
}

/**
 * @description Remove element el from array arr.
 * @param {Array} arr 	- The array from which the element needs to be removed.
 * @param {Object} el 	- The element that needs to be removed from the array.
 */
function removeFromArray(arr, el){
	for(var i = arr.length - 1; i >= 0; i--){
		if(arr[i] === el){
			arr.splice(i, 1);
			return true;
		}
	}
	return false;
}

/**
 * @description Delete all the obstacles.
 */
function clearWalls(){
	if(completed || failed) 
		newMaze();
	if(!started){
		for(var i = 0; i < ostacoli.length; i++)
			ostacoli[i].wall = false;
		ostacoli = [];
		drawOBS = true;
		obs.clear();
	}
	document.getElementById("restartButton").disabled = true;
}

/**
 * @description Generate random obstacles on the canvas.
 */
function generateWalls(){
	if(completed || failed)
		newMaze();
	if(!started){
		clearWalls();
		for (i = 0; i < gridSize; i++){
			for (j = 0; j < gridSize; j++){
				if(random(1) < 0.4 && grid[i][j] != start && grid[i][j] != end){
					grid[i][j].wall = true;
					ostacoli.push(grid[i][j]);
				}
			}
		}
		drawOBS = true;
		obs.clear();
	}
	else{
		newMaze();
	}
}

/**
 * @description Start the search algorithm.
 */
function startSimulation(){
	started = true;
	running = true;
	document.getElementById("startButton").disabled = true;
}

/**
 * @description Generate the new Maze without having to refresh the page.
 */
function newMaze(){
	drawBG = true;
	drawOBS = true;

	running = false;
	failed = false;
	completed = false;
	started = false;

	clear();
	start = new Cell(Math.floor((random() * gridSize)), Math.floor((random() * gridSize)));
	end = new Cell(Math.floor((random() * gridSize)), Math.floor((random() * gridSize)));
	grid = initArray();
	generateWalls();
	
	// Initialize the open set
	frontiera = new BinaryHeap(function(cell){
        return cell.f;
	});

	esplorati = [];
	// Add the start position to the OpenSet
	frontiera.push(start);

	document.getElementById("startButton").disabled = false;
	document.getElementById("pathLength").textContent = 0;
	document.getElementById("failCase").hidden = true;

	loop();
}

/**
 * @description Reset an already completed simulation.
 */
function restart(){
	running = false;
	failed = false;
	completed = false;
	started = false;
	clear();
	frontiera = new BinaryHeap(function(cell){
		return cell.f;
	});
	esplorati = [];
	frontiera.push(start);
	document.getElementById("startButton").disabled = false;
	document.getElementById("restartButton").disabled = true;
	document.getElementById("pathLength").textContent = 0;
	document.getElementById("failCase").hidden = true;
	loop();
}

/**
 * @description Change the times per second the draw function is called.
 * @param {int} id - the id of the button representing the speed that was pressed.
 */
function changeSpeed(id){
	document.getElementById(lastSpeedID).classList.remove("active");
	document.getElementById(id).classList.add("active");
	document.getElementById("currentSpeed").textContent = id;
	switch(id){
		case "10fps":
			frameRate(10);
			break;
		case "30fps":
			frameRate(30);
			break;
		case "60fps":
			frameRate(60);
			break;
		default:
			framerate(1);
			break;
	}
	lastSpeedID = id;
}
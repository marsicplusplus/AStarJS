// For the Graphic Object for the background
var bg;
// For the Canvas ref
var canvas;

var obs;

// Size of the grid in term of cells
var gridSize;
// Size of the cells in term of pixels
var cellSize;
// The grid structure
var grid;

// Boolean for checking if the bg need to be drawn (the first time)
var drawBG = true;
var drawOBS = true;
// Boolean for checking if the bg will be drawn or not
var bgToggle = true;
// Boolean for checking is the algorithm has started
var running = false;
// Boolean for checking if the algorithm has failed
var failed = false;
// Boolean for checking if the algorithm has started
var started = false;

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


function setup() {
	// Create the canvas and attach it to the div
	canvas = createCanvas(800, 800)
	canvas.parent("p5Canvas");
	// Create the graphic for the bg and set it density to 1
	bg = createGraphics(800, 800);
	bg.pixelDensity(1);
	
	obs = createGraphics(800, 800);
	obs.pixelDensity(1);
	// Set the framerate to regulate the speed of the simulation
	frameRate(30);  
	// Number of cells in the grid
	gridSize = 30;
	// Size of one cell
	cellSize = canvas.width / gridSize;
	// Array of obstacles
	ostacoli = [];
	
	start = new Cell(Math.floor((random() * gridSize)), Math.floor((random() * gridSize)));
	end = new Cell(Math.floor((random() * gridSize)), Math.floor((random() * gridSize)));
    grid = initArray();
	frontiera = new BinaryHeap(function(cell){
        return cell.f;
	});
	esplorati = [];
	// Add the start position to the OpenSet
	frontiera.push(start);
}


function draw(){ 
	background(255);
	/* 
	*	Draw the Background Grid to the Graphic object bg 
	*	if it's the first time drawing on the screen.
	*/
	if (drawBG){
		bg.background(color(0));
		for(var i = 0; i < gridSize; i++){
            for (var j = 0; j < gridSize; j++){
				bg.fill(color(225));
				bg.noStroke()
				bg.rect(i * cellSize, j * cellSize, cellSize - 1, cellSize - 1);           
			}
		} 
		drawBG = false;
	}
	if (drawOBS){
		/* Draw Obstacles */
		for(var i = 0; i < ostacoli.length; i++){
			obs.fill(color(30, 20, 10));
			obs.noStroke();
			var found = false;
			var q = 0;
			while(!found && q < ostacoli[i].neighbors.length){
				var ne = ostacoli[i].neighbors[q];
				if(ne.wall && ((ne.x === ostacoli[i].x + 1 && ne.y === ostacoli[i].y)
					|| (ne.x === ostacoli[i].x - 1 && ne.y === ostacoli[i].y)
					|| (ne.x === ostacoli[i].x && ne.y === ostacoli[i].y + 1)
					|| (ne.x === ostacoli[i].x && ne.y === ostacoli[i].y - 1))){
					found = true;
				}
				else
					q++;
			}
			if (!found)
				obs.ellipse(ostacoli[i].x * cellSize + cellSize / 2, ostacoli[i].y * cellSize + cellSize / 2, cellSize * 4 / 5)
			else{
				obs.rect(ostacoli[i].x * cellSize, ostacoli[i].y * cellSize, cellSize, cellSize, 10);
			}
		}
		drawOBS = false;
	}
	if(bgToggle)
		image(bg, 0, 0);
	image(obs, 0, 0);

	if(started){
		var current;
		if (running){
			current = algorithm();
			last = current;
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
			/* Draw The Path */
			noFill();
			if(running)
				stroke(255, 0, 255);
			else
				stroke(80, 110, 200);
			strokeWeight(cellSize / 4);
			beginShape();
			for(var i = 0; i < path.length; i++){
				vertex(path[i].x * cellSize + cellSize / 2, path[i].y * cellSize + cellSize / 2);
			}
			endShape();
		}
	}
	start.drawCell(color(0, 125, 250), cellSize);
	end.drawCell(color(255, 0, 0), cellSize);
}

function algorithm(){
	if(frontiera.size() > 0){
		var current = frontiera.pop();
        if(current ===  end){
			console.log("Done");
			noLoop();
			running = false;
		}
		else{
			esplorati.push(current);
			for(var i = 0; i < current.neighbors.length; i++){
				var neigh = current.neighbors[i];
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
        console.log("Fail");
		running = false;
		failed = true;
		noLoop();
        return;
	}
	return current;
}

function heuristic(cell, goal){
	// MD
	return Math.abs(goal.x - cell.x) + Math.abs(goal.y - cell.y);
	//return dist(cell.x, cell.y, goal.x, goal.y)
}

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
			if(random(1) < 0.4 && cl[j] != start && cl[j] != end){
				cl[j].wall = true;
				ostacoli.push(cl[j]);
			}
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

function gridToggle(){
	bgToggle = !bgToggle;
	draw();
}

function startSimulation(){
	started = true;
	running = true;
	document.getElementById("startButton").disabled = true;
}
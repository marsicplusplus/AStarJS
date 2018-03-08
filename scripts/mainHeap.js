var bg;
var canvas;

var gridSize;
var cellSize;
var weight = 1;
var grid;

var drawBG = true;
var bgToggle = true;
var running = false;
var failed = false;
var started = false;

var frontiera;
var esplorati;
var ostacoli;
var start;
var end;
var last;


function setup() {
	canvas = createCanvas(800, 800)
	canvas.parent("p5Canvas");
	bg = createGraphics(800, 800);
	bg.pixelDensity(1);
	frameRate(30);  
    gridSize = 30;
	cellSize = canvas.width / gridSize;
	ostacoli = [];
	start = new Cell(0, 0);
	end = new Cell(gridSize - 1, gridSize - 1);
    grid = initArray();
	frontiera = new BinaryHeap(function(cell){
        return cell.f;
	});
    esplorati = [];
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
				bg.fill(color(255, 225, 225));
				bg.noStroke()
				bg.rect(i * cellSize, j * cellSize, cellSize - 1, cellSize - 1);           
			}
		} 
		drawBG = false;
	}
	if(bgToggle)
		image(bg, 0, 0);
	/* Draw Obstacles */
	for(var i = 0; i < ostacoli.length; i++){
		//ostacoli[i].drawCell(color(0), cellSize);
		fill(color(0));
		noStroke();
		ellipse(ostacoli[i].x * cellSize + cellSize / 2, ostacoli[i].y * cellSize + cellSize / 2, cellSize / 2)
	}
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
			frontiera.content[i].drawCell(color(255, 0, 0), cellSize);
		/* Draw ClosedSet */
		for(var i = 0; i < esplorati.length; i++)
			esplorati[i].drawCell(color(0, 255, 0), cellSize);
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
				//path[i].drawCell(color(20, 100, 125), cellSize);
				vertex(path[i].x * cellSize + cellSize / 2, path[i].y * cellSize + cellSize / 2);
			}
			endShape();
		}
	}
	start.drawCell(color(0, 250, 250), cellSize);
	end.drawCell(color(250, 250, 0), cellSize);
}

function algorithm(){
	if(frontiera.size() > 0){
		var current = frontiera.pop();
        if(current ===  end){
			console.log("Done");
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
        return;
	}
	return current;
}

function heuristic(cell, goal){
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
			if(random(1) < 0.4 && ((i != start.x && j != start.y) || (i != end.x && j != end.y))){
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
}

function startSimulation(){
	started = true;
	running = true;
	document.getElementById("startButton").disabled = true;
}
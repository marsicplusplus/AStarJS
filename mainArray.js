var gridSize;
var cellSize;
var weight = 1;
var grid;

var drawGrid = true;

var frontiera;
var esplorati;
var start;
var end;

var heapTest = new BinaryHeap(function(t){
	return t;
});

function setup() {
    var canvas = createCanvas(640, 640)
    gridSize = 30;
    cellSize = canvas.width / gridSize;
    grid = initArray();

	frontiera = [];
    esplorati = [];
    start = grid[0][0];
    end = grid[gridSize - 1][gridSize - 1]
	frontiera.push(start);
}


function draw(){
	background(0);
    if(frontiera.length > 0){
		var currIdx = 0;
		for(var i = 1; i < frontiera.length; i++){
			if(frontiera[currIdx].f > frontiera[i].f)
				currIdx = i;
		}
		var current = frontiera[currIdx];
		console.log(frontiera)
        if(current ===  end){
            console.log("Done");
			noLoop();
		}
		else{
			esplorati.push(current);
			removeFromFrontiera(current);
			for(var i = 0; i < current.neighbors.length; i++){
				var neigh = current.neighbors[i];
				console.log("Neigh[" + neigh.x + ";" + neigh.y + "]");
				if(!esplorati.includes(neigh) && !neigh.wall){  
					var tmpG = current.g + neigh.weight;
					var newPath = false;
					if(frontiera.includes(neigh)){   
						if (tmpG < neigh.g){
							console.log("Better path found");
							neigh.g = tmpG;
							newPath = true;
						}
					}else{
						console.log("New node found");
						neigh.g = tmpG;
						newPath = true;
						frontiera.push(neigh);
						console.log("g: " + neigh.g + "| h: " + neigh.h + "| f: " + neigh.f);
					}
					if(newPath){
						neigh.h = heuristic(neigh, end);
						neigh.f = neigh.g + neigh.h;
						neigh.previous = current;
					}
				}
			}
		}
        
    } else{
        console.log("Fail");
        noLoop();
        return;
    }

    if (drawGrid){
        for(var i = 0; i < gridSize; i++){
            for (var j = 0; j < gridSize; j++){
                    grid[i][j].drawCell(color(255), cellSize);
            }
        }
    }
    else
        background(255);
    
    for(var i = 0; i < frontiera.length; i++)
        frontiera[i].drawCell(color(255, 0, 0), cellSize);
    for(var i = 0; i < esplorati.length; i++)
		esplorati[i].drawCell(color(0, 255, 0), cellSize);
		
	var path = [];
	var tmp = current;
	path.push(tmp);
	while(tmp.previous){
		path.push(tmp.previous);
		tmp = tmp.previous;
	}

	for(var i = 0; i < path.length; i++){
		path[i].drawCell(color(20, 100, 255), cellSize);
	}
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

function gridToggle(){
    drawGrid = !drawGrid;
}

function removeFromFrontiera(el){
	for(var i = frontiera.length - 1; i >= 0; i--){
		if(frontiera[i] === el){
			frontiera.splice(i, 1)
		}
	}
}
var bg;
var canvas;

var gridSize;
var cellSize;
var weight = 1;
var grid;

var drawBG = true;
var bgToggle = true;
var frontiera;
var esplorati;
var ostacoli;
var start;
var end;

function setup() {
	canvas = createCanvas(640, 640)
	canvas.parent("p5Canvas");
	bg = createGraphics(640, 640);
  	bg.pixelDensity(1);
    gridSize = 50;
	cellSize = canvas.width / gridSize;
	ostacoli = [];
    grid = initArray();
	frontiera = new BinaryHeap(function(cell){
        return cell.f;
	});
    esplorati = [];
    start = grid[0][0];
    end = grid[gridSize - 1][gridSize - 1]
	frontiera.push(start);
}


function draw(){ 
	background(255);
	if (drawBG){
		bg.background(color(0));
		for(var i = 0; i < gridSize; i++){
            for (var j = 0; j < gridSize; j++){
				bg.fill(color(255));
				bg.noStroke()
				bg.rect(i * cellSize, j * cellSize, cellSize - 1, cellSize - 1);           
			}
		} 
		drawBG = false;
	}
	if(bgToggle)
		image(bg, 0, 0);
	if(frontiera.size() > 0){
		var current = frontiera.pop();
        if(current ===  end){
            console.log("Done");
			noLoop();
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
        noLoop();
        return;
    }
	
	for(var i = 0; i < ostacoli.length; i++)
		ostacoli[i].drawCell(color(0), cellSize);
	
    for(var i = 0; i < frontiera.size(); i++)
        frontiera.content[i].drawCell(color(255, 0, 0), cellSize);
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
			if(cl[j].wall){
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
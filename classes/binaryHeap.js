/*
* Codice ispirato da:
* http://eloquentjavascript.net/1st_edition/appendix2.html
*/

function BinaryHeap(fun){
    this.content = [];
    this.scoreFunction = fun;

    this.push = function(element){
		this.content.push(element);
        this.bubbleUp(this.content.length - 1);
    };

    this.pop = function(){
        var result = this.content[0];
        var end = this.content.pop();
        if (this.content.length > 0){
            this.content[0] = end;
            this.sinkDown(0);
        }
        return result;
    };

    this.remove = function(node){
        var length = this.content.length;
        var i = 0;
        var found = false;
        while(i < length && !found){
            if (this.content[i] === node){
				var end = this.content.pop();
				found = true;
                if(i == length - 1) break;
                this.content[i] = end;
                this.bubbleUp(i);
				this.sinkDown(i);
			}
			i++;
        }
    };

    this.size = function(){
        return this.content.length;
    };

    this.bubbleUp = function(n){
        var element = this.content[n];
        var score = this.scoreFunction(element);
        var done = false;
        while(n > 0 && !done){
            var parentIndex = Math.floor((n + 1) / 2) - 1;
            var parent = this.content[parentIndex];
            if(score >= this.scoreFunction(parent)) done = true;
            else{
                this.content[parentIndex] = element; 
                this.content[n] = parent;
                n = parentIndex;
            }
        }
    };

    this.sinkDown = function(n){
       // Look up the target element and its score.
        var length = this.content.length,
        element = this.content[n],
        elemScore = this.scoreFunction(element);
        var done = false;
        while(true && !done) {
            var child2N = (n + 1) * 2, child1N = child2N - 1;
            var swap = null;
            if (child1N < length) {
                var child1 = this.content[child1N],
                child1Score = this.scoreFunction(child1);
                if (child1Score < elemScore)
                	swap = child1N;
            }
            if (child2N < length) {
                var child2 = this.content[child2N],
                child2Score = this.scoreFunction(child2);
                if (child2Score < (swap == null ? elemScore : child1Score))
                swap = child2N;
            }

            if (swap == null) done = true;
            else{
                this.content[n] = this.content[swap];
                this.content[swap] = element;
                n = swap;
            }
        }
    }
}
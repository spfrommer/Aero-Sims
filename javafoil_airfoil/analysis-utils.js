module.exports = {
    // Calculates the vertical cross section of the airfoil
    crossSection: function(genes) {
        var yIntervals = [];
        geneUtils.parse(genes, function(elem) {
            var ly = elem.leadingPos[1];
            var ty = elem.trailingPos[1];
            if (ly < ty) {
                var diff = Math.max(elem.scale * 0.2, ty - ly);
                yIntervals.push([ty - diff, ty]);
            } else {
                var diff = Math.max(elem.scale * 0.2, ly - ty);
                yIntervals.push([ly - diff, ly]);
            }
        });
        yIntervals = this.mergeIntervals(yIntervals);
        var crossSec = yIntervals.map(function(yInt) { return yInt[1] - yInt[0]; })
                                 .reduce(function(t, n) { return t + n; });
        return crossSec;
    },
    // Takes a set of potentially overlapping intervals and
    // merges overlapping intervals.
    mergeIntervals: function(intervals) {
        // test if there are at least 2 intervals
        if (intervals.length <= 1)
            return intervals;

        var stack = [];
        var top   = null;

        // sort the intervals based on their start values
        intervals = intervals.sort(function (startValue, endValue) {
            if (startValue[0] > endValue[0]) {
              return 1;
            }
            if (startValue[0] < endValue[0]) {
              return -1;
            }
            return 0;
        });

        // push the 1st interval into the stack
        stack.push(intervals[0]);

        // start from the next interval and merge if needed
        for (var i = 1; i < intervals.length; i++) {
            // get the top element
            top = stack[stack.length - 1];

            // if the current interval doesn't overlap with the 
            // stack top element, push it to the stack
            if (top[1] < intervals[i][0]) {
                stack.push(intervals[i]);
            } else if (top[1] < intervals[i][1])  {
                // otherwise update the end value of the top element
                // if end of current interval is higher
                top[1] = intervals[i][1];
                stack.pop();
                stack.push(top);
            }
        }

        return stack;
    },
    vecAdd: function(vec1, vec2) {
        if (vec1.length != vec2.length) {
            throw "Vectors must be of same length to add!";
        }

        var result = []
        for (var i = 0; i < vec1.length; i++) {
            result.push(vec1[i] + vec2[i])
        }

        return result;
    },
    toDegrees: function(angle) {
        return angle * (180 / Math.PI);
    },
    toRadians: function(angle) {
        return angle * (Math.PI / 180);
    },
    randRange: function(min, max) {
        if (min > max || min == Number.NEGATIVE_INFINITY || max == Number.POSITIVE_INFINITY) {
            throw "Illegal rand range parameters";
        }
        return min + Math.random() * (max - min);
    },
    clamp: function(x, min, max) {
        return Math.max(min, Math.min(x, max));
    },
    fileCount: function(directory) {
        return new java.io.File(directory).list().length;
    },
    readFile: function(filename) {
        var content = new java.lang.String(
                            java.nio.file.Files.readAllBytes(
                              java.nio.file.Paths.get(filename)
                            )
                          );
        return content;
    },
    writeFile: function(filename, text) {
        var file = new java.io.File(filename);
        var FileWriter = Java.type("java.io.FileWriter");
        var fw = new FileWriter(file);
        fw.write(text);
        fw.close();
    },
    // Reads a one line polar output from JavaFoil
    readPolar: function(filename) {
        var content = this.readFile(filename);
        var raw = content.split("\n")[5];
        var fields = raw.split("\t");
        cl = fields[1];
        cd = fields[2];
        
        return {cl: cl, cd: cd};
    }
};


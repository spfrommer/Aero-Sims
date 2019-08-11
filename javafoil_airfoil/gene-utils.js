var utils = require('analysis-utils');

var elemStruct = function(leadingPos, trailingPos, deltaPos, rot, scale) {
    var struct = {};
    // These three attributes are actually the three core ones
    struct.deltaPos = deltaPos;
    struct.rot = rot;
    struct.scale = scale;
    // Additional attributes
    struct.leadingPos = leadingPos;
    struct.trailingPos = trailingPos;
    return struct;
};

function ElementConstraint() {
    this.dx = [Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY];
    this.dy = [Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY];
    this.rot = [Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY];
    this.scale = [Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY];
};

// The x constraint between the trailing edge of previous element
// and leading edge of current element
ElementConstraint.prototype.withDx = function(min, max) {
    this.dx = [min, max];
    return this;
};

// The y constraint between the trailing edge of previous element
// and leading edge of current element
ElementConstraint.prototype.withDy = function(min, max) {
    this.dy = [min, max];
    return this;
};

// The rotation constraint
ElementConstraint.prototype.withRot = function(min, max) {
    this.rot = [min, max];
    return this;
};

// The scale constraint
ElementConstraint.prototype.withScale = function(min, max) {
    this.scale = [min, max];
    return this;
};

ElementConstraint.prototype.toString = function() {
    return "dx: " + this.dx + "\tdy: " + this.dy +
           "\trot: " + this.rot + "\tscale: " + this.scale;
};

function SizeConstraint(width, height) {
    this.maxWidth = width;
    this.maxHeight = height;
};

var elemCount = function(genes) {
    return Math.ceil(genes.length / 4);
};

var parse = function(genes, handleParse) {
    genes = genes.slice();

    // The coordinates the last element's trailing edge
    var trailingPos = [0,0];
    
    for (var i = 0; i < genes.length / 4; i++) {
        var deltaPos = [genes[4*i], genes[4*i + 1]];
        var rot      = genes[4*i + 2];
        var scale    = genes[4*i + 3];

        var rotStandard = -utils.toRadians(rot);
        
        var leadingPos = utils.vecAdd(trailingPos, deltaPos);

        trailingPos = utils.vecAdd(leadingPos, [Math.cos(rotStandard) * scale, Math.sin(rotStandard) * scale]);

        var returnStruct = handleParse(elemStruct(leadingPos.slice(), trailingPos.slice(), deltaPos, rot, scale), i);

        if (returnStruct != undefined) {
            genes[4*i] = returnStruct.deltaPos[0];
            genes[4*i + 1] = returnStruct.deltaPos[1];
            genes[4*i + 2] = returnStruct.rot;
            genes[4*i + 3] = returnStruct.scale;
        }
    }

    return genes;
};

var applyElemConstraints = function(genes, elemConstraints) {
    genes = parse(genes, function(elemStruct, i) {
        elemStruct.deltaPos[0] = utils.clamp(elemStruct.deltaPos[0],
                                       elemConstraints[i].dx[0],
                                       elemConstraints[i].dx[1]);
        elemStruct.deltaPos[1] = utils.clamp(elemStruct.deltaPos[1],
                                       elemConstraints[i].dy[0],
                                       elemConstraints[i].dy[1]);
        elemStruct.rot = utils.clamp(elemStruct.rot,
                               elemConstraints[i].rot[0],
                               elemConstraints[i].rot[1]);
        elemStruct.scale = utils.clamp(elemStruct.scale,
                                 elemConstraints[i].scale[0],
                                 elemConstraints[i].scale[1]);
        return elemStruct;
    });
    return genes;
};

var applySizeConstraint = function(genes, sizeConstraint) {
    var dpSum = [0,0];
    var minX = 0, maxX = 0, minY = 0, maxY = 0;
    parse(genes, function(elemStruct, i) {
        dpSum = utils.vecAdd(dpSum, elemStruct.deltaPos);
        
        minX = Math.min(minX, elemStruct.leadingPos[0], elemStruct.trailingPos[0]);
        maxX = Math.max(maxX, elemStruct.leadingPos[0], elemStruct.trailingPos[0]);

        minY = Math.min(minY, elemStruct.leadingPos[1], elemStruct.trailingPos[1]);
        maxY = Math.max(maxY, elemStruct.leadingPos[1], elemStruct.trailingPos[1]);
    });
    var rescaleX = (sizeConstraint.maxWidth - dpSum[0]) / (maxX - minX - dpSum[0]);
    var rescaleY = (sizeConstraint.maxHeight - dpSum[1]) / (maxY - minY - dpSum[1]);
    var rescale = Math.min(rescaleX, rescaleY, 1);
    genes = parse(genes, function(elemStruct, i) {
        elemStruct.scale = elemStruct.scale * rescale;
        return elemStruct;
    });
    return genes;
}

module.exports = {
    /* 
     * Takes a set of genes and a callback; callback takes element struct
     * and gets called for each element that's parsed.
     * The callback can return an element struct to overwrite one element's
     * worth of the genes.
     */
    parse: parse,
    // Takes a genome and modifies it to be within the constraints.
    applyConstraints: function(genes, constraints) {
        genes = applyElemConstraints(genes, constraints.elemConstraints);

        if (constraints.sizeConstraint != undefined) {
            genes = applySizeConstraint(genes, constraints.sizeConstraint);
        }
        return genes;
    },
    // Generates a random airfoil within the given constraints.
    randomAirfoil: function(constraints) {
        genes = [];
        for (var i = 0; i < constraints.elemConstraints.length; i++) {
            var c = constraints.elemConstraints[i];
            genes[4*i] = utils.randRange(c.dx[0], c.dx[1]);
            genes[4*i+1] = utils.randRange(c.dy[0], c.dy[1]);
            genes[4*i+2] = utils.randRange(c.rot[0], c.rot[1]);
            genes[4*i+3] = utils.randRange(c.scale[0], c.scale[1]);
        }
        // Make sure size constraints are being applied
        if (constraints.sizeConstraint != undefined) {
            return applySizeConstraint(genes, constraints.sizeConstraint);
        } else {
            return genes;
        }
    },
    stringifyGenome: function(genes) {
        var string = "";
        geneUtils.parse(genes, function(elemStruct, i) {
            string = string + "Elem " + i + " x overlap: " + elemStruct.deltaPos[0] + "\n";
            string = string + "Elem " + i + " y overlap: " + elemStruct.deltaPos[1] + "\n";
            string = string + "Elem " + i + " rot: " + elemStruct.rot + "\n";
            string = string + "Elem " + i + " scale: " + elemStruct.scale + "\n";
        });
        return string;
    },
    ElementConstraint: ElementConstraint,
    SizeConstraint: SizeConstraint
};

// A wrapper class for JavaFoil's interface

var firstAirfoil = null;
var airfoilCount = 0;
var airfoilData = "s1223.txt";

/*
 * Position of leading edge (units of unscaled chord length)
 * Rotation around leading edge (degrees, positive=>clockwise, horizontal=0)
 * Scale (both in x and y)
 */
function AirfoilElement(position, rotation, scale) {
    if (firstAirfoil == null) {
        Geometry.Open(airfoilData);
        airfoilCount = 1;
        Modify.Select(1);

        this.position = [0,0];
        this.rotation = 0;
        this.scale = 1;
        this.id = 1;

        // Initialize pivot to leading edge
        Modify.SetPivot(0,0);
        // Flip around geometry so that element is concave up
        Modify.Flip(0.0,0.0);
        firstAirfoil = this;
    } else {
        Modify.Select(1);
        Modify.Duplicate();

        // Selections are 1-indexed
        Modify.Select(++airfoilCount);

        this.id = airfoilCount;
        this.position = firstAirfoil.position;
        this.rotation = firstAirfoil.rotation;
        this.scale = firstAirfoil.scale;

        // Initialize pivot to leading edge of first Airfoil
        Modify.SetPivot(this.position[0], this.position[1]);
    }

    this.setPosition(position);
    this.setRotation(rotation);
    this.setScale(scale);
}

AirfoilElement.prototype.select = function() {
    Modify.Select(this.id);
}

AirfoilElement.prototype.setPosition = function(position) {
    this.select();
    Modify.Move(100 * (position[0] - this.position[0]),
                100 * (position[1] - this.position[1]));
    Modify.SetPivot(position[0], position[1]);
    this.position = position;
}

AirfoilElement.prototype.setRotation = function(rotation) {
    this.select();
    var oldPos = this.position;
    this.setPosition([0,0]);
    Modify.Rotate(0, 0, rotation - this.rotation);
    this.setPosition(oldPos);
    this.rotation = rotation;
}

AirfoilElement.prototype.setScale = function(scale) {
    this.select();
    var oldPos = this.position;
    var oldRot = this.rotation;
    this.setPosition([0,0]);
    this.setRotation(0);
    Modify.Scale(100 * scale / this.scale);
    this.setRotation(oldRot);
    this.setPosition(oldPos);
    this.scale = scale;
}

AirfoilElement.prototype.selectAll = function() {
    var arr = new Array(airfoilCount);
    for (var i = 0; i < airfoilCount; i++) {
        arr[i] = i+1;
    }
    Modify.Select(arr);
}

module.exports = AirfoilElement;

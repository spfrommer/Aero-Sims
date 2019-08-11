var fs = require('fs');
var xmljs = require('xml-js');

module.exports = { 
    readAirfoil: function(filename) {
        var content = fs.readFileSync(filename, 'utf8');

        var converted = xmljs.xml2json(content, {compact: true, spaces: 4,
                        nativeType: true, nativeTypeAttributes: true});

        var json = JSON.parse(converted);
        var elements = json.airfoil.elements.element;

        // If just one element, put it in a list to help keep the later processing consistent
        if (elements.length == undefined) {
            elements = [elements];
        }

        var airfoil = [];
        for (var i = 0; i < elements.length; i++) {
            var element = elements[i];
            var points = element.coordinates.point;
            var pointsOut = [];
            for (var j = 0; j < points.length; j++) {
                var point = points[j];
                var x = point.x._text;
                var y = point.y._text;
                pointsOut.push([x,y]);
            }
            airfoil.push(pointsOut);
        }
        return airfoil;
    }
};

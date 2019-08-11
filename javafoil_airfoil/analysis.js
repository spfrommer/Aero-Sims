// Polyfill
var global = this;
var window = this;
var process = {env:{}};

var console = {};
console.debug = print;
console.log = print;
console.warn = print;
console.error = print;

// Allows loading of npm libraries in nashorn
load('./jvm-npm.js');

// Libraries
var Genetic = require('genetic-js');

// Helper files
var AirfoilElement = require('airfoil');
var utils = require('analysis-utils');
var geneUtils = require('gene-utils');

// switch to US country settings
Options.Country(0);

Options.GroundEffect(0);
Options.MachNumber(0);
Options.StallModel(0);
Options.TransitionModel(1);
Options.AspectRatio(0);

// The constraints of the optimization
var constraints = {};
constraints.elemConstraints =
    [new geneUtils.ElementConstraint().withDx(0,0)       .withDy(0,0)    .withRot(8,20)    .withScale(0.3,0.3),
     new geneUtils.ElementConstraint().withDx(-0.15,0.15).withDy(0.1,0.5).withRot(-40,0)   .withScale(1.8,1.8),
     new geneUtils.ElementConstraint().withDx(-0.3,0.15) .withDy(0.1,0.5).withRot(-50,-20) .withScale(0.75,0.75),
     new geneUtils.ElementConstraint().withDx(-0.3,0.15) .withDy(0.1,0.5).withRot(-70,-30) .withScale(0.45,0.45),
     new geneUtils.ElementConstraint().withDx(-0.3,0.15) .withDy(0.1,0.5).withRot(-83,-50) .withScale(0.3,0.3)];

/*
constraints.elemConstraints =
    [new geneUtils.ElementConstraint().withDx(0,0)       .withDy(0,0)    .withRot(8,20)    .withScale(0.2,0.45),
     new geneUtils.ElementConstraint().withDx(-0.15,0.15).withDy(0.1,0.5).withRot(-40,0)   .withScale(1,2),
     new geneUtils.ElementConstraint().withDx(-0.3,0.15) .withDy(0.1,0.5).withRot(-50,-20) .withScale(0.4,0.9),
     new geneUtils.ElementConstraint().withDx(-0.3,0.15) .withDy(0.1,0.5).withRot(-70,-30) .withScale(0.3,0.7),
     new geneUtils.ElementConstraint().withDx(-0.3,0.15) .withDy(0.1,0.5).withRot(-83,-50) .withScale(0.2,0.45)];
*/

/*
constraints.elemConstraints =
    [new geneUtils.ElementConstraint().withDx(0,0)       .withDy(0,0)    .withRot(8,20)    .withScale(0.1,2),
     new geneUtils.ElementConstraint().withDx(-0.15,0.15).withDy(0.1,0.5).withRot(-40,0)   .withScale(0.1,2),
     new geneUtils.ElementConstraint().withDx(-0.3,0.15) .withDy(0.1,0.5).withRot(-50,-20) .withScale(0.1,2),
     new geneUtils.ElementConstraint().withDx(-0.3,0.15) .withDy(0.1,0.5).withRot(-70,-30) .withScale(0.1,2),
     new geneUtils.ElementConstraint().withDx(-0.3,0.15) .withDy(0.1,0.5).withRot(-83,-50) .withScale(0.1,2)];
     */
constraints.sizeConstraint = new geneUtils.SizeConstraint(2.9, 1.9);

var elems = [];
for (var i = 0; i < constraints.elemConstraints.length; i++) {
    elems.push(new AirfoilElement([0,0], 0, 1));
}

var loadGenes = function(genes) {
    geneUtils.parse(genes, function(elemStruct, i) {
        elems[i].setPosition(elemStruct.leadingPos);
        elems[i].setRotation(elemStruct.rot);
        elems[i].setScale(elemStruct.scale);
    });
};

var genetic = Genetic.create();

// Drift is proportional to the value of the gene; jiggle is if the value is close
// to zero to help avoid the solver getting stuck around 0.
var mutationCount = 4; // How many values get mutated in each mutation
var mutationDrift = 0.3; // Percent change in each mutated gene
var mutationJiggle = 0.1; // Absolute value change in each mutated gene

var fitnessVal = "df"; // Either downforce (df) or lift coefficient (cl)

genetic.optimize = Genetic.Optimize.Maximize;
genetic.select1 = Genetic.Select1.Fittest;
genetic.select2 = Genetic.Select2.Tournament2;

var config = {
			"iterations": 200,
			"size": 10,
			"crossover": 0.5,
			"mutation": 0.5,
            "fittestAlwaysSurvives": true,
			"skip": 0
		};

genetic.seed = function() {
    return geneUtils.randomAirfoil(constraints);
};

genetic.mutate = function(entity) {
    // Pick a random element to mutate
    for (var i = 0; i < mutationCount; i++) {
	    var drift = ((Math.random()-0.5)*2) * mutationDrift;
        var jiggle = ((Math.random()-0.5)*2) * mutationJiggle;

        var gene = Math.floor(Math.random() * entity.length);
        entity[gene] += entity[gene] * drift + jiggle;
    }
	
    return geneUtils.applyConstraints(entity, constraints);
};

genetic.crossover = function(mother, father) {
    // Single-point crossover
	var i = Math.floor(Math.random() * mother.length);

    var m1 = mother.slice(0, i);
    var m2 = mother.slice(i, mother.length);

    var f1 = father.slice(0, i);
    var f2 = father.slice(i, mother.length);

    var son = m1.concat(f2);
    var daughter = m2.concat(f1);
	
	return [geneUtils.applyConstraints(son, constraints),
            geneUtils.applyConstraints(daughter, constraints)];
};

genetic.fitness = function(genes) {
    loadGenes(genes);

    AirfoilElement.prototype.selectAll();
    Polar.Analyze(600000,600000,600000, 0,0,1, 1.0,1.0, 0,false);
    Polar.Save("out/tmp/polar.txt");
    var simOut = utils.readPolar("out/tmp/polar.txt");

    if (fitnessVal.equals("cl")) {
        return -simOut.cl;
    } else if (fitnessVal.equals("df")) {
        return 0.5 * 1.0 * utils.crossSection(genes) * (-simOut.cl) * 1.225 * 13.4 * 13.4;
    } else {
        throw "Fitness function not supported";
    }
};

genetic.notification = function(pop, gen, stats, isFinished) {
    print('Finished generation: ' + gen);
    var best = pop[0];
    print(JSON.stringify(best));
    print(JSON.stringify(stats));

    loadGenes(best.entity);
    utils.writeFile("out/stats/stat" + gen + ".txt", "{\"fitness\":" + stats.maximum + "}");
    Geometry.Save("out/airfoils/airfoil" + gen + ".xml");
    $EXEC("node render.js --fitness");

    if (isFinished) {
        writeSummary(best.entity);
    }
};

var writeSummary = function(best) {
    var constraintsString = constraints.elemConstraints.map(function(x) { return x.toString(); }).join("\n");
    var sizeConstraintsString = "";
    if (constraints.sizeConstraints != undefined) {
        sizeConstraintsString = constraints.sizeConstraint.maxWidth + ", "
                              + constraints.sizeConstraint.maxHeight;
    }
 
    var setupString = "fitness: " + fitnessVal + "\nElement Constraints:\n" + constraintsString
                    + "\nSize constraints:\n" + sizeConstraintsString
                    + "\nBest genome: \n" + best + "\n" + geneUtils.stringifyGenome(best)
                    + "\nConfig: \n" + JSON.stringify(config);
    utils.writeFile("out/setup.txt", setupString);
}

/*
print("------Cleaning------");
$EXEC("sh shell/clean.sh");
print("------Evolving------");
genetic.evolve(config);
print("------Rendering------");
$EXEC("node render.js --fitness --history");
print("------Saving------");
$EXEC("sh shell/save.sh");
*/
$EXEC("sh shell/clean.sh");
var run1Gene = [15,0.21856453320281696,0.19223576378374055,0.02774705236294576,-1.0416004202855307,0.09283684526518944,-0.03900366004564247,0.034122434907920746,-54.15262798361977,0.595265751325674,0.02710965508334465,0.05234792132399338,-70,3.7183564963935467,-0.013562415501078921,0.14640913509991402,-70,1.2535254840937773];
var gene1 = [0,0,15,0.45,-0.19,0.15,-15,1.8,-0.21,0.075,-40,0.75,-0.21,0.075,-52,0.45,-0.15,0.019,-65,0.45];
var gene2 = [0,0,20,0.45,-0.12,0.2,-5,1.8,-0.21,0.075,-30,0.75,-0.21,0.075,-45,0.45,-0.15,0.012,-60,0.45];
var gene3 = [0,0,15,0.45,-0.16,0.25,-8,1.8,-0.24,0.075,-34,0.75,-0.22,0.09,-51,0.45,-0.15,0.05,-65,0.45];
var bigGene = [0,0,15,0.45, 0.16,0.25,-8,1.8, 0.24,0.2,-34,0.75, 0.22,0.4,-51,0.45, 0.15,0.05,-65,0.45];
var optGene = [0,0,8,0.3,0.10085300557196791,0.1,-0.30403923976964553,1.8,-0.04899660804940167,0.1,-50,0.75,-0.02714506109077082,0.1,-70,0.45,-0.01445695834105395,0.1182241238912726,-83,0.3];
print(genetic.fitness(optGene));
//print(genetic.fitness(geneUtils.applyConstraints(bigGene, constraints)));
Geometry.Save("out/airfoils/airfoil0.xml");
$EXEC("node render.js");
JavaFoil.Exit();

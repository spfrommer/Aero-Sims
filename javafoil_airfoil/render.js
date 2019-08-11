// Standalone script, run with node
// You can't call this from the analysis script since
// that is run through JavaFoil's nashorn engine, which
// does support ES6 (required by jsdom)
const D3Node = require('d3-node');
const d3 = require('d3');
const renderUtils = require('./render-utils.js');
const fs = require('fs');

var program = require('commander');
 
program
  .option('-h, --history', 'Render evolution history')
  .option('-f, --fitness', 'Render fitness')
  .parse(process.argv);
    
var options = {
    d3Module: d3
};

var d3n = new D3Node(options);

var margin = {top: 30, right: 30, bottom: 50, left: 30},
    width = 900 - margin.left - margin.right,
    height = 900 - margin.top - margin.bottom,
    maxX = 5, maxY = 5;

/* 
 * value accessor - returns the value to encode for a given data object.
 * scale - maps value to a visual display encoding, such as a pixel position.
 * map function - maps from data value to display value
 * axis - sets up axis
 */ 

// setup x 
var xValue = function(d) { return d[0];}, // data -> value
    xScale = d3.scaleLinear().domain([0,maxX]).range([0, width]), // value -> display
    xMap = function(d) { return xScale(xValue(d));}, // data -> display
    xAxis = d3.axisBottom(xScale);

// setup y
var yValue = function(d) { return d[1];}, // data -> value
    yScale = d3.scaleLinear().domain([-1,maxY]).range([height, 0]), // value -> display
    yMap = function(d) { return yScale(yValue(d));}, // data -> display
    yAxis = d3.axisLeft(yScale);

var color = d3.scaleOrdinal(d3.schemeCategory10);

// add the graph canvas to the body of the webpage
var svg = d3n.createSVG(width + margin.left + margin.right,
                        height + margin.top + margin.bottom).append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// x-axis
svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

// y-axis
svg.append("g")
    .attr("class", "y axis")
    .call(yAxis);

var genCount = fs.readdirSync("out/airfoils").length;

var renderAirfoil = function(airfoil, opacity, outline) {
    for (var elem = 0; elem < airfoil.length; elem++) {
        var dots = svg.selectAll(".dot" + gen + "-" + elem)
                      .data(airfoil[elem]);

        if (outline) {
            dots.enter().append("circle")
                .attr("class","dot")
                .attr("r", 3.6)
                .attr("cx", xMap)
                .attr("cy", yMap)
                .style("fill", "black")
                .style("opacity", opacity);
        }

        dots.enter().append("circle")
            .attr("class", "dot")
            .attr("r", 3)
            .attr("cx", xMap)
            .attr("cy", yMap)
            .style("fill", color(elem))
            .style("opacity", opacity);
    }
}

// If we want to render the evolution history, sample old genes and render them transparent
if (program.history) {
    var genSkip = Math.ceil(genCount / 40);
    for (var gen = 0; gen < genCount - 1; gen += genSkip) {
        airfoil = renderUtils.readAirfoil("out/airfoils/airfoil" + gen + ".xml");
        var opacity = 0.05 + 0.15 * gen / genCount;

        renderAirfoil(airfoil, opacity, false);
    }
}

// Always render the last generation with full transparency and an outline
var lastGen = genCount - 1;
var airfoil = renderUtils.readAirfoil("out/airfoils/airfoil" + lastGen + ".xml");
renderAirfoil(airfoil, 1, true);

if (program.fitness) {
    // Make mini fitness graph
    var fitness = [];
    for (var gen = 0; gen < genCount; gen++) {
        var genStr = fs.readFileSync("out/stats/stat" + gen + ".txt");
        fitness.push({gen: gen, fitness: JSON.parse(genStr).fitness});
    }
    
    var miniWidth = 300,
        miniHeight = 300,
        miniX = 50,
        miniY = 30,
        maxFitness = Math.max(...fitness.map(x => x.fitness));
    
    var roundDecimal = 1;
    var fitVal = maxFitness;
    while (fitVal > 1) {
        fitVal = fitVal / 10;
        roundDecimal = roundDecimal * 10;
    }
    maxFitness = Math.ceil(maxFitness / 10) * 10;

    var genValue = function(d) { return d.gen; },
        genScale = d3.scaleLinear().domain([0,genCount-1]).range([0, miniHeight]),
        genMap   = function(d) { return genScale(genValue(d));},
        genAxis  = d3.axisBottom(genScale);

    var fitnessValue    = function(d) { return d.fitness; },
        fitnessScale    = d3.scaleLinear().domain([0, maxFitness]).range([miniWidth, 0]),
        fitnessMap      = function(d) { return fitnessScale(fitnessValue(d)); },
        fitnessAxis     = d3.axisLeft(fitnessScale);

    var line = d3.line().x(function(d) { return genMap(d); })
                        .y(function(d) { return fitnessMap(d); });

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(" + miniX + ", " + (miniY + miniHeight) + ")")
        .call(genAxis);
    svg.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(" + miniX + ", " + miniY + ")")
        .call(fitnessAxis);

    svg.append("g").append("path")
       .datum(fitness)
       .attr("fill", "none")
       .attr("stroke", "black")
       .attr("stroke-linejoin", "round")
       .attr("stroke-linecap", "round")
       .attr("stroke-width", 1.5)
       .attr("class", "line")
       .attr("transform", "translate(" + miniX + ", " + miniY + ")")
       .attr("d", line);

    svg.append("g").selectAll("text")
                   .data([fitness[fitness.length - 1]])
                   .enter()
                   .append("text")
                   .attr("transform", "translate(" + (miniX + 10) + ", " + (miniY + 10) + ")")
                   .attr("text-anchor", "start")
                   .attr("x", function(d) { return genMap(d); })
                   .attr("y", function(d) { return fitnessMap(d); })
                   .text(function(d) { return d.fitness.toFixed(2); });

    svg.append("text").attr("x", miniX)
                      .attr("y", miniY - 15)
                      .style("text-anchor", "middle")
                      .text("fitness");

    svg.append("text").attr("x", miniX + miniWidth + 5)
                      .attr("y", miniY  + miniHeight + 5)
                      .style("text-anchor", "start")
                      .text("gen");
}

fs.writeFile("out/airfoil.svg", d3n.svgString()); 

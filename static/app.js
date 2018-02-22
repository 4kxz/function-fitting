var size = 740;
var pad = 40;
var fmt = d3.format(".3n");
var points = [
    {x: 2, y: 2},
    {x: 5, y: 4},
    {x: 7, y: 5},
    {x: 8, y: 4},
];
var fits = [];

var x = {
    domain: [0, 10],
    range: [pad, size - pad],
};
var y = {
    domain: [10, 0],
    range: [pad, size - pad],
};
x.scale = d3.scaleLinear().domain(x.domain).range(x.range);
y.scale = d3.scaleLinear().domain(y.domain).range(y.range);
x.axis = d3.axisBottom(x.scale);
y.axis = d3.axisLeft(y.scale);

var svg = d3.select("body")
    .append("div")
    .attr("class", "view")
    .append("svg")
    .attr("width", size)
    .attr("height", size)
;

var svgPoints = svg.append("g")
    .attr("class", "points")
;

var svgFits = svg.append("g")
    .attr("class", "fits")
;

var table = d3.select("body")
    .append("div")
    .attr("class", "panel")
    .append("table")
    ;

svg.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0, ${size - pad})`)
    .call(x.axis)
;

svg.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(${pad}, 0)`)
    .call(y.axis)
;

var fitLine = d3.line()
    .x(d => x.scale(d.x))
    .y(d => y.scale(d.y))
;

function drawPoints(data) {
    var circles = svgPoints.selectAll("circle").data(data);
    circles.enter().append("circle")
        .attr("class", "point")
        .attr("r", 4)
        .attr("cx", d => x.scale(d.x))
        .attr("cy", d => y.scale(d.y))
    ;
    circles.exit().remove();
    var rows = table.selectAll("tr")
        .data(data)
        .enter()
        .append("tr");
    var cells = rows.selectAll("td")
        .data(d => [d.x, d.y])
        .enter().append("td")
        .text(d => fmt(d));
};

function drawFits(data) {
    var paths = svgFits.selectAll("path").data(data);
    paths.enter().append("path")
        .attr("stroke", d => d.color)
        .attr("d", d => fitLine(d.path))
    ;
    paths.transition()
        .duration(1000)
        .attr("d", d => fitLine(d.path))
    ;
    paths.exit().remove();
};

function updateFits(error, response) {
    console.log(response.color);
    console.log(fits);
    fits[response.index] = response;
    drawFits(fits);
};

function update() {
    var postData = JSON.stringify({
        domain: x.domain,
        points: points,
    });
    d3.json('/polynomial/1')
        .header("Content-Type", "application/json")
        .post(postData, updateFits)
    ;
    d3.json('/polynomial/2')
        .header("Content-Type", "application/json")
        .post(postData, updateFits)
    ;
    d3.json('/polynomial/3')
        .header("Content-Type", "application/json")
        .post(postData, updateFits)
    ;
    drawPoints(points);
}

update();

svg.on('click', function() {
    let coord = d3.mouse(this);
    points.push({
        x: x.scale.invert(coord[0]),
        y: y.scale.invert(coord[1]),
    });
    update();
});

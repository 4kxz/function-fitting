var width = 640;
var height = 640;
var pad = 40;
var xDomain = [0, 10];
var yDomain = [10, 0];

var xScale = d3.scale.linear().domain(xDomain).range([pad, width - pad]);
var yScale = d3.scale.linear().domain(yDomain).range([pad, height - pad]);
var xAxis = d3.svg.axis().scale(xScale).orient("bottom");
var yAxis = d3.svg.axis().scale(yScale).orient("left");
var points = [
    {x: 2, y: 2},
    {x: 5, y: 4},
    {x: 8, y: 5},
];

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

svg.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0, ${height - pad})`)
    .call(xAxis);

svg.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(${pad}, 0)`)
    .call(yAxis);

var line = d3.svg.line()
    .x(d => xScale(d.x))
    .y(d => yScale(d.y))
    .interpolate('linear')
    ;

function draw(points, path) {
    var circle = svg.selectAll("circle").data(points);
    circle.exit().remove();
    circle.enter().append("circle");
    circle
        .attr("class", "circle")
        .attr("r", 5)
        .attr("cx", d => xScale(d.x))
        .attr("cy", d => yScale(d.y))
        ;
    svg.selectAll(".fit").remove();
    svg.append("path")
        .attr("class", "fit")
        .attr("d", line(path))
        .attr("fill", "transparent")
        ;
}

function fit(points) {
    var postData = JSON.stringify({
        domain: xDomain,
        points: points,
    });
    d3.json('/polynomial')
        .header("Content-Type", "application/json")
        .post(postData, function(error, response) {
            draw(points, response);
        });
}

fit(points);


svg.on('click', function() {
    var [x, y] = d3.mouse(this);
    points.push({
        x: xScale.invert(x),
        y: yScale.invert(y),
    });
    fit(points);
});

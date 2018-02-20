var width = 640;
var height = 360;
var pad = 40;

var xScale = d3.scale.linear().domain([0, 1]).range([pad, width - pad]);
var yScale = d3.scale.linear().domain([1, 0]).range([pad, height - pad]);
var xAxis = d3.svg.axis().scale(xScale).orient("bottom");
var yAxis = d3.svg.axis().scale(yScale).orient("left");
var points = [
    {x: 0.2, y: 0.2},
    {x: 0.5, y: 0.4},
    {x: 0.8, y: 0.5},
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

function draw(points, path) {
    var circle = svg.selectAll("circle").data(points);
    circle.exit().remove();
    circle.enter().append("circle");
    circle
        .attr("class", "circle")
        .attr("cx", d => xScale(d.x))
        .attr("cy", d => yScale(d.y))
        .attr("r", 2);
    svg.selectAll(".fit").remove();
    svg.append("path")
        .attr("class", "fit")
        .attr("d", line(path))
        .attr("stroke", "blue");
    // svg.append('path')
    //     .attr("d", line(path))
    //     .attr("stroke", "blue");
}

function fit(points) {
    d3.json('/linear')
        .header("Content-Type", "application/json")
        .post(JSON.stringify(points), function(error, data) {
            console.log(data);
            draw(points, data);
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

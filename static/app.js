
var state = {
    view: {
        size: 500,
        pad: 40,
        fmt: d3.format(".3n"),
        x: {
            domain: [0, 10],
            axis: d3.axisBottom,
            transform: (size, pad) => `translate(0, ${size - pad})`,
        },
        y: {
            domain: [10, 0],
            axis: d3.axisLeft,
            transform: (size, pad) => `translate(${pad}, 0)`,
        },
    },
    points: [
        {x: 2, y: 2},
        {x: 5, y: 4},
        {x: 7, y: 5},
        {x: 8, y: 4},
    ],
    fits: [],
};

computeSize(state);
drawView(state.view);
drawPoints(state);

function computeSize(state) {
    let width = document.getElementById("view").offsetWidth;
    let height = document.getElementById("view").offsetHeight;
    state.view.size = Math.min(width, height);
    state.view.range = [state.view.pad, state.view.size - state.view.pad];
}

function drawView(state) {
    var view = d3.select("#view");
    var svg = view.selectAll("svg")
        .data([state])
        .enter()
        .append("svg")
        .attr("width", d => d.size)
        .attr("height", d => d.size)
    ;
    var axes = svg.selectAll(".axis")
        .data([state.x, state.y])
        .enter()
        .append("g")
        .attr("class", "axis")
        .attr("transform", d => d.transform(state.size, state.pad))
        .each(function(d) {
            d.scale = d3.scaleLinear().domain(d.domain).range(state.range);
            d.axis(d.scale)(d3.select(this));
        })
    ;
};

// var svgPoints = svg.append("g")
//     .attr("class", "points")
// ;
//
// var svgFits = svg.append("g")
//     .attr("class", "fits")
// ;
//
// var table = d3.select("body")
//     .append("div")
//     .attr("class", "panel")
//     .append("table")
//     ;
//
// svg.append("g")
//     .attr("class", "axis")
//     .attr("transform", `translate(0, ${chart.size - chart.pad})`)
//     .call(x.axis)
// ;
//
// svg.append("g")
//     .attr("class", "axis")
//     .attr("transform", `translate(${chart.pad}, 0)`)
//     .call(y.axis)
// ;
//
// var fitLine = d3.line()
//     .x(d => x.scale(d.x))
//     .y(d => y.scale(d.y))
// ;

function drawPoints(state) {
    var svg = d3.select("svg");
    var circles = svg.selectAll("circle").data(state.points);
    circles.enter().append("circle")
        .attr("class", "point")
        .attr("r", 4)
        .attr("cx", d => state.view.x.scale(d.x))
        .attr("cy", d => state.view.y.scale(d.y))
    ;
    circles.exit().remove();
    // var rows = table.selectAll("tr").data(data).enter()
    //     .append("tr")
    // ;
    // var cells = rows.selectAll("td").data(d => [d.x, d.y]).enter()
    //     .append("td")
    //     .text(d => fmt(d))
    // ;
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

// update();
//
// svg.on('click', function() {
//     let coord = d3.mouse(this);
//     points.push({
//         x: x.scale.invert(coord[0]),
//         y: y.scale.invert(coord[1]),
//     });
//     update();
// });

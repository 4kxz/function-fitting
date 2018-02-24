
var CONF = {
    pad: 40,
    fmt: d3.format(".3n"),
    size: function() {
        let width = document.getElementById("view").offsetWidth;
        let height = document.getElementById("view").offsetHeight;
        return Math.min(width, height);
    },
    range: function() {
        return [this.pad, this.size() - this.pad];
    },
    axes: [{
        axis: d3.axisBottom,
        transform: (size, pad) => `translate(0, ${size - pad})`,
    }, {
        axis: d3.axisLeft,
        transform: (size, pad) => `translate(${pad}, 0)`,
    }],

};

var DATA = {
    domain: {
        x: [0, 10],
        y: [10, 0],
    },
    points: [
        {x: 2, y: 2},
        {x: 5, y: 4},
        {x: 7, y: 5},
        {x: 8, y: 4},
    ],
    fits: [],
};


drawView(DATA, CONF);
drawPoints(DATA, CONF);
updateFits(DATA, CONF);

d3.select("svg").on('click', function() {
    let [x, y] = d3.mouse(this);
    DATA.points.push({
        x: CONF.axes[0].scale.invert(x),
        y: CONF.axes[1].scale.invert(y),
    });
    drawPoints(DATA, CONF);
    updateFits(DATA, CONF);
});

function updateFits(data, conf) {
    Promise.all([
        getFit('/polynomial/1', data),
        getFit('/polynomial/2', data),
        getFit('/polynomial/4', data),
    ]).then(results => {
        data.fits = results;
        drawFits(data, conf);
    });
};

function getFit(url, data) {
    var request = {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
        },
        body: JSON.stringify(data),
    };
    return fetch(url, request).then(response => response.json());
};

function drawView(data, conf) {
    var view = d3.select("#view");
    var size = conf.size();
    var svg = view.selectAll("svg")
        .data([conf])
        .enter()
        .append("svg")
        .attr("width", d => size)
        .attr("height", d => size)
    ;
    var axes = svg.selectAll(".axis")
        .data(conf.axes)
        .enter()
        .append("g")
        .attr("class", "axis")
        .attr("transform", d => d.transform(size, conf.pad))
        .each(function(d, i) {
            let domain = data.domain['xy'[i]];
            let range = conf.range();
            d.scale = d3.scaleLinear().domain(domain).range(range);
            d.axis(d.scale)(d3.select(this));
        })
    ;
};

function drawPoints(data, conf) {
    var svg = d3.select("svg");
    var circles = svg.selectAll("circle.point").data(data.points);
    circles.enter()
        .append("circle")
        .attr("class", "point")
        .attr("r", 3)
        .attr("cx", d => conf.axes[0].scale(d.x))
        .attr("cy", d => conf.axes[1].scale(d.y))
    ;
    circles.exit().remove();
};

function drawFits(data, conf) {
    var svg = d3.select("svg");
    var paths = svg.selectAll("path.fit").data(data.fits);
    var fitLine = d3.line()
        .x(d => conf.axes[0].scale(d.x))
        .y(d => conf.axes[1].scale(d.y))
    ;
    paths.enter().append("path")
        .attr("class", "fit")
        .attr("stroke", d => d.color)
        .attr("d", d => fitLine(d.path))
    ;
    paths.transition()
        .duration(1000)
        .attr("d", d => fitLine(d.path))
    ;
    paths.exit().remove();
};


class State {

    constructor() {
        this.data = {
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
    }

    updateFits(server) {
        return Promise.all([
            server.getFit('/polynomial/1', this.data),
            server.getFit('/polynomial/2', this.data),
            server.getFit('/polynomial/4', this.data),
        ]).then(results => {
            this.data.fits = results;
        });
    }

    addPoint(point) {
        this.data.points.push(point);
    }

}

class Server {

    getFit(url, data) {
        var request = {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
            },
            body: JSON.stringify(data),
        };
        return fetch(url, request).then(response => response.json());
    }

}

class View {

    constructor(data) {
        this.container = document.getElementById("view");
        this.view = d3.select("#view");
        this.size = this.computeSize();
        this.range = this.computeRange();
        this.pad = 40;
        this.axes = [{
            axis: d3.axisBottom,
            transform: (size, pad) => `translate(0, ${size - pad})`,
        }, {
            axis: d3.axisLeft,
            transform: (size, pad) => `translate(${pad}, 0)`,
        }];
        this.svg = this.view.selectAll("svg")
            .data([1])
            .enter()
            .append("svg")
            .attr("width", d => this.size)
            .attr("height", d => this.size)
        ;
        var range = this.computeRange();
        this.svg.selectAll(".axis")
            .data(this.axes)
            .enter()
            .append("g")
            .attr("class", "axis")
            .attr("transform", d => d.transform(this.size, this.pad))
            .each(function(d, i) {
                let domain = data.domain['xy'[i]];
                d.scale = d3.scaleLinear().domain(domain).range(range);
                d.axis(d.scale)(d3.select(this));
            })
        ;
    }

    computeSize() {
        let width = this.container.offsetWidth;
        let height = this.container.offsetHeight;
        return Math.min(width, height);
    }

    computeRange() {
        return [this.pad, this.size - this.pad];
    }

    drawPoints(data) {
        this.circles = this.svg.selectAll("circle.point").data(data.points);
        this.circles.enter()
            .append("circle")
            .attr("class", "point")
            .attr("r", 3)
            .attr("cx", d => this.axes[0].scale(d.x))
            .attr("cy", d => this.axes[1].scale(d.y))
        ;
        this.circles.exit().remove();
    }

    drawFits(data) {
        this.paths = this.svg.selectAll("path.fit").data(data.fits);
        var fitLine = d3.line()
            .x(d => this.axes[0].scale(d.x))
            .y(d => this.axes[1].scale(d.y))
        ;
        this.paths.enter().append("path")
            .attr("class", "fit")
            .attr("stroke", d => d.color)
            .attr("d", d => fitLine(d.path))
        ;
        this.paths.transition()
            .duration(1000)
            .attr("d", d => fitLine(d.path))
        ;
        this.paths.exit().remove();
    }

    mousePoint(coordinates) {
        return {
            x: this.axes[0].scale.invert(coordinates[0]),
            y: this.axes[1].scale.invert(coordinates[1]),
        }
    }

}

var STATE = new State();
var SERVER = new Server();
var VIEW = new View(STATE.data);

VIEW.drawPoints(STATE.data);
STATE.updateFits(SERVER).then(() => VIEW.drawFits(STATE.data));

d3.select("svg").on('click', function() {
    var point = VIEW.mousePoint(d3.mouse(this));
    STATE.addPoint(point);
    VIEW.drawPoints(STATE.data);
    STATE.updateFits(SERVER).then(() => VIEW.drawFits(STATE.data));
});

var DELAY = 1000;

class Server {

    getFit(url, state) {
        var request = {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
            },
            body: JSON.stringify(state),
        };
        return fetch(url, request).then(response => response.json());
    }

}

class State {

    constructor(min, max) {
        this.server = new Server();
        this.domain = {
            x: [min, max],
            y: [min, max],
        };
        this.points = [];
        this.functions = [];
        this.fits = [];
    }

    update() {
        console.log('update');
        return Promise.all([
            this.updateFits(),
        ]).then(() => this);
    }

    addFunction(url) {
        this.functions.push(url);
    }

    updateFits() {
        console.log('updateFits');
        var getFits = this.functions.map(x => this.server.getFit(x, this));
        var promise = Promise.all(getFits)
            .then(results => {
                this.fits = results.filter(x => !x.empty);
                return this;
            })
        ;
        return promise;
    }

    addPoint(point) {
        console.log('addPoint');
        return new Promise((resolve, reject) => {
            if (point.x < this.domain.x[0] ||
                point.x > this.domain.x[1] ||
                point.y < this.domain.y[0] ||
                point.y > this.domain.y[1]) {
                reject("not in the domain");
            } else {
                this.points.push(point);
                resolve(this);
            }
        });
    }

    removePoint(index) {
        console.log('removePoint');
        return new Promise((resolve, reject) => {
            if (index >= 0 && index < this.points.length) {
                delete this.points[index];
                resolve(this);
            } else {
                reject("cant remove");
            }
        });
    }

}

class View {

    constructor(state) {
        this.div = d3.select('#view');
        this.size = this.computeSize();
        this.range = this.computeRange();
        this.pad = 40;
        this.axes = [{
            axis: d3.axisBottom,
            transform: (size, pad) => `translate(0, ${size - pad})`,
            reverse: false,
        }, {
            axis: d3.axisLeft,
            transform: (size, pad) => `translate(${pad}, 0)`,
            reverse: true,
        }];
        this.svg = this.div.selectAll('svg')
            .data([this])
            .enter()
            .append('svg')
            .attr('width', d => d.size)
            .attr('height', d => d.size)
        ;
        var that = this;
        this.svg.selectAll('.axis')
            .data(this.axes)
            .enter()
            .append('g')
            .attr('class', 'axis')
            .attr('transform', d => d.transform(this.size, this.pad))
            .each(function(d, i) {
                let domain = state.domain['xy'[i]];
                if (d.reverse) {
                    domain = [domain[1], domain[0]];
                }
                let range = that.computeRange();
                d.scale = d3.scaleLinear().domain(domain).range(range);
                d.axis(d.scale)(d3.select(this));
            })
        ;
    }

    computeSize() {
        let width = this.div.node().offsetWidth;
        let height = this.div.node().offsetHeight;
        return Math.min(width, height);
    }

    computeRange() {
        return [this.pad, this.size - this.pad];
    }

    draw(state) {
        console.log('draw');
        this.drawPoints(state);
        this.drawFits(state);
    }

    drawPoints(state) {
        console.log('drawPoints');
        this.circles = this.svg.selectAll('circle.point')
            .data(state.points);
            // .data(state.points, d => `${d.x},${d.y}`);
        this.circles.enter()
            .append('circle')
            .attr('class', 'point')
            .attr('r', 3)
            .attr('cx', d => this.axes[0].scale(d.x))
            .attr('cy', d => this.axes[1].scale(d.y))
            .on('click', (d, i) => {
                d3.event.stopPropagation();
                state.removePoint(i)
                    .then(() => this.drawPoints(state))
                    .then(() => state.update())
                    .then(() => this.draw(state))
                ;
            })
        ;
        this.circles.transition()
            .duration(DELAY)
            .style('display', d => d === undefined ? 'none' : 'default')
        ;
        this.circles.exit().remove();
    }

    drawFits(state) {
        console.log('drawFits');
        this.paths = this.svg.selectAll('path.fit').data(state.fits);
        var fitLine = d3.line()
            .x(d => this.axes[0].scale(d.x))
            .y(d => this.axes[1].scale(d.y))
            .curve(d3.curveNatural)
        ;
        this.paths.enter().append('path')
            .attr('class', 'fit')
            .attr('stroke', (d, i) => d3.schemeCategory10[i])
            .attr('d', d => fitLine(d.path))
        ;
        this.paths.transition()
            .duration(DELAY)
            .attr('d', d => fitLine(d.path))
        ;
        this.paths.exit().remove();
    }

    mousePoint(svg) {
        console.log('mousePoint');
        var coordinates = d3.mouse(svg);
        return {
            x: this.axes[0].scale.invert(coordinates[0]),
            y: this.axes[1].scale.invert(coordinates[1]),
        };
    }

}

var state = new State(0, 10);
var view = new View(state);

state.addFunction('/polynomial/1');
state.addFunction('/polynomial/2');
state.addFunction('/polynomial/3');

Promise.all([
    state.addPoint({x: 2, y: 3}),
    state.addPoint({x: 4, y: 6}),
    state.addPoint({x: 6, y: 5}),
    state.addPoint({x: 8, y: 6}),
])
    .then(() => view.drawPoints(state))
    .then(() => state.update())
    .then(() => view.drawFits(state))
;

view.svg.on('click', function() {
    var p = view.mousePoint(this);
    state.addPoint(p)
        .then(() => view.drawPoints(state))
        .then(() => state.update())
        .then(() => view.draw(state))
    ;
});

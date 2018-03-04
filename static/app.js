var DELAY = 1200;

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

    constructor(x, y) {
        this.server = new Server();
        this.domain = {
            x: x,
            y: y,
        };
        this.points = [];
        this.pointsNextId = 0;
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
        console.log('addFunction');
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
                point.id = this.pointsNextId++;
                this.points.push(point);
                resolve(this);
            }
        });
    }

    movePoint(point, x, y) {
        console.log('movePoint');
        return new Promise((resolve, reject) => {
            if (x < this.domain.x[0] ||
                x > this.domain.x[1] ||
                y < this.domain.y[0] ||
                y > this.domain.y[1]) {
                reject("not in the domain");
            } else {
                point.x = x;
                point.y = y;
                resolve(this);
            }
        });
    }

    removePoint(point) {
        console.log('removePoint');
        return new Promise((resolve, reject) => {
            let index = this.points.indexOf(point);
            if (index > -1) {
                this.points.splice(index, 1);
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
        this.fmt = d3.format('.3r');
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
        var that = this;
        this.svg.on('click', function() {
            var p = that.mousePoint(this);
            state.addPoint(p)
                .then(() => that.drawPoints(state))
                .then(() => state.update())
                .then(() => that.draw(state))
            ;
        });
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
        var that = this;
        var drag = d3.drag().on('drag', function (d) {
            var p = that.mousePoint(this);
            d3.select(this)
                .attr('cx', d => that.axes[0].scale(p.x))
                .attr('cy', d => that.axes[1].scale(p.y))
            ;
        }).on('end', function (d) {
            var p = that.mousePoint(this);
            state.movePoint(d, p.x, p.y)
                .then(() => state.update())
                .then(() => that.draw(state))
            ;
        });

        this.circles = this.svg.selectAll('circle.point')
            .data(state.points, d => d.id);
        this.circles.enter()
            .append('circle')
            .attr('class', 'point')
            .attr('r', 3)
            .attr('cx', d => this.axes[0].scale(d.x))
            .attr('cy', d => this.axes[1].scale(d.y))
            .call(drag)
            .on('click', d => {
                d3.event.stopPropagation();
                state.removePoint(d)
                    .then(() => this.drawPoints(state))
                    .then(() => state.update())
                    .then(() => this.draw(state))
                ;
            })
            .append('title')
            .text(d => `(${this.fmt(d.x)}, ${this.fmt(d.y)})`)
        ;
        this.circles.transition()
            .attr('cx', d => this.axes[0].scale(d.x))
            .attr('cy', d => this.axes[1].scale(d.y))
            .select('title')
            .text(d => `(${this.fmt(d.x)}, ${this.fmt(d.y)})`)
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
        var coordinates = d3.mouse(svg);
        return {
            x: this.axes[0].scale.invert(coordinates[0]),
            y: this.axes[1].scale.invert(coordinates[1]),
        };
    }

}

var state = new State([0, 10], [0, 100]);
var view = new View(state);

state.addFunction('/polynomial/1');
state.addFunction('/polynomial/2');

d3.csv('/static/example.csv', data => {
    data.forEach(d => state.addPoint({x: +d.x, y: +d.y}));
    state.update().then(() => view.draw(state));
})

from flask import Flask, jsonify, request, send_from_directory
import numpy as np

app = Flask(__name__)

COLOR = '#F00', '#B00', '#800'


@app.route('/')
def index():
    return app.send_static_file('index.html')


@app.route('/static/<path:path>')
def static_files(path):
    return send_from_directory('static', path)


def process_request():
    points = request.json['points']
    return {
        'domain': request.json['domain'],
        'x': [p['x'] for p in points],
        'y': [p['y'] for p in points],
    }


@app.route('/polynomial/<int:degree>', methods=['POST'])
def polynomial(degree):
    data = process_request()
    z = np.polyfit(data['x'], data['y'], degree)
    f = np.poly1d(z)
    x = np.linspace(*data['domain'], 100)
    y = f(x)
    return jsonify({
        'index': degree - 1,
        'color': COLOR[degree - 1],
        'path': [{'x': x, 'y': y} for x, y in zip(x, y)],
    })

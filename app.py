from flask import Flask, jsonify, request, send_from_directory
import numpy as np

app = Flask(__name__)


@app.route('/')
def index():
    return app.send_static_file('index.html')


@app.route('/static/<path:path>')
def static_files(path):
    return send_from_directory('static', path)


@app.route('/polynomial/<int:degree>', methods=['POST'])
def polynomial(degree):
    if not request.json['points']:
        return jsonify({'empty': True})

    v = [p for p in request.json['points'] if p is not None]
    x = [p['x'] for p in v]
    y = [p['y'] for p in v]
    p = np.poly1d(np.polyfit(x, y, degree))
    x_min, x_max = request.json['domain']['x']
    return jsonify({
        'degree': degree,
        'path': [{'x': x, 'y': p(x)} for x in np.linspace(x_min, x_max, 32)],
    })

from flask import Flask, jsonify, request, send_from_directory
import numpy as np

app = Flask(__name__)

COLOR = '#F00', '#B00', '#B00', '#B00', '#B00'


@app.route('/')
def index():
    return app.send_static_file('index.html')


@app.route('/static/<path:path>')
def static_files(path):
    return send_from_directory('static', path)


@app.route('/polynomial/<int:degree>', methods=['POST'])
def polynomial(degree):
    data = request.json
    x = [p['x'] for p in data['points']]
    y = [p['y'] for p in data['points']]
    p = np.poly1d(np.polyfit(x, y, degree))
    x_min, x_max = data['domain']['x']
    return jsonify({
        'degree': degree,
        'color': COLOR[degree - 1],
        'path': [{'x': x, 'y': p(x)} for x in np.linspace(x_min, x_max, 100)],
    })

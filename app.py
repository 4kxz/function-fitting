from flask import Flask, jsonify, request, send_from_directory
from sklearn.linear_model import LinearRegression
import numpy as np

app = Flask(__name__)


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


@app.route('/linear', methods=['POST'])
def linear():
    regressor = LinearRegression()
    data = process_request()
    x = np.expand_dims(data['x'], axis=1)
    regressor.fit(x, data['y'])
    c = regressor.coef_[0]
    i = regressor.intercept_
    print(c, i)
    path = [
        {'x': 0, 'y': i},
        {'x': 1, 'y': c + i},
    ]
    return jsonify(path)


@app.route('/polynomial', methods=['POST'])
def polynomial():
    data = process_request()
    z = np.polyfit(data['x'], data['y'], 3)
    f = np.poly1d(z)
    x = np.linspace(*data['domain'], 100)
    y = f(x)
    return jsonify([{'x': x, 'y': y} for x, y in zip(x, y)])

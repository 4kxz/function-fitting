from flask import Flask, jsonify, request, send_from_directory
from sklearn.linear_model import LinearRegression

app = Flask(__name__)


@app.route('/')
def index():
    return app.send_static_file('index.html')


@app.route('/static/<path:path>')
def static_files(path):
    return send_from_directory('static', path)


@app.route('/linear', methods=['POST'])
def linear_regression():
    regressor = LinearRegression()
    x = [[d['x']] for d in request.json]
    y = [d['y'] for d in request.json]
    print(x)
    print(y)
    regressor.fit(x, y)
    c = regressor.coef_[0]
    i = regressor.intercept_
    print(c, i)
    path = [
        {'x': 0, 'y': i},
        {'x': 1, 'y': c + i},
    ]
    return jsonify(path)

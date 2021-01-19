import os
import json
from flask_cors import CORS

# Load Flask app
from flask import Flask
app = Flask("play2vec")
cors = CORS(app)
app.config["CORS_HEADERS"] = "Content-Type"

with open("config/app.config") as f:
    config = json.load(f)
    
app.config.update(config)

with app.app_context():
    import endpoint
    print("\033[1m" + "Database: {}".format(app.config["DATABASE"]) + "\033[0m")
    app.register_blueprint(endpoint.bp, url_prefix=app.config["APPLICATION_ROOT"])

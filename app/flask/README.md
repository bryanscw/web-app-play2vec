# Flask
This folder contains the flask application to be used as the backend for the web appliction for play2vec.

## Dependencies
The application requires the following dependencies:
* Python 3.7
* Tensorflow 1.15.2
* Tkinter
* Flask 
* Flask-api 
* Flask-cors
* Matplotlib 
* Sci-kit learn
* Uwsgi
* ImageIO

### Configuration
The configuration for the flask application can be found in [app.config](config/app.config), whereas the configurations for the test can be found in [config/app.test.config](app.test.config).

### Endpoints
The endpoints for the flask application can be found in [endpoint.py](endpoint.py). The endpoints are documented in [play2vec.postman_collection.json](doc/play2vec.postman_collection.json). This file can be opened in Postman.

### Helper functions & Implementations
The functions used to help tidy up endpoint.py can be found in [helper_function.py](util/helper_function.py).

The following files contain the implementaions regarding how the written function in play2vec should be used. These files have been updated to remove the warnings thrown by Tensorflow.
* [build.py](util/build.py)
* [train.py](util/train.py)
* [test.py](util/test.py)

## Deployment
To deploy the flask application, execute the following command:
```
flask run
```

## Test
The test cases for this flask application can be found in [app.test.py](app.test.py).

Execute the following command to test:
```
python3 app.test.py
```

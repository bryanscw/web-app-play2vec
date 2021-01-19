# React
This folder contains the react application to be used as the frontend for the web appliction for play2vec.

## Dependencies
The application requires the following dependencies:
* Npm 6
* Node JS
* Nginx

Execute the following commands to install the requried dependencies:
```
# Install dependencies
sudo apt install nginx nodejs npm -y

# Update npm to npm 6
npm install npm@6 -g
```

### Configuration
The configuration for the react application can be found in [Config.js](src/config/Config.js). 

## Deployment

To deploy the react application, execute the following commands:
```
# Install requried libraries
npm install

# Start react application
REACT_APP_API_ADDR=<backend IP> npm start
```
where <backend IP> is the IP address of the node running the backend. 

Upon successful deployment, the default browser should automatically open up the main page of the react application.

## Test
The test cases for the react application can be found in [App.test.js](App.test.js).

Execute the following command to test:
```
npm test
```

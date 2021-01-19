# Play2vec Web Application
This repository includes applications of the base project, play2vec, and the source code of the base project. 

To find out more about the base project, play2vec, refer to the README.md file [here](src/README.md). 

Note that the source code of the base project has been edited to use tensorflow-cpu. The original project using tensorflow-gpu 1.8 can be found [here](https://github.com/zhengwang125/play2vec).

## Dependencies
To run the applications as processes, refer to the README.md file in each application folder.
* [Flask](app/flask/README.md)
* [React](app/react/README.md)

To run the applications in Docker, the following dependencies are required:
* [Docker](https://docs.docker.com/engine/install/ubuntu/)
* [Docker-compose](https://linuxize.com/post/how-to-install-and-use-docker-compose-on-ubuntu-18-04/)

## Deployment

Note: The steps below are based on the assumption that the application is being deployed on the localhost. If deploying onto a remote node, change the API_ADDR value in [infra/docker-compose.yml](infra/docker-compose.yml) to the remote node IP address.

The Makefile is created to ease the steps of deployment. To use it, the following dependencies are required:
* Build-essential

Execute the following command to install the required dependencies:
```
sudo apt install build-essential -y
```

From the Makefile, the following commands are available:
* all
* image
* deploy
* stop
* restart


```
# This command will execute stop, image and deploy steps.
sudo make all

# This command will build the required Docker images from the Dockerfiles specified by docker-compose.yml,
# in the infra folder.
sudo make image

# This command will run the Docker images that are built, allowing both the React frontend 
# and Flask backend to be accessed.
sudo make deploy

# This command will stop and remove the specified services in docker-compose.yml.
sudo make stop

# This command will stop and restart the specified services in docker-compose.yml.
sudo make restart
```

Once the application is deployed, access the frontend of this project by accessing <IP of node> on your browser. The frontend has been configured to listen to the http port (port 80) for requests.

## Note
There might be some warnings popping up in the building of the frontend image, but those can be ignored.
```
npm WARN optional SKIPPING OPTIONAL DEPENDENCY: fsevents@1.2.13 (node_modules/webpack-dev-server/node_modules/fsevents):
npm WARN notsup SKIPPING OPTIONAL DEPENDENCY: Unsupported platform for fsevents@1.2.13: wanted {"os":"darwin","arch":"any"} (current: {"os":"linux","arch":"x64"})
npm WARN optional SKIPPING OPTIONAL DEPENDENCY: fsevents@1.2.13 (node_modules/watchpack-chokidar2/node_modules/fsevents):
npm WARN notsup SKIPPING OPTIONAL DEPENDENCY: Unsupported platform for fsevents@1.2.13: wanted {"os":"darwin","arch":"any"} (current: {"os":"linux","arch":"x64"})
npm WARN optional SKIPPING OPTIONAL DEPENDENCY: fsevents@1.2.13 (node_modules/jest-haste-map/node_modules/fsevents):
npm WARN notsup SKIPPING OPTIONAL DEPENDENCY: Unsupported platform for fsevents@1.2.13: wanted {"os":"darwin","arch":"any"} (current: {"os":"linux","arch":"x64"})
npm WARN optional SKIPPING OPTIONAL DEPENDENCY: fsevents@2.1.2 (node_modules/fsevents):
npm WARN notsup SKIPPING OPTIONAL DEPENDENCY: Unsupported platform for fsevents@2.1.2: wanted {"os":"darwin","arch":"any"} (current: {"os":"linux","arch":"x64"})
```

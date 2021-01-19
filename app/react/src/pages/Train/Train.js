import React from "react";
import { OverlayTrigger, Tooltip , Button, Panel, Alert, Form, Row, FormGroup, ControlLabel, FormControl, Modal, ListGroupItem, ListGroup, ProgressBar } from "react-bootstrap";
import Config from "../../config/Config";
import fetch from "../../helper/FetchWithTimeOut";
import "./Train.css"


class Train extends React.Component {
    
    constructor(props){
        super(props);
        this.state = {
            datasets: [],
            build_file: false,
            training: false,
            train: false,
            showBuild: false,
            showTrain: false,
            fileName: null,
            showDataset: 0,
            button: 0,
            interval: null,
            
            trainFile: null,
            statusErr: false,
            statusMsg: null,
            trainSuccessMsg: false,
            trainErrMsg: false,
            
            epoch: Config.VALUE.EPOCH,
            batch_size: Config.VALUE.BATCH_SIZE,
            learn_rate: Config.VALUE.LEARN_RATE,
            
            corpus: null,
            noise_ogm_train_data: null,
            train_noise_data: null,
            ogm_train_data: null,
            ogm_train_key: null,
                
            showBar: false,
            trainVal: 0,
            daeVal: 0,
            progressErrMsg: false,
            
            downloadErrMsg: false
        }
        this.handleDatasetShow = this.handleDatasetShow.bind(this);
        this.handleDatasetClose = this.handleDatasetClose.bind(this);
        this.getStatus = this.getStatus.bind(this);
        this.clickStatus = this.clickStatus.bind(this);
    }
    
    componentWillMount(){
        // Fetch build files
        fetch(Config.API.FILE + "build", {
            method: "GET",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
            },
        }, Config.TIMEOUT).then((resp) => {
            if (resp.status === 404) {
                return null;
            }
            else if (resp.status === 200){
                return resp.json();
            }
        }
        ).then((jsonResp) => {
            if (jsonResp === null){
                this.setState({
                    datasets: null
                })
            }
            else {
                this.setState({
                    datasets: jsonResp.datasets
                })
            }
        }).catch((e) => {
            this.setState({
                fetchErr: true
            });
        })
    }
    
    componentDidMount(){
        if (this.state.showBar){
            this.getStatus()
            
        }
    }
    
    clickStatus = e =>{
        // Fetch train status
        var tmp = e.target.value
        
        var dataset = this.state.datasets[e.target.value - 1];
        this.setState({
            trainFile: dataset
        })
        
        fetch(
            Config.API.STATUS + "train/" + dataset, {
                method: "GET",
                headers: {
                    "Accept": "application/json"
                }
            },
            Config.TIMEOUT
        ).then((resp) => {
            if (resp.status === 200){
                this.setState({
                    fileName: dataset,
                    showBar: true,
                    train: false,
                    button: this.state.button - tmp - 1,
                    interval: setInterval(this.getStatus, Config.INTERVAL),
                    statusErr: false
                });
            }
            else {
                resp.json().then((respJson) => {
                    this.setState({
                        statusErr: true,
                        statusMsg: respJson.message
                    })
                })
            }
        }).catch((e) => {
            this.setState({
                statusErr: true,
                statusMsg: e.message
            })
        })
    }
    
    getStatus(){
        // Fetch train status
        fetch(
            Config.API.STATUS + "train/" + this.state.trainFile, {
                method: "GET",
                headers: {
                    "Accept": "application/json"
                }
            },
            Config.TIMEOUT
        ).then((resp) => {
            return resp.json()
            
        }).then((jsonResp) => {
            if (jsonResp.filename){
                this.setState({
                    showBar: false,
                    fileName: jsonResp.filename,
                    train: true,
                })
                clearInterval(this.state.interval);
            }
            else {
                var array = JSON.parse(jsonResp.progress);
                this.setState({
                    showBar: true,
                    trainVal: array[0],
                    daeVal: array[1]
                })
                if (this.state.daeVal > 0){
                    this.setState({
                        trainVal: 1
                    })
                }
            }
        }).catch((e) => {
            this.setState({
                progressErrMsg: true
            })
        })
    }
    
    handleDatasetShow = e =>{
        this.setState({
            showDataset: this.state.showDataset + e.target.value
        })
    }
    
    handleDatasetClose = e =>{
        this.setState({
            showDataset: this.state.showDataset - e.target.value
        })
    }
    
    renderDataset(){
        if (!this.state.datasets || this.state.datasets.length === 0){
            return (
                <p>No build file found.</p>
            )
        }
        var rows = []
        
        for (var i = 0; i < this.state.datasets.length; i++){
            rows.push(
                <ListGroupItem>
                {this.state.datasets[i]}
                <Button bsSize="xsmall" className="pull-right" bsStyle="primary" value={i+1} onClick={this.handleDatasetShow}>
                    {this.state.button > i && this.state.button < i + 2? "Training...": "Select"}
                  </Button>
                 <Button bsSize="xsmall" className="pull-right" value={i+1} onClick={this.clickStatus}>
                   Status
                 </Button>

                  <Modal show={this.state.showDataset > i} value={i+1} onHide={this.handleDatasetClose}>
                  
                    <Modal.Header>
                      <Modal.Title>Confirm action</Modal.Title>
                    </Modal.Header>
                    
                    <Modal.Body>Train using {this.state.datasets[i]}?</Modal.Body>
                    
                    <Modal.Footer>
                    
                      <Button bsStyle="primary" value={i+1} onClick={this.handleDatasetClose}>
                        Close
                      </Button>
                      
                      <Button 
                            bsStyle="success"
                            value={i+1}
                            onClick={this.submitFile}
                      >
                        Confirm
                      </Button>
                      
                    </Modal.Footer>
                    
                  </Modal>
                </ListGroupItem>
            )
        }
        return rows;
    }
    
    submitFile= e =>{
        // Send build file to start training
        this.setState({
            showDataset: this.state.showDataset - e.target.value - 1,
            button: this.state.button + e.target.value,
            trainFile: this.state.datasets[e.target.value - 1],
            statusErr: false
        })
        
        const tmp = e.target.value
    
        const requestBody = new FormData();
        var dataset = this.state.datasets[e.target.value - 1];
        requestBody.append("file", dataset);
        requestBody.append("epoch", this.state.epoch);
        requestBody.append("batch_size", this.state.batch_size);
        requestBody.append("learn_rate", this.state.learn_rate);
        
        fetch(
            Config.API.TRAIN, {
                method: "POST",
                headers: {
                    "Accept": "application/json"
                },
                body: requestBody
            },
            Config.TIMEOUT
        ).then((resp) => {
        
            if (resp.status === 201){
                this.setState({
                    fileName: dataset,
                    trainSuccessMsg: true,
                    showBar: true,
                    train: false,
                    button: this.state.button - tmp - 1,
                    interval: setInterval(this.getStatus, Config.INTERVAL),
                    statusErr: false
                });
                
                setTimeout(() => 
                  this.setState({
                    trainSuccessMsg: false
                  })
                , Config.COMPONENT_TIMEOUT);
            }
            else {
                this.setState({
                    trainErrMsg: true
                })
            }
        }).catch((e) => {
            this.setState({
                trainErrMsg: true
            })
        })
    }
    
    downloadFile = e =>{
        // Download chosen file
        var dataset = this.state.fileName;
        const requestBody = new FormData();
        requestBody.append("file", dataset)
        var saveAs = require("file-saver");
        
        fetch(
            Config.API.DOWNLOAD, {
                method: "POST",
                headers: {
                    "Accept": "application/json"
                },
                body: requestBody
            },
            Config.TIMEOUT
        ).then((resp) => {
            if (resp.status === 200){
                return resp.blob();
            }
            else {
                this.setState({
                    downloadErrMsg: true,
                    downloadErrMsg: "Something wrong happened while downloading " + dataset + "."
                })
            }
        }).then((blob) => {
            saveAs(blob, dataset);
            this.setState({
                downloadErrMsg: false
            })
        }).catch((e) => {
            this.setState({
                downloadErrMsg: true,
                downloadErrMsg: e.message
            })
        })
    }
    
    handleChange = e => {
      this.setState({ [e.target.name]: e.target.value });
    }
    
    handleShowTrain(){
        this.setState({
            showTrain: true
        });
    }
    
    handleCloseTrain(){
        this.setState({
            showTrain: false
        })
    }

    // Render-able parts of this component.
    render() {
    
        const tooltip = (
                          <Tooltip id="tooltip">
                            Click on select to start training!
                          </Tooltip>
                        );
        return (
            <div>
                 
                 {this.state.trainSuccessMsg && 
                    <Alert bsStyle="success">
                        Request to start training with {this.state.fileName} successfully sent. This will take a while.
                    </Alert>}
                    
                {this.state.trainErrMsg && 
                    <Alert bsStyle="danger">
                        Something wrong happened while sending the request.
                    </Alert>}
                
                {this.state.statusErr &&
                    <Alert bsStyle="danger">
                        {this.state.statusMsg}
                    </Alert>}
                
                <h2>
                    Train
                </h2>
                    <Button bsStyle="info" onClick={this.handleShowTrain.bind(this)}>
                        View/Edit Training Settings
                    </Button>
            
                    <OverlayTrigger placement="right" overlay={tooltip}>
                      <Button bsStyle="link">Help</Button>
                    </OverlayTrigger>
                    
                    
                <br/>
                
                <Modal show={this.state.showTrain} onHide={this.handleCloseTrain.bind(this)} bsSize="small">
                    <Modal.Header closeButton>
                        Training Settings
                    </Modal.Header>
                    <Modal.Body>
                    <Form horizontal>
                    
                    <Row>
                        
                        <FormGroup bsClass="trainForm">
                        
                        <ControlLabel>
                            Epoch
                        </ControlLabel>
                        
                        <FormControl name="epoch" value={this.state.epoch} onChange={this.handleChange}/>
                        </FormGroup>
                        
                        <FormGroup bsClass="trainForm">
                        
                        <ControlLabel>
                            Batch Size
                        </ControlLabel>
                        
                        <FormControl name="batch_size" value={this.state.batch_size} onChange={this.handleChange}/>
                        </FormGroup>
                        
                    </Row>
                    
                    <Row>
                        
                        <FormGroup bsClass="trainForm">
                        
                        <ControlLabel>
                            Learning Rate
                        </ControlLabel>
                        
                        <FormControl name="learn_rate" value={this.state.learn_rate} onChange={this.handleChange}/>
                        </FormGroup>
                        
                    </Row>
                    
                    <Row>
                        <br/>
                        <Button bsClass="trainButton" bsStyle="primary" onClick={this.handleCloseTrain.bind(this)}>
                            Save
                        </Button>
                    </Row>
                    
                </Form>
                    </Modal.Body>
                </Modal>
                
                <ListGroup>
                    {this.renderDataset()}
                </ListGroup>
                    
                {this.state.showBar &&
                    <h3>
                        Generating train file for {this.state.fileName}:
                    </h3>}
                    
                <br/>
                    
                {this.state.showBar &&
                    <h4>
                        Training status
                    </h4>}
                    
                {this.state.showBar &&
                    <ProgressBar active now={this.state.trainVal * 100}/>}
                    
                {this.state.showBar &&
                    <h4>
                        Combining distributed representations of play segment status
                    </h4>}
                    
                {this.state.showBar &&
                    <ProgressBar active now={this.state.daeVal * 100}/>}
                    
                {this.state.progressErrMsg &&
                    <Alert bsStyle="danger">
                        Something went wrong while fetching status.
                      </Alert>}
                
                {this.state.train && 
                    <h2>
                        Result
                    </h2>}
                 
                 {this.state.downloadErrMsg && 
                    <Alert bsStyle="danger">
                        Something went wrong while downloading the training file.
                      </Alert>}
                    
                {this.state.train && 
                    <Panel>
                            <Panel.Body>Training completed - Embedded matrix saved in {this.state.fileName}</Panel.Body>
                            <Panel.Footer>
                                <Button bsStyle="link" onClick={this.downloadFile}>
                                    Download
                                </Button>
                                
                                <Button bsStyle="success" href="/test">
                                    Next
                                </Button>
                            </Panel.Footer>
                    </Panel>}
                
            </div>
        );
    }
}

export default Train;

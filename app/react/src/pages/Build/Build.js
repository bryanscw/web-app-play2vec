import React from "react";
import { Alert, Row, Col, Modal, Form, FormControl, FormGroup, OverlayTrigger, Tooltip , Button, Panel, ListGroupItem, ListGroup, ProgressBar } from "react-bootstrap";
import Config from "../../config/Config";
import fetch from "../../helper/FetchWithTimeOut";
import "./Build.css"

class Build extends React.Component {
    
    constructor(props){
        super(props);
        this.state = {
            datasets: [],
            
            seg: Config.VALUE.SEG,
            delta: Config.VALUE.DELTA,
            
            fetchErr: false,
            
            showForm: false,
            build: false,
            
            buildErrMsg: false,
            buildSuccessMsg: false,
            
            downloadErrMsg: false,
            
            showDataset: 0,
            
            showBar: false,
            ogmVal: 0,
            noiseVal: 0,
            buildVal: 0,
            progressErrMsg: false,
            
            statusErr: false,
            statusMsg: null,
            
            fileName: null,
            interval: null
        }
        
        this.handleDatasetShow = this.handleDatasetShow.bind(this);
        this.handleDatasetClose = this.handleDatasetClose.bind(this);
        this.handleModalShow = this.handleModalShow.bind(this);
        this.handleModalClose = this.handleModalClose.bind(this);
        this.getStatus = this.getStatus.bind(this);
        this.clickStatus = this.clickStatus.bind(this);
    }
    
    handleChange = (e) => {
        this.setState = ({
            show: e.target.value
        })
    }
    
    componentWillMount(){
        // Fetch datasets
        fetch(Config.API.FILE + "dataset", {
            method: "GET",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
            },
        }, Config.TIMEOUT).then((resp) => {
            
            // If not found, return null
            if (resp.status === 404) {
                return null;
            }
            // Otherwise, return response in json
            else if (resp.status === 200){
                return resp.json();
            }
        }
        ).then((jsonResp) => {
            // if json response is null, set datasets to null too
            if (jsonResp === null){
                this.setState({
                    datasets: null
                })
            }
            // Otherwise set datasets to datasets in json response
            else {
                this.setState({
                    datasets: jsonResp.datasets
                })
            }
        }).catch((e) => {
            // For catching error
            this.setState({
                fetchErr: true
            });
        })
    }
    
    componentDidMount(){
        // If showBar is true, call getStatus
        if (this.state.showBar){
            this.getStatus()
            
        }
    }
    
    renderDataset(){
        // If length of datasets is 0 or null
        if (!this.state.datasets || this.state.datasets.length === 0){
            return (
                <p>No datasets found.</p>
            )
        }
        var rows = []
        
        
        // Display datasets with some buttons
        for (var i = 0; i < this.state.datasets.length; i++){
            rows.push(
                <ListGroupItem>
                {this.state.datasets[i]}
                <Button bsSize="xsmall" className="pull-right" bsStyle="primary" value={i+1} onClick={this.handleDatasetShow}>
                    Select
                  </Button>
                 <Button bsSize="xsmall" className="pull-right" value={i+1} onClick={this.clickStatus}>
                   Status
                 </Button>

                  <Modal show={this.state.showDataset > i} value={i+1} onHide={this.handleDatasetClose}>
                  
                    <Modal.Header>
                      <Modal.Title>Confirm action</Modal.Title>
                    </Modal.Header>
                    
                    <Modal.Body>Build using {this.state.datasets[i]}?</Modal.Body>
                    
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
    
    submitFile = e =>{
        
        var dataset = this.state.datasets[e.target.value - 1];
    
        this.setState({
            showDataset: this.state.showDataset - e.target.value - 1,
            statusErr: false
        })
        
        const requestBody = new FormData();
        requestBody.append("file", dataset)
        requestBody.append("seg", this.state.seg)
        requestBody.append("delta", this.state.delta)
        
        // Start build
        fetch(
            Config.API.BUILD, {
                method: "POST",
                headers: {
                    "Accept": "application/json"
                },
                body: requestBody
            },
            Config.TIMEOUT
        ).then((resp) => {
        
            // If response is 201 Created, get the json of response
            if (resp.status === 201){
                resp.json().then((respJson) => {
                    // If no such sequence, render error message accordingly
                    // Should be removed
                    if (respJson.filename === "No such sequence!"){
                        this.setState({
                            statusMsg: respJson.filename,
                            statusErr: true
                        });
                    }
                    // Start calling getStatus at every Config.INTERVAL seconds
                    else{
                        this.setState({
                            buildSuccessMsg: true,
                            showBar: true,
                            fileName: dataset,
                            interval: setInterval(this.getStatus, Config.INTERVAL)
                        });
                        
                        // Set the success message to timeout after Config.COMPONENT_TIMEOUT seconds
                        setTimeout(() =>
                          this.setState({
                            buildSuccessMsg: false
                          })
                        , Config.COMPONENT_TIMEOUT);}
                })
            }
            // Otherwise render error message
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
        
        var dataset = this.state.fileName;
        const requestBody = new FormData();
        var saveAs = require("file-saver");
        requestBody.append("file", dataset);
        
        // Download created build file
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
            // If file content is received, store in blob
            if (resp.status === 200){
                return resp.blob();
            }
            // Otherwise render error message
            else {
                this.setState({
                    downloadErrMsg: true,
                    downloadErrMsg: "Something wrong happened while downloading " + dataset + "."
                })
            }
        }).then((blob) => {
            // Save blob as file name
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
    
    clickStatus = e =>{
        
        var tmp = e.target.value;
        var dataset = this.state.datasets[tmp - 1];
        
        this.setState({
            fileName: dataset
        })
        
        // Get status of build
        fetch(
            Config.API.STATUS + "build/" + dataset, {
                method: "GET",
                headers: {
                    "Accept": "application/json"
                }
            },
            Config.TIMEOUT
        ).then((resp) => {
            if (resp.status === 200){
                // If there is a running thread, set getStatus to run every Config.INTERVAL seconds
                this.setState({
                    showBar: true,
                    fileName: dataset,
                    interval: setInterval(this.getStatus, Config.INTERVAL),
                    statusErr: false
                });
            }
            // Otherwise render error message
            else {
                resp.json().then((respJson) => {
                    this.setState({
                        statusErr: true,
                        statusMsg: respJson.message
                    })
                });
            }
        }).catch((e) => {
            this.setState({
                statusErr: true,
                statusMsg: e.message
            });
        })
    }
    
    getStatus(){
        
        // Fetch build status
        fetch(
            Config.API.STATUS + "build/" + this.state.fileName, {
                method: "GET",
                headers: {
                    "Accept": "application/json"
                }
            },
            Config.TIMEOUT
        ).then((resp) => {
            // Get the response json
            return resp.json();
        }).then((jsonResp) => {
            // If file name is received, clear any functions that are supposed to run on intervals
            if (jsonResp.filename){
                this.setState({
                    showBar: false,
                    fileName: jsonResp.filename,
                    build: true,
                })
                clearInterval(this.state.interval)
            }
            // Otherwise, continue fetching status and update progress
            else if (jsonResp.progress){
                var array = JSON.parse(jsonResp.progress);
                this.setState({
                    showBar: true,
                    ogmVal: array[0],
                    noiseVal: array[1],
                    buildVal: array[2],
                })
                if (this.state.buildVal > 0){
                    this.setState({
                        ogmVal: 1,
                        noiseVal: 1
                    })
                }
                else if (this.state.noiseVal > 0){
                    this.setState({
                        ogmVal: 1
                    })
                }
            }
            else {
                this.setState({
                    statusErr: true,
                    statusMsg: jsonResp.message
                })
            }
        }).catch((e) => {
            this.setState({
                statusErr: true,
                statusMsg: e.message
            })
        })
    }
    
    handleChange = e => {
      this.setState({ [e.target.name]: e.target.value });
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
    
    handleModalShow(){
        this.setState({
            showForm: true
        });
    }
    
    handleModalClose(){
        this.setState({
            showForm: false
        })
    }

    // Render-able parts of this component.
    render() {
    
        const tooltip = (
                          <Tooltip id="tooltip">
                            Click on select to start building!
                          </Tooltip>
                        );
        
        return (
            <div>
                 
                 {this.state.buildSuccessMsg && 
                    <Alert bsStyle="success">
                        Request to build corpus for {this.state.fileName} successfully sent. This will take a while.
                    </Alert>}
                        
                {this.state.buildErrMsg && 
                    <Alert bsStyle="danger">
                        Something went wrong while building the corpus.
                      </Alert>}
                      
                {this.state.statusErr && 
                    <Alert bsStyle="danger">
                        {this.state.statusMsg}
                      </Alert>}
                      
                <h2>
                    Build
                </h2>
                
                <Button bsStyle="info" onClick={this.handleModalShow.bind(this)}>
                    View/Edit Build Settings
                </Button> {"  "}
                
                <OverlayTrigger placement="right" overlay={tooltip}>
                  <Button bsStyle="link">Help</Button>
                </OverlayTrigger>
                
                <br/>
                
                <Modal show={this.state.showForm} onHide={this.handleModalClose.bind(this)}  bsSize="small">
                    <Modal.Header closeButton>
                        Build Settings
                    </Modal.Header>
                    <Modal.Body>
                    <Form horizontal>
                    
                    <Row>
                        
                        <FormGroup bsClass="buildForm">
                        
                        <Col>
                            Segment
                        </Col>
                        
                        <Col>
                            <FormControl name="seg" value={this.state.seg} onChange={this.handleChange}/>
                        </Col>
                        
                        </FormGroup>
                        
                        <FormGroup bsClass="buildForm">
                        
                            <Col>
                                Delta
                            </Col>
                            
                            <Col>
                                <FormControl name="delta" value={this.state.delta} onChange={this.handleChange}/>
                            </Col>
                        
                        </FormGroup>
                        
                    </Row>
                    
                    <Row>
                    
                    <br/>
                    
                    <Button bsClass="buildButton" bsStyle="primary" onClick={this.handleModalClose.bind(this)}>
                        Save
                    </Button>
                    </Row>
                    
                </Form>
                
                    </Modal.Body>
                </Modal>
                
                <ListGroup>
                    {this.renderDataset()}
                </ListGroup>
                
                <br/>
                    
                {this.state.showBar &&
                    <h3>
                        Generating build file for {this.state.fileName}:
                    </h3>}
                    
                <br/>
                    
                {this.state.showBar &&
                    <h4>
                        Split play status
                    </h4>}
                    
                {this.state.showBar &&
                    <ProgressBar active now={this.state.ogmVal * 100}/>}
                    
                {this.state.showBar &&
                    <h4>
                        Corrupted noise generation status
                    </h4>}
                    
                {this.state.showBar &&
                    <ProgressBar active now={this.state.noiseVal * 100}/>}
                    
                {this.state.showBar &&
                    <h4>
                        Corpus build status
                    </h4>}
                    
                {this.state.showBar &&
                    <ProgressBar active now={this.state.buildVal * 100}/>}
                    
                {this.state.progressErrMsg &&
                    <Alert bsStyle="danger">
                        Something went wrong while fetching status.
                      </Alert>}
                
                {this.state.build && 
                    <h2>
                        Result
                    </h2>}
                 
                 {this.state.downloadErrMsg && 
                    <Alert bsStyle="danger">
                        Something went wrong while downloading the build file.
                      </Alert>}
                    
                {this.state.build && 
                    <Panel>
                        <Panel.Body>Build completed - Built corpus saved in {this.state.fileName}</Panel.Body>
                        <Panel.Footer>
                            <Button bsStyle="link" onClick={this.downloadFile}>
                                Download
                            </Button>
                            
                            <Button bsStyle="success" href="/train">
                                Next
                            </Button>
                        </Panel.Footer>
                    </Panel>}
            </div>
        );
    }
}

export default Build;

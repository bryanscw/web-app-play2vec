import React from "react";
import { OverlayTrigger, Tooltip , Button, Alert, Grid, Row, Col, Modal, ListGroupItem, ListGroup, Thumbnail, Well, Carousel, FormGroup, ControlLabel, FormControl } from "react-bootstrap";
import Config from "../../config/Config";
import fetch from "../../helper/FetchWithTimeOut";
import "./Test.css"


class Test extends React.Component {
    
    constructor(props){
        super(props);
        this.state = {
            build_datasets: [],
            buildFile: null,
            train_datasets: [],
            trainFile: null,
            fetchErr: false,
			fetchErrMsg: null,
            
            testImg: null,
            img: [],
            sentNum: null,
            
            test: false,
            showDataset: 0,
            button: 0,
            
            testSuccessMsg: false,
            testErr: false,
			testErrMsg: null,
            
            epoch: Config.VALUE.EPOCH,
            batch_size: Config.VALUE.BATCH_SIZE,
            rnn_size: Config.VALUE.RNN,
            layers: Config.VALUE.LAYER,
            encode_size: Config.VALUE.ENCODE_SIZE,
            decode_size: Config.VALUE.DECODE_SIZE,
            learn_rate: Config.VALUE.LEARN_RATE,
            window_size: Config.VALUE.WINDOW_SIZE,
            
            corpus: null,
            noise_ogm_train_data: null,
            train_noise_data: null,
            ogm_train_data: null,
            ogm_train_key: null,
            delta: Config.VALUE.DELTA,
            lower_xlim: Config.VALUE.LOWER_X, 
            upper_xlim: Config.VALUE.UPPER_X,
            lower_ylim: Config.VALUE.LOWER_Y,
            upper_ylim: Config.VALUE.UPPER_Y,
            seq_num: Config.VALUE.SEQ,
            num: Config.VALUE.NUM
        }
        this.handleDatasetShow = this.handleDatasetShow.bind(this);
        this.handleDatasetClose = this.handleDatasetClose.bind(this);
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
                    build_datasets: null
                })
            }
            else {
                this.setState({
                    build_datasets: jsonResp.datasets
                })
            }

        }).catch((e) => {
            this.setState({
                fetchErr: true,
				fetchErrMsg: e.message
            });
        })
        
        // Fetch train files
        fetch(Config.API.FILE + "train", {
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
                    train_datasets: null
                })
            }
            else {
                this.setState({
                    train_datasets: jsonResp.datasets
                })
            }
        }).catch((e) => {
            this.setState({
                fetchErr: true,
				fetchErrMsg: e.message
            });
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
        if (!this.state.build_datasets || !this.state.train_datasets || this.state.build_datasets.length === 0 || this.state.train_datasets.length === 0){
            return (
                <p>No build/train file found.</p>
            )
        }
        var rows = []
    
        for (var i = 0; i < this.state.build_datasets.length; i++){
            for (var j = 0; j < this.state.train_datasets.length; j++){
                var build = this.state.build_datasets[i].replace("_build", "");
                var train = this.state.train_datasets[j].replace("_train", "");
                if (build === train){
                    rows.push(
                        <ListGroupItem>
                        {this.state.build_datasets[i]}, {this.state.train_datasets[j]}
                        <Button bsSize="xsmall" className="pull-right" bsStyle="primary" value={j+i+1} onClick={this.handleDatasetShow}>
                            {this.state.button > j + i && this.state.button < j + i + 2 ? "Testing...": "Select"}
                          </Button>

                          <Modal show={this.state.showDataset > j+i} value={j+i+1} onHide={this.handleDatasetClose}>
                          
                            <Modal.Header>
                              <Modal.Title>Confirm action</Modal.Title>
                            </Modal.Header>
                            
                            <Modal.Body>Test using {this.state.build_datasets[i]} and {this.state.train_datasets[i]}?</Modal.Body>
                            
                            <Modal.Footer>
                            
                              <Button bsStyle="primary" value={j+i+1} onClick={this.handleDatasetClose}>
                                Close
                              </Button>
                              
                              <Button 
                                    bsStyle="success"
                                    value={j+i+1}
                                    onClick={this.submitFile}
                              >
                                Confirm
                              </Button>
                              
                            </Modal.Footer>
                            
                          </Modal>
                        </ListGroupItem>
                    )
                }
            }
        }
        return rows;
    }
    
    submitFile= e =>{
        // Send request to test
        this.setState({
            testErr: false,
            testErrMsg: null
        })
    
        var tmp = e.target.value;
        
        for (var i = 0; i < this.state.build_datasets.length; i++){
            for (var j = 0; j < this.state.train_datasets.length; j++){
                if (tmp == (i + j + 1)){
                    var build = this.state.build_datasets[i].replace("_build", "");
                    var train = this.state.train_datasets[j].replace("_train", "");
                    if (build === train){
                        var build_dataset = this.state.build_datasets[i];
                        var train_dataset = this.state.train_datasets[j];
                    }
                }
            }
        }
    
        this.setState({
            showDataset: this.state.showDataset - e.target.value,
            button: this.state.button + e.target.value,
            buildFile: build_dataset,
            trainFile: train_dataset
        })
    
        const requestBody = new FormData();
        requestBody.append("build_file", build_dataset);
        requestBody.append("train_file", train_dataset);
		requestBody.append("seq_num", "sequence_" + this.state.seq_num);
		requestBody.append("num", this.state.num);
        
        fetch(
            Config.API.TEST, {
                method: "POST",
                headers: {
                    "Accept": "application/json"
                },
                body: requestBody
            },
            Config.TIMEOUT
        ).then((resp) => {
			this.setState({
				button: this.state.button - tmp,
				testImg: null,
				img: []
			});
			return resp.json();
        }).then((respJson) => {
			
			if (respJson.message){
				this.setState({
					testErr: true,
					testErrMsg: respJson.message
				})
				return;
			}
        
            const newRequestBody = new FormData();
            newRequestBody.append("file", build_dataset);
            newRequestBody.append("img", respJson.filename[0]);
            
            fetch(
                Config.API.GET_IMG, {
                    method: "POST",
                    headers: {
                        "Accept": "application/json"
                    },
                    body: newRequestBody
                },
                Config.TIMEOUT
            ).then((resp) => {
                if (resp.status === 200){
                    return resp.blob();
                }
            }).then((blob) => {
                this.setState({
                    testImg: URL.createObjectURL(blob),
                    sentNum: this.state.num
                })
            }).then(() => {
                respJson.filename.shift();
                for (var i = 0; i < respJson.filename.length; i++){
                    newRequestBody.set("img", respJson.filename[i]);
                    fetch(
                        Config.API.GET_IMG, {
                            method: "POST",
                            headers: {
                                "Accept": "application/json"
                            },
                            body: newRequestBody
                        },
                        Config.TIMEOUT
                    ).then((resp) => {
                        if (resp.status === 200){
                            return resp.blob();
                        }
                    }).then((blob) => {
                        this.setState({
                            img: this.state.img.concat(URL.createObjectURL(blob))
                        })
                    }).then(()=>{
                        this.setState({
                            test: true
                        })
                    }).catch((e) => {
                        this.setState({
							button: this.state.button - tmp,
                            testErr: true,
							testErrMsg: e.message
                        })
                    })
                }
            }).catch((e) => {
				this.setState({
                    button: this.state.button - tmp,
					testErr: true,
					testErrMsg: e.message
				})
            })
        }).catch((e) => {
			this.setState({
				button: this.state.button - tmp,
				testErr: true,
				testErrMsg: e.message
			})
        })
    }
	
	displayImage(){
		// Render image
		var displayImg = [];
		for (var i = 0; i < this.state.img.length; i++){
			displayImg.push(
				  <Carousel.Item>
					<Thumbnail className="img" alt="600x450" src={this.state.img[i]} />
					<Carousel.Caption>
					  <p style={{color: "black"}}>Play {i+1}</p>
					</Carousel.Caption>
				  </Carousel.Item>
			  )
		}
		
		return displayImg;
	}
    
    handleChange = e => {
      this.setState({ [e.target.name]: e.target.value });
    }

    // Render-able parts of this component.
    render() {
    
        const tooltip = (
                          <Tooltip id="tooltip">
						    Choose a sequence number and enter the number of similar play images to generate!
                          </Tooltip>
                        );
        return (
            <div>
                    
                {this.state.testErr && 
                    <Alert bsStyle="danger">
						{this.state.testErrMsg}
                    </Alert>}
                    
                <h2>
                    Test
                </h2>
            
                <OverlayTrigger placement="right" overlay={tooltip}>
                  <Button bsStyle="link">Help</Button>
                </OverlayTrigger>
                
                <FormGroup controlId="formInlineName">
                    <ControlLabel>Sequence number:</ControlLabel>
                    <FormControl type="text" name="seq_num" value={this.state.seq_num} onChange={this.handleChange}/>
                  </FormGroup>
                
                <FormGroup controlId="formInlineName">
                    <ControlLabel>Number of similar sequences to retrieve:</ControlLabel>
                    <FormControl type="text" name="num" value={this.state.num} onChange={this.handleChange}/>
                  </FormGroup>
                
                <ListGroup>
                    {this.renderDataset()}
                </ListGroup>
                
                {this.state.test && 
                    <h2>
                        Result
                    </h2>}
                    
                {this.state.test && 
                    <Well>Files used: {this.state.buildFile} & {this.state.trainFile}</Well>}
                    
                {this.state.test && 
					<Grid>
    					<Row>
						    <Col md={6}>
				                <Carousel.Item>
				                  <Thumbnail className="img" alt="600x450" src={this.state.testImg} />
			                        <Carousel.Caption>
			                          <p style={{color: "black"}}>Original Play</p>
			                        </Carousel.Caption>
				                </Carousel.Item>
						    </Col>
					        <Col md={6}>
						        <Carousel className="img">
						        {this.displayImage()}
						        </Carousel>
						    </Col>
					    </Row>
					</Grid>
                    }
                
            </div>
        );
    }
}

export default Test;

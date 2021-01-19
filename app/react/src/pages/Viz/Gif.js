import React from "react";
import { Alert, Button, ControlLabel, ProgressBar, Thumbnail, FormGroup, FormControl, ListGroup, ListGroupItem } from "react-bootstrap";
import Config from "../../config/Config";
import fetch from "../../helper/FetchWithTimeOut";
import "./Gif.css";

class Gif extends React.Component {
    
    constructor(props){
        super(props);
        this.state = {
            datasets: [],
            rows: null,
            file: null,
            fetchErr: false,
            click: 0,
            fileName: null,
            gen_seq_num: null,
            
            gifFile: null,
            gif: null,
            generated: false,
            gifName: null,
            
            statusErr: false,
            showBar: false,
            barValue: 0,
            progressErrMsg: false,
            interval: null,
            
            seq_num: Config.VALUE.SEQ
        }
        
        this.generateGif = this.generateGif.bind(this)
        this.getStatus = this.getStatus.bind(this)
        this.clickStatus = this.clickStatus.bind(this)
        this.getGif = this.getGif.bind(this)
    }
    
    componentWillMount(){
        // Fetch datasets
        fetch(Config.API.FILE + "dataset", {
            method: "GET",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
            },
        }, Config.TIMEOUT
        ).then((resp) => {
            if (resp.status === 404) {
                return <p>No datasets found</p>;
            }
            else if (resp.status === 200){
                return resp.json()
            }
        }
        ).then((jsonResp) => {
            this.setState({
                datasets: jsonResp.datasets,
                loaded: true
            })
                
        }).catch((e) => {
            this.setState({
                fetchErr: true
            })
        })
    }
    
    renderDataset(){
        if (!this.state.datasets || this.state.datasets.length === 0){
            return (
                <p>No datasets found.</p>
            )
        }
        var rows = []
    
        for (var i = 0; i < this.state.datasets.length; i++){
            rows.push(
                <ListGroupItem>
                {this.state.datasets[i]}
                <Button bsSize="xsmall" className="pull-right" bsStyle="primary" value={i+1} onClick={this.generateGif}>
                    {this.state.click > i && this.state.click < i + 2? "Generating..." : "Select"}
                  </Button>
                 <Button bsSize="xsmall" className="pull-right" value={i+1} onClick={this.clickStatus}>
                   Status
                 </Button>
                </ListGroupItem>
            )
        }
        return rows;
    }
    
    clickStatus = e =>{
        // Fetch gif generating status
        var tmp = e.target.value;
        var dataset = this.state.datasets[e.target.value - 1];
    
        this.setState({
            showDataset: this.state.showDataset - e.target.value - 1,
            gifFile: dataset
        })
        
        var filename = dataset.replace(".pkl", "") + "_" + "sequence_" + this.state.seq_num + ".gif";
        
        fetch(
            Config.API.STATUS + "gif/" + filename, {
                method: "GET",
                headers: {
                    "Accept": "application/json"
                }
            },
            Config.TIMEOUT
        ).then((resp) => {
            if (resp.status === 200){
                this.setState({
                    showBar: true,
                    fileName: this.state.datasets[tmp - 1],
                    gen_seq_num: this.state.seq_num,
                    gifFile: dataset,
                    interval: setInterval(this.getStatus, Config.INTERVAL),
                    statusErr: false
                });
            }
            else {
                resp.json().then((respJson) => {
                    this.setState({
                        statusErr: true,
                        statusMsg: respJson.message,
                        showBar: false,
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
        // Fetch gif generating status
        fetch(
            Config.API.STATUS + "gif/" + this.state.gifFile, {
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
                    gifName: jsonResp.filename
                })
                clearInterval(this.state.interval);
                this.getGif();
            }
            else {
                var array = JSON.parse(jsonResp.progress);
                this.setState({
                    showBar: true,
                    barValue: array[0]
                })
            }
        }).catch((e) => {
            this.setState({
                progressErrMsg: true
            })
        })
    }
    
    generateGif = e =>{
        // Send request to generate gif
        e.preventDefault();
        
        this.setState({
            click: this.state.click + e.target.value,
            gifFile: this.state.datasets[e.target.value - 1],
            statusErr: false
        });
        
        const data = new FormData();
        var tmp = e.target.value
        data.append("file", this.state.datasets[e.target.value - 1]);
        data.append("seq_num", "sequence_" + this.state.seq_num);
        
        fetch(
            Config.API.GEN_GIF, {
                method: "POST",
                headers: {
                    "Accept": "application/json"
                },
                body: data
            },
            Config.TIMEOUT
        ).then(resp => {
            if (resp.status === 201){

                resp.json().then((respJson) => {

                    if (respJson.filename === "No such sequence!"){
                        this.setState({
                            uploading: false,
                            statusMsg: respJson.filename,
                            statusErr: true
                        });
                    }
                    else{
                        this.setState({
                            showBar: true,
                            click: this.state.click - tmp,
                            fileName: this.state.datasets[tmp - 1],
                            gen_seq_num: this.state.seq_num,
                            interval: setInterval(this.getStatus, Config.INTERVAL)
                        });

                        setTimeout(() =>
                          this.setState({
                            buildSuccessMsg: false
                          })
                        , Config.COMPONENT_TIMEOUT);}
                })
            }
            else{
                resp.json().then((respJson) => {
                    this.setState({
                        uploading: false,
                        statusMsg: respJson.message,
                        statusErr: true
                    });
                })
            }
        }).catch((e) => {
            this.setState({
                uploading: false,
                statusMsg: e.message,
                statusErr: true
            });
        })
    }
    
    getGif(){
        // Fetch generated gif
        const newData = new FormData();
        newData.append("gif", this.state.gifName);
        
        fetch(
            Config.API.GET_GIF, {
            method: "POST",
            headers: {
                "Accept": "application/json"
            },
            body: newData
        },
        Config.TIMEOUT
        ).then((resp) => {
            if (resp.status === 200){
                return resp.blob();
            }
        }).then((blob) => {
            this.setState({
                gif: URL.createObjectURL(blob),
                generated: true
            })
        })
    }
    
    handleChange = e => {
      this.setState({ [e.target.name]: e.target.value });
    }

    // Render-able parts of this component.
    render() {
        
        return (
            <React.Fragment>
                
                {this.state.statusErr &&
                    <Alert bsStyle="danger">
                        {this.state.statusMsg}
                    </Alert>}
                
                <h2>
                    Gif
                </h2>
                
                <FormGroup controlId="formInlineName">
                    <ControlLabel>Sequence</ControlLabel>
                    <FormControl type="text" name="seq_num" value={this.state.seq_num} onChange={this.handleChange}/>
                </FormGroup>
                
                <ListGroup>
                    {this.renderDataset()}
                </ListGroup>
                
                {this.state.showBar &&
                    <h2>
                        Status
                    </h2>}
                    
                {this.state.showBar &&
                    <p>
                        Generating gif with {this.state.fileName} sequence {this.state.gen_seq_num}
                    </p>}
                    
                {this.state.showBar &&
                    <ProgressBar active now={this.state.barValue * 100}/>}
                    
                {this.state.progressErrMsg &&
                    <Alert bsStyle="danger">
                        Something went wrong while fetching status.
                      </Alert>}
                
                {this.state.generated &&
                <h4>
                    Generated Gif with {this.state.fileName} sequence {this.state.gen_seq_num}
                </h4>}
                
                {this.state.generated &&
                    <Thumbnail src={this.state.gif} />}
            </React.Fragment>
        );
    }
}

export default Gif;

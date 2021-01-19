import React from "react";
import { Alert, Modal, Button, FormControl, ListGroup, ListGroupItem, Form } from "react-bootstrap";
import Config from "../../config/Config";
import fetch from "../../helper/FetchWithTimeOut";
import "./Build.css";

class Build extends React.Component {
    
    constructor(props){
        super(props);
        this.state = {
            datasets: [],
            renderDataset: false,
            deleteFile: false,
            show: 0,
            loaded: false,
            rows: null,
            file: null,
            fetchErr: false,
            
            downloadErr: false,
            downloadErrMsg: null,
            downloadMsg: false,
            
            uploading: false,
            uploaded: false,
            uploadErr: false,
            uploadErrMsg: null,
            
            deleting: false,
            deleteFileName: null,
            deleted: false,
            deleteErr: false,
            deleteErrMsg: null
        }
        
        this.uploadFile = this.uploadFile.bind(this)
        this.deleteFile = this.deleteFile.bind(this)
        this.handleModalShow = this.handleModalShow.bind(this)
        this.handleModalClose = this.handleModalClose.bind(this)
    }
    
    handleChange = (e) => {
        this.setState = ({
            show: e.target.value
        })
    }
    
    componentWillMount(){
        // Fetch build files
        fetch(Config.API.FILE + "build", {
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
    
    handleModalShow = e =>{
        this.setState({
            show: this.state.show + e.target.value
        })
    }
    
    handleModalClose = e =>{
        this.setState({
            show: this.state.show - e.target.value
        })
    }
    
    renderDataset(){
        if (this.state.datasets) {
            var rows = []
        
            for (var i = 0; i < this.state.datasets.length; i++){
                rows.push(
                    <ListGroupItem>
                    {this.state.datasets[i]}
                    <Button bsSize="xsmall" className="pull-right" bsStyle="danger" value={i+1} onClick={this.handleModalShow}>
                        Delete
                      </Button>

                      <Modal show={this.state.show > i} value={i+1} onHide={this.handleModalClose}>
                      
                        <Modal.Header closeButton>
                        
                          <Modal.Title>Confirm action</Modal.Title>
                          
                        </Modal.Header>
                        
                        <Modal.Body>Confirm delete {this.state.datasets[i]}?</Modal.Body>
                        
                        <Modal.Footer>
                        
                          <Button bsStyle="primary" value={i+1} onClick={this.handleModalClose}>
                            Close
                          </Button>
                          
                          <Button bsStyle="danger" value={this.state.datasets[i]} onClick={this.deleteFile}>
                            Delete
                          </Button>
                          
                        </Modal.Footer>
                      </Modal>
                      <Button bsSize="xsmall" className="pull-right" bsStyle="link" value={i+1} onClick={this.downloadFile}>
                        Download
                      </Button>
                    </ListGroupItem>
                )
            }
            return rows;
        }
        
        else {
            return <p>No build files found.</p>;
        }
    }
    
    downloadFile = e =>{
        // Download chosen file
        const requestBody = new FormData();
        var dataset = this.state.datasets[e.target.value - 1];
        var saveAs = require("file-saver");
        requestBody.append("file", dataset)
        
        this.setState({
            downloadMsg: true
        })
        
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
                    downloadErr: true,
                    downloadErrMsg: "Something wrong happened while downloading " + dataset + "."
                })
            }
        }).then((blob) => {
            saveAs(blob, dataset);
            this.setState({
                downloadMsg: false
            });
        })
        .catch((e) => {
            this.setState({
                downloadErr: true,
                downloadErrMsg: e.message
            })
        })
    }
    
    deleteFile = e =>{
        
        // Delete chosen file
        this.setState({
            show: false,
            deleteFile: true,
            deleteFileName: e.target.value
        })
        
        const requestBody = new FormData();
        var name = e.target.value;
        requestBody.append("file", name);
        
        fetch(
            Config.API.FILE + "build", {
                method: "DELETE",
                headers: {
                    "Accept": "application/json"
                },
                body: requestBody
            },
            Config.TIMEOUT
        ).then(resp => {
            if (resp.status === 200){
                this.setState({
                    deleting: false,
                    deleted: true,
                })
            }
            else {
                this.setState({
                    deleting: false,
                    deleteErr: true,
                    deleteErrMsg: "Something wrong happened while deleting " + this.state.deleteFileName + "."
                })
            }
        }).catch((e) => {
            this.setState({
                deleting: false,
                deleteErr: true,
                deleteErrMsg: e.message
            })
        })
    }
    
    uploadFile = e =>{
        
        // Upload chosen file
        e.preventDefault();
        
        this.setState({
            uploading: true
        });
        
        if (!this.state.file.name.includes("build")){
            this.setState({
                uploadErr: true,
                uploadErrMsg: "Incorrect file type."
            })
        }
        
        const data = new FormData();
        data.append("file", this.state.file);
        data.append("filename", this.state.file.name);
        
        fetch(
            Config.API.FILE + "build", {
                method: "POST",
                headers: {
                    "Accept": "application/json"
                },
                body: data
            },
            Config.TIMEOUT
        ).then(resp => {
            if (resp.status === 200){
                this.setState({
                    uploading: false,
                    uploaded: true
                });
            }
            else {
                resp.json().then((respJson) => {
                    this.setState({
                        uploading: false,
                        uploadErr: true,
                        uploadErrMsg: respJson.message
                    });
                })
            }
        }).catch((e) => {
            this.setState({
                uploading: false,
                uploadErr: true,
                uploadErrMsg: e.message
            });
        })
    }
    
    onChangeHandler = e => {
        this.setState({
            file: e.target.files[0]
        });
    }

    // Render-able parts of this component.
    render() {
        
        return (
            <React.Fragment>
            
                {this.state.fetchErr && 
                    <Alert bsStyle="danger">
                        Something wrong happened while fetching files.
                    </Alert>}
                
                {this.state.downloadMsg && 
                    <Alert bsStyle="success">
                            Request to download file sent successfully! Please wait a moment...
                    </Alert>}
                
                {this.state.uploaded && 
                    <Alert bsStyle="success">
                            File uploaded successfully. Refresh page to view changes.
                    </Alert>}
                
                {this.state.uploadErr && 
                    <Alert bsStyle="danger">
                        {this.state.uploadErrMsg}
                    </Alert>}
                    
                {this.state.deleted && 
                    <Alert bsStyle="success">
                        {this.state.deleteFileName} deleted successfully. Refresh page to view changes.
                        </Alert>}
                        
                {this.state.deleteErr && 
                    <Alert bsStyle="danger">
                        {this.state.deleteErrMsg}
                    </Alert>}
                    
                {this.state.downloadErr &&
                    <Alert bsStyle="danger">
                        {this.state.downloadErrMsg}
                    </Alert>}
                
                <h2>
                    Build Files
                </h2>
                
                <ListGroup>
                    {this.renderDataset()}
                </ListGroup>
                
                <br/>
                
                <h4>
                    Upload Build File
                </h4>
                
                <Form>
                <FormControl encType="multipart/form-data" type="file" onChange={this.onChangeHandler}/>
                
                <br/>
                
                <Button bsStyle="primary" onClick={this.uploadFile}>
                    {this.state.uploading ? "Uploading...":"Upload"} 
                </Button>
                </Form>
            </React.Fragment>
        );
    }
}

export default Build;

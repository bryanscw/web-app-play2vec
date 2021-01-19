import React from "react";
import { Button, ControlLabel, Thumbnail, FormGroup, FormControl, ListGroup, ListGroupItem } from "react-bootstrap";
import Config from "../../config/Config";
import fetch from "../../helper/FetchWithTimeOut";
import "./Img.css";

class Img extends React.Component {
    
    constructor(props){
        super(props);
        this.state = {
            datasets: [],
            rows: null,
            file: null,
            fetchErr: false,
            click: 0,
            gen_seq_num: null,
            
            image: null,
            generated: false,
            
            seq_num: Config.VALUE.SEQ
        }
        
        this.generateImage = this.generateImage.bind(this)
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
                <Button bsSize="xsmall" className="pull-right" bsStyle="primary" value={i+1} onClick={this.generateImage}>
                    {this.state.click > i && this.state.click < i + 2? "Generating..." : "Select"}
                  </Button>
                </ListGroupItem>
            )
        }
        return rows;
    }
    
    generateImage = e =>{
        // Send request to generate image
        e.preventDefault();
        
        this.setState({
            click: this.state.click + e.target.value,
            gen_seq_num: this.state.seq_num
        });
        
        const data = new FormData();
        var dataset = this.state.datasets[e.target.value - 1];
        var tmp = e.target.value
        data.append("file", dataset);
        data.append("seq_num", "sequence_" + this.state.seq_num);
        
        fetch(
            Config.API.GEN_IMG, {
                method: "POST",
                headers: {
                    "Accept": "application/json"
                },
                body: data
            },
            Config.TIMEOUT
        ).then(resp => {
            if (resp.status === 200){
                return resp.json();
            }
        }).then((respJson) => {
            const newData = new FormData();
            newData.append("file", dataset);
            newData.append("img", respJson.filename);
            fetch(
                Config.API.GET_IMG, {
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
                        image: URL.createObjectURL(blob),
                        generated: true,
                        click: this.state.click - tmp,
                        file: dataset
                    })
                })
        }).catch((e) => {
            this.setState({
                uploading: false,
                uploadErr: true
            });
        })
    }
    
    handleChange = e => {
      this.setState({ [e.target.name]: e.target.value });
    }

    // Render-able parts of this component.
    render() {
        
        return (
            <React.Fragment>
                
                <h2>
                    Image
                </h2>
                
                <FormGroup controlId="formInlineName">
                    <ControlLabel>Sequence</ControlLabel>
                    <FormControl type="text" name="seq_num" value={this.state.seq_num} onChange={this.handleChange}/>
                </FormGroup>
                
                <ListGroup>
                    {this.renderDataset()}
                </ListGroup>
                
                {this.state.generated &&
                <h4>
                    Generated Image with {this.state.file} sequence {this.state.gen_seq_num}
                </h4>}
                
                {this.state.generated &&
                    <Thumbnail width={900} height={500} alt="900x500" src={this.state.image} />}
            </React.Fragment>
        );
    }
}

export default Img;

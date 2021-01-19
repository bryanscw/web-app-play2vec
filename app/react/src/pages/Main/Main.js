import logo from "../../img/ball.png";
import Config from "../../config/Config";
import fetch from "../../helper/FetchWithTimeOut";
import React from "react";
import "./Main.css";

class Main extends React.Component {

    constructor(props){
        super(props);
        this.state = {
            status: "Checking..."
        }
        this.getBackendStatus = this.getBackendStatus.bind(this);
    }
    
    componentDidMount(){
        this.getBackendStatus()
    }
    
    getBackendStatus(){
        fetch(
            Config.API.ENDPOINT, {
                method: "GET",
                headers: {
                    "Accept": "application/json"
                },
            },
            Config.TIMEOUT
        ).then((resp) => {
        
            // If response is 201 Created, get the json of response
            if (resp.status === 200){
                this.setState({
                    status: "Ready"
                })
            }
            // Otherwise render error message
            else {
                this.setState({
                    status: "No response received"
                })
            }
        }).catch((e) => {
            this.setState({
                    status: e.message
                })
        })
    }

    // Render-able parts of this component.
    render() {
        return (
            <div className="center-div">
                <img src={logo} alt="" className="App-logo"/>
                <h3>
                    Sample play2vec web application
                </h3>
                <h4>
                    Backend status: {this.state.status}
                </h4>
            </div>
        );
    }
}

export default Main;

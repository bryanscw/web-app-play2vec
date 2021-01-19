import React from "react";
import "./NotFound.css";
import nogoal from "../../img/nogoal.jpg";

export default () =>
    <div className="NotFound">
        <img src={nogoal} alt="" className="App-logo"/>
        <h3>It appears that the link provided is disallowed....</h3>
    </div>;


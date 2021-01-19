import React from "react";
import {Route, Switch} from "react-router-dom";
import Main from "./pages/Main/Main";
import HowTo from "./pages/HowTo/HowTo";
import NotFound from "./pages/NotFound/NotFound";
import File from "./pages/File/File";
import Build from "./pages/Build/Build";
import Train from "./pages/Train/Train";
import Test from "./pages/Test/Test";
import Viz from "./pages/Viz/Viz";

export default () =>
    <div>
        <Switch>
            <Route path="/" exact component={Main}/>
            <Route path="/howto" exact component={HowTo}/>
            <Route path="/file" exact component={File}/>
            <Route path="/build" exact component={Build}/>
            <Route path="/train" exact component={Train}/>
            <Route path="/test" exact component={Test}/>
            <Route path="/viz" exact component={Viz}/>
            
            <Route component={NotFound}/>
        </Switch>
    </div>
;

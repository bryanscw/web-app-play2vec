import React from "react";
import { Tabs, Tab } from "react-bootstrap";
import Gif from "./Gif";
import Img from "./Img";

export default () =>
    <div>
        <Tabs defaultActiveKey={1} id="uncontrolled-tab-example">
            <Tab eventKey={1} title="Image">
                <Img/>
            </Tab>
            <Tab eventKey={2} title="Gif">
                <Gif/>
            </Tab>
            <Tab eventKey={3} title="Help">
                <h4>
                    To generate image/gif: choose a sequence number and select the dataset!
                </h4>
                <h5>
                    Note: It will take longer to generate a gif compared to image!
                </h5>
            </Tab>
        </Tabs>
    </div>
;

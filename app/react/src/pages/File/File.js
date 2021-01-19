import React from "react";
import { Tabs, Tab } from "react-bootstrap";
import Dataset from "./Dataset";
import Build from "./Build";
import Train from "./Train";
import Checkpoint from "./Checkpoint";

export default () =>
    <div>
        <Tabs defaultActiveKey={1} id="uncontrolled-tab-example">
            <Tab eventKey={1} title="Datasets">
                <Dataset/>
            </Tab>
            <Tab eventKey={2} title="Build">
                <Build/>
            </Tab>
            <Tab eventKey={3} title="Train">
                <Train/>
            </Tab>
            <Tab eventKey={4} title="Checkpoint">
                <Checkpoint/>
            </Tab>
            <Tab eventKey={5} title="Help">
                <h4>
                    To delete: click on the delete button!
                </h4>
                <h4>
                    To upload: click on the upload button!
                </h4>
                <h5>
                    Note: remember to upload your file at its corresponding file type!
                </h5>
            </Tab>
        </Tabs>
    </div>
;

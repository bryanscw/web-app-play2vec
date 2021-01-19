import { shallow, mount, configure } from "enzyme";
import { Tabs, Tab } from "react-bootstrap";
import Adapter from "enzyme-adapter-react-16";
import React from "react";
import ReactDOM from "react-dom";

import logo from "./img/ball.png";
import notFoundImg from "./img/nogoal.jpg";

import App from "./App";
import NotFound from "./pages/NotFound/NotFound";
import Main from "./pages/Main/Main";
import HowTo from "./pages/HowTo/HowTo";
import File from "./pages/File/File";
import FileDataset from "./pages/File/Dataset";
import FileBuild from "./pages/File/Build";
import FileTrain from "./pages/File/Train";
import FileCkpt from "./pages/File/Checkpoint";
import Build from "./pages/Build/Build";
import Train from "./pages/Train/Train";
import Test from "./pages/Test/Test";
import Viz from "./pages/Viz/Viz";
import Img from "./pages/Viz/Img";
import Gif from "./pages/Viz/Gif";

configure({ adapter: new Adapter() });

it("renders without crashing", () => {
    shallow(<App />);
});

it("renders not found page", () => {
    const notFound = shallow(<NotFound />);
    const text = <h3>It appears that the link provided is disallowed....</h3>;
    expect(notFound.contains(text)).toEqual(true);
    expect(notFound.find("img").prop("src")).toEqual(notFoundImg);
});

it("renders main page", () => {
    const main = shallow(<Main />);
    const text = <h3>Sample play2vec web application</h3>;
    expect(main.contains(text)).toEqual(true);
    expect(main.find("img").prop("src")).toEqual(logo);
});

it("renders how-to page", () => {
    const howTo = shallow(<HowTo />);
    
    const link = <a href="https://github.com/zhengwang125/play2vec">here</a>;
    
    const header_1 = <h3>play2vec-app:</h3>;
    const para_1 = <p>
                    This application is based on the original implementation of a research project done by Nanyang Technological University, 
					titled "Effective and Efficient Sports Play Retrieval with Deep Representation Learning", which can be found {link}.
                </p>;
    
    const header_2 = <h4>Requirements for the file:</h4>;
    const para_2 = <p>{`
                    The provided dataset must be in the following format:
                    
                    a. Data with a Python Dictionary format as such: 
                        [b"sequence_num"]: 2D array of the play sequence

                    b. File must be saved as a Python Pickle file format with bytes encoding, 
                        i.e. pickle.dump(open("file name", "rb"), encoding="bytes")
                `}
                </p>;
    
    const header_3 = <h4>How to use the application:</h4>;
    const para_3 = <p>{`
                    1. Upload dataset in Files > Dataset
                    2. Under the "Build" page, edit the necessary "Build Settings" and click on the dataset to start building the corpus with.
                    3. Once the "Build" step is done, proceed to the "Train" page, edit the necessary "Build Settings" and "Train Settings" and click on the build file to start training the model with.
                    4. Once the "Train" step is done, procees to the "Test" page and click on the train file to start testing the model with. The rendered images are the plays most similar to the chosen sequence.`}
                </p>
                
    const header_4 = <h4>Do note that the status bar for any ongoing building, training or testing are rough estimates of the process!</h4>;
    const header_5 = <h1>Have fun!</h1>;
    
    expect(howTo.contains(header_1)).toEqual(true);
    expect(howTo.contains(para_1)).toEqual(true);
    
    expect(howTo.contains(header_2)).toEqual(true);
    expect(howTo.contains(para_2)).toEqual(true);
    
    expect(howTo.contains(header_3)).toEqual(true);
    expect(howTo.contains(para_3)).toEqual(true);
    
    expect(howTo.contains(header_4)).toEqual(true);
    expect(howTo.contains(header_5)).toEqual(true);
})

it("renders file page", () => {
    const file = shallow(<File/>);
    const help_1 = <h4>To delete: click on the delete button!</h4>;
    const help_2 = <h4>To upload: click on the upload button!</h4>;
    const help_3 = <h5>Note: remember to upload your file at its corresponding file type!</h5>;

    expect(file.contains(help_1)).toEqual(true);
    expect(file.contains(help_2)).toEqual(true);
    expect(file.contains(help_3)).toEqual(true);
})

it("renders file dataset page", () => {
    const dataset = ["test"];
    const file_dataset = shallow(<FileDataset datasets={dataset}/>);
    const header_1 = <h2>Datasets</h2>;
    const header_2 = <h4>Upload Dataset</h4>;
    
    expect(file_dataset.contains(header_1)).toEqual(true);
    expect(file_dataset.contains(header_2)).toEqual(true);
})

it("renders build file page", () => {
    const dataset = ["test"];
    const file_build = shallow(<FileBuild datasets={dataset}/>);
    const header_1 = <h2>Build Files</h2>;
    const header_2 = <h4>Upload Build File</h4>;
    
    expect(file_build.contains(header_1)).toEqual(true);
    expect(file_build.contains(header_2)).toEqual(true);
})

it("renders train file page", () => {
    const dataset = ["test"];
    const file_train = shallow(<FileTrain datasets={dataset}/>);
    const header_1 = <h2>Train Files</h2>;
    const header_2 = <h4>Upload Train File</h4>;
    
    expect(file_train.contains(header_1)).toEqual(true);
    expect(file_train.contains(header_2)).toEqual(true);
})

it("renders checkpoint file page", () => {
    const dataset = ["test"];
    const file_ckpt = shallow(<FileCkpt datasets={dataset}/>);
    const header_1 = <h2>Checkpoint Files</h2>;
    const header_2 = <h4>Upload Checkpoint File</h4>;
    
    expect(file_ckpt.contains(header_1)).toEqual(true);
    expect(file_ckpt.contains(header_2)).toEqual(true);
})

it("renders build page", () => {
    const dataset = ["test"];
    const build = shallow(<Build datasets={dataset}/>);
    const header_1 = <h2>Build</h2>;
    
    expect(build.contains(header_1)).toEqual(true);
})

it("renders train page", () => {
    const dataset = ["test"];
    const train = shallow(<Train datasets={dataset}/>);
    const header_1 = <h2>Train</h2>;
    
    expect(train.contains(header_1)).toEqual(true);
})

it("renders test page", () => {
    const dataset = ["test"];
    const test = shallow(<Test datasets={dataset}/>);
    const header_1 = <h2>Test</h2>;
    
    expect(test.contains(header_1)).toEqual(true);
})

it("renders viz page", () => {
    const viz = shallow(<Viz/>);
    const header_1 = <h4>To generate image/gif: choose a sequence number and select the dataset!</h4>;
    const header_2 = <h5>Note: It will take longer to generate a gif compared to image!</h5>;
    
    expect(viz.contains(header_1)).toEqual(true);
    expect(viz.contains(header_2)).toEqual(true);
})

it("renders viz image page", () => {
    const viz_img = shallow(<Img/>);
    const header_1 = <h2>Image</h2>;
    
    expect(viz_img.contains(header_1)).toEqual(true);
})

it("renders viz gif page", () => {
    const viz_gif = shallow(<Gif/>);
    const header_1 = <h2>Gif</h2>;
    
    expect(viz_gif.contains(header_1)).toEqual(true);
})

import "./HowTo.css";
import React from "react";

class HowTo extends React.Component {

    // Render-able parts of this component.
    render() {
    
        var link = <a href="https://github.com/zhengwang125/play2vec">here</a>
        return (
            <div className="HowTo">
            
                <h3>
                    play2vec-app:
                </h3>
                
                <p>
                    This application is based on the original implementation of a research project done by Nanyang Technological University, 
					titled "Effective and Efficient Sports Play Retrieval with Deep Representation Learning", which can be found {link}.
                </p>
                
                <br/>
                
                <h4>
                    Requirements for the file:
                </h4>
                <p>{`
                    The provided dataset must be in the following format:
                    
                    a. Data with a Python Dictionary format as such: 
                        [b"sequence_num"]: 2D array of the play sequence

                    b. File must be saved as a Python Pickle file format with bytes encoding.
                        i.e. pickle.dump(open("file name", "rb"), encoding="bytes")
                `}
                </p>{"\n"}
                
                <h4>
                    How to use the application:
                </h4>
                <p>{`
                    1. Upload dataset in Files > Dataset
                    2. Under the "Build" page, edit the necessary "Build Settings" and click on the dataset to start building the corpus with.
                    3. Once the "Build" step is done, proceed to the "Train" page, edit the necessary "Train Settings" and click on the build file to start training the model with.
                    4. Once the "Train" step is done, proceed to the "Test" page, choose a sequence number and number of similar images to retrieve and click on the train file to start testing the model with. The rendered images are the plays most similar to the chosen sequence.`}
                </p>
                
                <h4>
                    Do note that the status bar for any ongoing building, training or testing are rough estimates of the process!
                </h4>
                
                <h1>
                    Have fun!
                </h1>
            </div>
        );
    }
}

export default HowTo;

const API_ADDR = process.env.REACT_APP_API_ADDR;

export default {
    APP_NAME: "play2vec",
    TAGLINE: "Sample web application",
    API: {
        ENDPOINT: "http://" + `${API_ADDR}` + ":8080/api/play2vec/",
        get DATA() {
            return this.ENDPOINT + "data"
        },
        get FILE() {
            return this.ENDPOINT + "file/";
        },
        get BUILD() {
            return this.ENDPOINT + "build";
        },
        get STATUS() {
            return this.ENDPOINT + "status/";
        },
        get TRAIN() {
            return this.ENDPOINT + "train";
        },
        get TEST() {
            return this.ENDPOINT + "test";
        },
        get DOWNLOAD() {
            return this.ENDPOINT + "download";
        },
        get GEN_IMG() {
            return this.ENDPOINT + "gen-img";
        },
        get GET_IMG() {
            return this.ENDPOINT + "get-img"
        },
        get GEN_GIF(){
            return this.ENDPOINT + "gen-gif";
        },
        get GET_GIF() {
            return this.ENDPOINT + "get-gif";
        }
    },
    TIMEOUT: 300000,
    COMPONENT_TIMEOUT: 5000,
    INTERVAL: 15000,
    VALUE: {
        SEG: 10,
        DELTA: 3.0,
        EPOCH: 10,
        BATCH_SIZE: 10,
        LEARN_RATE: 0.01,
        SEQ: 18,
		NUM: 5
    }
};

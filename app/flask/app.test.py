import unittest
import json
import requests


# Load test config
with open("config/app.test.config") as f:
    config = json.load(f)

# Load application config
with open("config/app.config") as g:
    app_config = json.load(g)


class Play2vecFlaskTest(unittest.TestCase):
    def test_status_success(self):
        """
        Test base endpoint

        Expected result: 200 OK
        Expected: "Welcome to play2vec app!"
        """
        resp = requests.get(config["API_ADDR"] + "/")
        tmp = json.loads(resp.content.decode())
        self.assertEqual(tmp["message"], "Welcome to play2vec app!", "Flask is not running!")
        
    def test_fetch_dataset_success(self):
        """
        Test fetch files endpoint

        Expected result: 200 OK
        Expected: ["sample.pkl"]
        """
        resp = requests.get(config["API_ADDR"] + "/file/dataset")
        tmp = json.loads(resp.content.decode())
        self.assertEqual(tmp["datasets"], ["sample.pkl"], "No sample datasets in container!")
        
    def test_fetch_build_success(self):
        """
        Test fetch build files endpoint

        Expected result: 200 OK
        Expected: ["sample_build"]
        """
        resp = requests.get(config["API_ADDR"] + "/file/build")
        tmp = json.loads(resp.content.decode())
        self.assertEqual(tmp["datasets"], ["sample_build"], "No sample build files in container!")
        
    def test_fetch_train_success(self):
        """
        Test fetch train files endpoint

        Expected result: 200 OK
        Expected: ["sample_train"]
        """
        resp = requests.get(config["API_ADDR"] + "/file/train")
        tmp = json.loads(resp.content.decode())
        self.assertEqual(tmp["datasets"], ["sample_train"], "No sample train files in container!")
    
    def test_fetch_img_fail_no_img(self):
        """
        Test fetch image endpoint

        Expected result: 404 Not Found
        Expected: "No such image!"
        """
        body = {
                "file": "sample.pkl",
                "img": "sequence_1.png"
               }
        resp = requests.post(config["API_ADDR"] + "/get-img", data=body)
        tmp = json.loads(resp.content.decode())
        self.assertEqual(tmp["message"], "No such image!", "Unexpected image found!")
    
    def test_fetch_gif_fail_no_gif(self):
        """
        Test fetch gif endpoint

        Expected result: 404 Not Found
        Expected: "No such gif!"
        """
        body = {
                "gif": "sample_sequence_18.gif"
               }
        resp = requests.post(config["API_ADDR"] + "/get-gif", data=body)
        tmp = json.loads(resp.content.decode())
        self.assertEqual(tmp["message"], "No such gif!", "Unexpected gif found!")
    
    def test_build_status_fail_no_thread(self):
        """
        Test fetch build status endpoint

        Expected result: 403 Forbidden
        Expected: "No running build threads."
        """
        resp = requests.get(config["API_ADDR"] + "/status/build/sample.pkl")
        tmp = json.loads(resp.content.decode())
        self.assertEqual(tmp["message"], "No running build threads.", "Unexpected build file generating thread!")
    
    def test_train_status_fail_no_thread(self):
        """
        Test fetch train status endpoint

        Expected result: 403 Forbidden
        Expected: "No running train threads."
        """
        resp = requests.get(config["API_ADDR"] + "/status/train/sample_build")
        tmp = json.loads(resp.content.decode())
        self.assertEqual(tmp["message"], "No running train threads.", "Unexpected train file generating thread!")
    
    def test_gif_status_fail_no_thread(self):
        """
        Test fetch gif generating status endpoint

        Expected result: 403 Forbidden
        Expected: "No running gif threads."
        """
        resp = requests.get(config["API_ADDR"] + "/status/gif/sample.pkl")
        tmp = json.loads(resp.content.decode())
        self.assertEqual(tmp["message"], "No running gif threads.", "Unexpected gif generating thread!")
        
    def test_build_with_file_present_success(self):
        """
        Test start build with file present endpoint

        Expected result: 200 OK
        Expected: "Building thread started successfully."

        Expected result: 200 OK
        Expected: "sample_build"
        """
        body = {
                "file": "sample.pkl",
                "delta": 3.0
               }
        resp = requests.post(config["API_ADDR"] + "/build", data=body)
        tmp = json.loads(resp.content.decode())
        self.assertEqual(tmp["message"], "Building thread started successfully.", "Starting build does not work.")
        
        resp = requests.get(config["API_ADDR"] + "/status/build/" + body["file"])
        tmp = json.loads(resp.content.decode())
        self.assertEqual(tmp["filename"], "sample_build", "Build endpoint does not return expected file.")
        
    def test_build_with_file_present_fail_file_queue(self):
        """
        Test start build with file present endpoint, sending request twice

        Expected result: 403 Forbidden
        Expected: "A build thread with sample.pkl is already running."

        Expected result: 200 OK
        Expected: "sample_build"
        """
        body = {
                "file": "sample.pkl",
                "delta": 3.0
               }
        resp = requests.post(config["API_ADDR"] + "/build", data=body)
        resp = requests.post(config["API_ADDR"] + "/build", data=body)
        tmp = json.loads(resp.content.decode())
        self.assertEqual(tmp["message"],
                         "A build thread with {} is already running.".format(body["file"]),
                         "Build endpoint file queue check not working.")
        
        resp = requests.get(config["API_ADDR"] + "/status/build/" + body["file"])
        tmp = json.loads(resp.content.decode())
        self.assertEqual(tmp["filename"], "sample_build", "Build endpoint does not return expected file.")
        
    def test_build_with_file_present_fail_invalid_form_var(self):
        """
        Test start build with file present endpoint, sending invalid delta value

        Expected result: 400 Bad Request
        Expected: "Bad request."
        """
        body = {
                "file": "sample.pkl",
                "delta": -3.0
               }
        resp = requests.post(config["API_ADDR"] + "/build", data=body)
        tmp = json.loads(resp.content.decode())
        self.assertEqual(tmp["message"], "Bad request.", "Build endpoint form check not working.")
        
    def test_build_with_file_present_fail_null_file_name(self):
        """
        Test start build with file present endpoint, sending null file name

        Expected result: 400 Bad Request
        Expected: "Bad request."
        """
        body = {
                "file": "",
                "delta": 3.0
               }
        resp = requests.post(config["API_ADDR"] + "/build", data=body)
        tmp = json.loads(resp.content.decode())
        self.assertEqual(tmp["message"], "Bad request.", "Build endpoint file name check not working.")
        
    def test_build_with_file_present_fail_file_does_not_exist(self):
        """
        Test start build with file present endpoint, sending file name that does not exist

        Expected result: 404 Not Found
        Expected: "File not found."
        """
        body = {
                "file": "random.pkl",
                "delta": 3.0
               }
        resp = requests.post(config["API_ADDR"] + "/build", data=body)
        tmp = json.loads(resp.content.decode())
        self.assertEqual(tmp["message"], "File not found.", "Build endpoint file check not working.")
        
    def test_train_with_file_present_success(self):
        """
        Test start train with file present endpoint

        Expected result: 200 OK
        Expected: "Training thread started successfully."

        Expected result: 200 OK
        Expected: "sample_train"
        """
        body = {
                "file": "sample.pkl",
                "epoch": 10,
                "batch_size": 10,
                "learn_rate": 0.01
               }
        resp = requests.post(config["API_ADDR"] + "/train", data=body)
        tmp = json.loads(resp.content.decode())
        self.assertEqual(tmp["message"], "Training thread started successfully.", "Starting train does not work.")
        
        resp = requests.get(config["API_ADDR"] + "/status/train/" + body["file"])
        tmp = json.loads(resp.content.decode())
        self.assertEqual(tmp["filename"], "sample_train", "Train endpoint does not return expected file.")
        
    def test_train_with_file_present_fail_file_queue(self):
        """
        Test start train with file present endpoint, sending request twice

        Expected result: 403 Forbidden
        Expected: "A train thread with sample.pkl is already running."

        Expected result: 200 OK
        Expected: "sample_train"
        """
        body = {
                "file": "sample.pkl",
                "epoch": 10,
                "batch_size": 10,
                "learn_rate": 0.01
               }
        resp = requests.post(config["API_ADDR"] + "/train", data=body)
        resp = requests.post(config["API_ADDR"] + "/train", data=body)
        tmp = json.loads(resp.content.decode())
        self.assertEqual(tmp["message"],
                         "A training thread with {} is already running.".format(body["file"]),
                         "Train endpoint file queue check not working.")
        
        resp = requests.get(config["API_ADDR"] + "/status/train/" + body["file"])
        tmp = json.loads(resp.content.decode())
        self.assertEqual(tmp["filename"], "sample_train", "Train endpoint does not return expected file.")
        
    def test_train_with_file_present_fail_invalid_form_var(self):
        """
        Test start train with file present endpoint, sending invalid delta, batch_size and learn_rate values

        Expected result: 400 Bad Request
        Expected: "Bad request."
        """
        body = {
                "file": "sample.pkl",
                "epoch": -10,
                "batch_size": -10,
                "learn_rate": -0.01
               }
        resp = requests.post(config["API_ADDR"] + "/train", data=body)
        tmp = json.loads(resp.content.decode())
        self.assertEqual(tmp["message"], "Bad request.", "Train endpoint form check not working.")
        
    def test_train_with_file_present_fail_null_file_name(self):
        """
        Test start train with file present endpoint, sending null file name

        Expected result: 400 Bad Request
        Expected: "Bad request."
        """
        body = {
                "file": "",
                "epoch": 10,
                "batch_size": 10,
                "learn_rate": 0.01
               }
        resp = requests.post(config["API_ADDR"] + "/train", data=body)
        tmp = json.loads(resp.content.decode())
        self.assertEqual(tmp["message"], "Bad request.", "Build endpoint file name check not working.")
        
    def test_train_with_file_present_fail_file_does_not_exist(self):
        """
        Test start train with file present endpoint, sending file name that does not exist

        Expected result: 404 Not Found
        Expected: "File not found."
        """
        body = {
                "file": "random.pkl",
                "epoch": 10,
                "batch_size": 10,
                "learn_rate": 0.01
               }
        resp = requests.post(config["API_ADDR"] + "/train", data=body)
        tmp = json.loads(resp.content.decode())
        self.assertEqual(tmp["message"], "File not found.", "Build endpoint file check not working.")
        
    def test_test_with_file_present_success(self):
        """
        Test test with file present endpoint

        Expected result: 200 OK
        Expected: ['sequence_18.png',
                   'sequence_709.png',
                   'sequence_5002.png',
                   'sequence_3268.png',
                   'sequence_4157.png',
                   'sequence_6641.png']
        """
        body = {
                "build_file": "sample_build",
                "train_file": "sample_train",
                "seq_num": "sequence_18",
                "num": 5
               }
        resp = requests.post(config["API_ADDR"] + "/test", data=body)
        tmp = json.loads(resp.content.decode())
        self.assertEqual(tmp["filename"],
                         ['sequence_18.png',
                          'sequence_709.png',
                          'sequence_5002.png',
                          'sequence_3268.png',
                          'sequence_4157.png',
                          'sequence_6641.png'],
                         "Test endpoint does not return the expected image names.")
        
    def test_test_with_file_present_fail_invalid_var(self):
        """
        Test test with file present endpoint, with invalid num

        Expected result: 400 Bad Request
        Expected: "Bad request."
        """
        body = {
                "build_file": "sample_build",
                "train_file": "sample_train",
                "seq_num": "sequence_18",
                "num": -5
               }
        resp = requests.post(config["API_ADDR"] + "/test", data=body)
        tmp = json.loads(resp.content.decode())
        self.assertEqual(tmp["message"], "Bad request.", "Test endpoint form check not working.")
        
    def test_test_with_file_present_fail_num_too_high(self):
        """
        Test test with file present endpoint, with invalid num

        Expected result: 403 Forbidden
        Expected: "Number of sequences to retrieve exceeds 10!"
        """
        body = {
                "build_file": "sample_build",
                "train_file": "sample_train",
                "seq_num": "sequence_18",
                "num": 15
               }
        resp = requests.post(config["API_ADDR"] + "/test", data=body)
        tmp = json.loads(resp.content.decode())
        self.assertEqual(tmp["message"],
                         "Number of sequences to retrieve exceeds {}!".format(app_config["MAX_IMG"]),
                         "Test endpoint form check not working.")
        
    def test_test_with_file_present_fail_seq_not_in_dataset(self):
        """
        Test test with file present endpoint, with invalid sequence

        Expected result: 404 Not Found
        Expected: "sequence_10000 not found in sample.pkl."
        """
        body = {
                "build_file": "sample_build",
                "train_file": "sample_train",
                "seq_num": "sequence_10000",
                "num": 5
               }
        resp = requests.post(config["API_ADDR"] + "/test", data=body)
        tmp = json.loads(resp.content.decode())
        self.assertEqual(tmp["message"],
                         "{} not found in sample.pkl.".format(body["seq_num"]),
                         "Test endpoint form check not working.")
        
    def test_test_with_file_present_fail_null_file_name(self):
        """
        Test test with file present endpoint, with invalid sequence

        Expected result: 400 Bad Request
        Expected: "Bad request."
        """
        body = {
                "build_file": "",
                "train_file": "",
                "seq_num": "sequence_18",
                "num": 10
               }
        resp = requests.post(config["API_ADDR"] + "/test", data=body)
        tmp = json.loads(resp.content.decode())
        self.assertEqual(tmp["message"], "Bad request.", "Test endpoint form check not working.")
        
    def test_test_with_file_present_fail_file_does_not_exist(self):
        """
        Test test with file present endpoint, sending file name that does not exist

        Expected result: 404 Not Found
        Expected: "File(s) not found."
        """
        body = {
                "build_file": "random_build",
                "train_file": "random_train",
                "seq_num": "sequence_18",
                "num": 10
               }
        resp = requests.post(config["API_ADDR"] + "/test", data=body)
        tmp = json.loads(resp.content.decode())
        self.assertEqual(tmp["message"], "File(s) not found.", "Test endpoint form check not working.")


if __name__ == "__main__":
    unittest.main()

from flask_cors import cross_origin
from flask import current_app as app
from flask import request, jsonify, Blueprint, send_file
from multiprocessing import Queue
from database import get_database

import os
import threading
import shutil
import util.helper_function as helper

# Initialise blueprint for flask app
bp = Blueprint("play2vec", __name__)

# Create an instance of chosen database
db = get_database(app.config["DATABASE"], app.config["SAVE_PATH"])

# Initialise queues for flask app
build_queue = Queue()
build_file_queue = Queue()
build_prev_queue = Queue()

train_queue = Queue()
train_file_queue = Queue()
train_prev_queue = Queue()

gif_gen_queue = Queue()
gif_file_queue = Queue()
gif_gen_prev_queue = Queue()


@bp.route("/")
@cross_origin(origin="*")
def default():
    """
    Basic endpoint to check if application is running

    Requires:
    """
    return jsonify({"message": "Welcome to play2vec app!"}), 200


@bp.route("/gen-img", methods=["POST"])
@cross_origin(origin="*")
def gen_img():
    """
    Endpoint to accept requests to generate image

    Requires:
        file: String containing name of file to get data from
        seq_num: String containing sequence to draw image with, in the format "sequence_xx"
    """
    # Get values from form
    file_name = request.form["file"]
    seq_num = request.form["seq_num"]

    # Retrieve save path
    path = db.get_file_path(file_name).replace("/{}".format(file_name), "")
    
    # Check if file exists
    if not db.check_file(file_name):
        return jsonify({"message": "No such file!"}), 404

    # Check if image file exists
    if db.check_file(os.path.join(path, seq_num + ".png")):
        return jsonify({"filename": seq_num + ".png"}), 200

    # Retrieve required values to create image
    # Retrieve data from file
    data = db.get_data(file_name)

    # Retrieve image source path
    src_path = os.path.join(db.get_path(), "../")

    # Get the generated image name
    img = helper.get_fig(data, path, src_path, str.encode(seq_num))

    if not img:
        return jsonify({"message": "No such sequence!"}), 404
    
    return jsonify({"filename": img}), 200


@bp.route("/get-img", methods=["POST"])
@cross_origin(origin="*")
def get_img():
    """
    Endpoint to accept requests to retrieve image

    Requires:
        file: String containing name of file whose data is used to draw image with
        img: String containing name of image, in the format "sequence_xx.png"
    """
    # Get values from form
    img = request.form["img"]
    file_name = request.form["file"]

    # Get file path
    file_path = os.path.join(db.get_file_path(file_name).replace("/{}".format(file_name), ""), img)

    if not os.path.isfile(file_path):
        return jsonify({"message": "No such image!"}), 404
    
    return send_file(file_path, mimetype="image/png"), 200


@bp.route("/gen-gif", methods=["POST"])
@cross_origin(origin="*")
def gen_gif():
    """
    Endpoint to accept requests to generate gif

    Requires:
        file: String containing name of file to get data from
        seq_num: String containing sequence to draw gif with, in the format "sequence_xx"
    """
    # Check if a gif generating thread is already running
    if not gif_file_queue.empty():
        tmp = gif_file_queue.get()
        gif_file_queue.put(tmp)
        return jsonify({"message": "A gif generating thread for {} is already running.".format(tmp)}), 403

    # Get values from form
    file_name = request.form["file"]
    seq_num = request.form["seq_num"]

    # Get folder name
    tmp = helper.filter_file_name(file_name)
    folder_name = tmp.split("_sequence", 1)[0]
    
    # Check if file exists
    if not db.check_file(file_name):
        return jsonify({"message": "No such file!"}), 404

    # If gif already exists, save gif name into queue and return success message
    if db.check_file(folder_name + "_" + seq_num + ".gif"):
        gif_file_queue.put(file_name)
        gif_gen_queue.put(folder_name + "_" + seq_num + ".gif")
        return jsonify({"message": "Gif generating thread started successfully."}), 201

    # Retrieve required values to create image
    # Retrieve data from file
    data = db.get_data(file_name)

    # Retrieve save path
    path = db.get_file_path(file_name).replace("/{}".format(file_name), "")

    # Retrieve image source path
    src_path = os.path.join(db.get_path(), "../")

    # Create the gif generating thread
    gif = threading.Thread(target=helper.get_gif, args=("{}_{}".format(tmp, seq_num),
                                                        data,
                                                        path,
                                                        src_path,
                                                        seq_num,
                                                        gif_gen_queue,))
    
    gif_file_queue.put("{}_{}.gif".format(tmp, seq_num))
    gif.daemon = True
    gif.start()
    
    return jsonify({"message": "Gif generating thread started successfully."}), 201


@bp.route("/get-gif", methods=["POST"])
@cross_origin(origin="*")
def get_gif():
    """
    Endpoint to accept requests to retrieve gif

    Requires:
        gif: String containing name of gif to retrieve, in the format "filename_sequence_xx.gif"
    """
    # Get required value from form
    gif = request.form["gif"]

    # Get folder name and file name
    tmp = helper.filter_file_name(gif)
    folder_name = tmp.split("_sequence", 1)[0]
    file_name = "{}.pkl".format(folder_name)

    # Get file path of gif
    file_path = os.path.join(db.get_file_path(file_name).replace("/{}".format(file_name), ""), gif)

    if not os.path.isfile(file_path):
        return jsonify({"message": "No such gif!"}), 404
    
    return send_file(file_path, mimetype="image/gif"), 200


@bp.route("/file/<data_type>", methods=["GET", "POST", "DELETE"])
@cross_origin(origin="*")
def data_set(data_type):
    """
    Endpoint to accept requests to relating to files (whether delete, uploading or retrieving)

    Requires:
        data_type: type of file to retrieve (pkl, build, train)

        [POST]
            filename: String containing name of file
            file: Blob containing contents of file

        [DELETE]
            file: String containing name of file to be deleted
    """
    # Return bad request if extension not supported
    if not helper.get_ext(data_type):
        return jsonify({"message": "Bad request."}), 400

    # If request is to delete file
    if request.method == "DELETE":

        # Get required value from form
        file_name = request.form["file"]

        # Remove stuff like .pkl, _build etc from file name
        tmp = helper.filter_file_name(file_name)

        # If tmp is empty
        if tmp is file_name:
            return jsonify({"message": "Bad request."}), 400

        # Get database to delete file
        deleted_file = db.delete_data(file_name)
        
        if deleted_file:
            return jsonify({"message": deleted_file + " deleted"}), 200
        
        else:
            return jsonify({"message": "File not found."}), 404

    # If request is to get files
    elif request.method == "GET":

        # Get all files with the provided extension
        files = db.get_dataset(data_type)
        
        if files:
            return jsonify({"datasets": files}), 200
        else:
            return jsonify({"message": "File(s) not found."}), 404

    # If request is to upload files
    elif request.method == "POST":
        try:

            # Get required values from form
            recv_file = request.files["file"]
            file_name = request.form["filename"]

            # Get folder name and file type (pkl, build, train)
            tmp = helper.filter_file_name(file_name)
            file_type = helper.get_file_type(file_name)
            
            if tmp is file_name or data_type != file_type:
                return jsonify({"message": "Bad request."}), 400

            db.upload(recv_file, file_name)
            
            return jsonify({"message": "Upload success."}), 200
        except:
            return jsonify({"message": "Bad request."}), 400


@bp.route("/build", methods=["POST"])
@cross_origin(origin="*")
def build():
    """
    Endpoint to accept requests to start a build thread

    Requires:
        file: String containing name of file to get data from
        delta: Float containing delta value
    """
    # Check if a build thread is already running
    if not build_file_queue.empty():
        tmp = build_file_queue.get()
        build_file_queue.put(tmp)
        return jsonify({"message": "A build thread with {} is already running.".format(tmp)}), 403

    # Check if form values are valid
    if not helper.check_form(request.form):
        return jsonify({"message": "Bad request."}), 400

    # Get required values from form
    delta = float(request.form["delta"])
    file_name = request.form["file"]

    # Get base dataset file name
    tmp = helper.filter_file_name(file_name)

    # If file already exists, save file name into queue and return success message
    if db.check_file("{}_build".format(tmp)):
        build_queue.put("{}_build".format(tmp))
        build_file_queue.put(file_name)
        return jsonify({"message": "Building thread started successfully."}), 201

    # If folder name is emoty, return bad request
    if not tmp:
        return jsonify({"message": "Bad request."}), 400

    # If file is not found, return not found
    if not db.check_file(file_name):
        return jsonify({"message": "File not found."}), 404
    
    data = db.get_data(file_name)
    build_file_queue.put(file_name)
    
    corpus = threading.Thread(target=helper.build_corpus, args=(app._get_current_object(),
                                                                app.config["SEG"],
                                                                app.config["JACCARD_THRES"],
                                                                delta,
                                                                app.config["XLIM"],
                                                                app.config["YLIM"],
                                                                data,
                                                                file_name,
                                                                build_queue,))
    corpus.daemon = True
    corpus.start()
    return jsonify({"message": "Building thread started successfully."}), 201


@bp.route("/train", methods=["POST"])
@cross_origin(origin="*")
def train():
    """
    Endpoint to accept requests to start a train thread

    Requires:
        file: String containing name of file to get data from
        epoch: Integer containing number of epochs to train with
        batch_size: Integer containing batch size to train with
        learn_rate: Float containing learning rate to train with
    """
    # Check if a training thread is already running
    if not train_file_queue.empty():
        tmp = train_file_queue.get()
        train_file_queue.put(tmp)
        return jsonify({"message": "A training thread with {} is already running.".format(tmp)}), 403

    # Check form values are valid
    if not helper.check_form(request.form):
        return jsonify({"message": "Bad request."}), 400

    # Get requires values from form
    file_name = request.form["file"]
    epoch = int(request.form["epoch"])
    batch_size = int(request.form["batch_size"])
    learning_rate = float(request.form["learn_rate"])

    # Get folder name and file path
    tmp = helper.filter_file_name(file_name)
    file_path = os.path.join(os.getcwd(), app.config["SAVE_PATH"], tmp)

    # If file name is empty, return bad request
    if not file_name:
        return jsonify({"message": "Bad request."}), 400

    # If build file is not found, return not found
    if not db.check_file("{}_build".format(tmp)):
        return jsonify({"message": "File not found."}), 404

    # If file already exists, put file name into queue and return success message
    if db.check_file("{}_train".format(tmp)):
        train_queue.put("{}_train".format(tmp))
        train_file_queue.put(file_name)
        return jsonify({"message": "Training thread started successfully."}), 201

    # Get required data for training
    build_data = db.get_data(file_name)
    corpus = build_data["corpus"]
    noise_ogm_train_data = build_data["noise_ogm_train_data"]
    ogm_train_data = build_data["ogm_train_data"]
        
    train_file_queue.put(file_name)
    
    train_thread = threading.Thread(target=helper.train_model, args=(file_name,
                                                                     file_path,
                                                                     corpus,
                                                                     noise_ogm_train_data,
                                                                     ogm_train_data,
                                                                     epoch,
                                                                     batch_size,
                                                                     app.config["RNN_SIZE"],
                                                                     app.config["NUM_LAYER"],
                                                                     app.config["ENCODE_SIZE"],
                                                                     app.config["DECODE_SIZE"],
                                                                     learning_rate,
                                                                     app.config["WINDOW_SIZE"],
                                                                     train_queue,))
    
    train_thread.daemon = True
    train_thread.start()
    return jsonify({"message": "Training thread started successfully."}), 201


@bp.route("/test", methods=["POST"])
@cross_origin(origin="*")
def test():
    """
    Endpoint to accept requests to test model

    Requires:
        build_file: String containing name of build file to get data from
        train_file: String containing name of train file to get data from
        seq_num: String containing sequence number as reference for similar plays
        num: Integer containing number of sequences to retrieve
    """
    # Check form values are valid
    if not helper.check_form(request.form):
        return jsonify({"message": "Bad request."}), 400

    # Get required values from form
    build_file = request.form["build_file"]
    train_file = request.form["train_file"]
    seq_num = request.form["seq_num"]
    num = int(request.form["num"])

    # If user wants more images than is allowed, return bad request
    if num > app.config["MAX_IMG"]:
        return jsonify({"message": "Number of sequences to retrieve exceeds {}!".format(app.config["MAX_IMG"])}), 403

    # Get folder name
    folder_name = helper.filter_file_name(build_file)

    # If folder naem is empty, return bad request
    if not folder_name:
        return jsonify({"message": "Bad request."}), 400

    # If file(s) are not found, return not found
    if not db.check_file(build_file) or not db.check_file(train_file):
        return jsonify({"message": "File(s) not found."}), 404

    # Get original data
    data = db.get_data(folder_name + ".pkl")

    # If sequence number is not found in data, return not found
    if seq_num.encode() not in data.keys():
        return jsonify({"message": "{} not found in {}.".format(seq_num, folder_name + ".pkl")}), 404

    # If folder name is empty, return bad request
    if not folder_name:
        return jsonify({"message": "Bad request."}), 400

    # Get required data for testing
    build_data = db.get_data(build_file)
    train_data = db.get_data(train_file)
    
    noise_data = build_data["train_noise_data"]
    noise_ogm_train_data = build_data["noise_ogm_train_data"]
    ogm_train_data = build_data["ogm_train_data"]
    ogm_train_key = build_data["ogm_train_key"]
    corpus = build_data["corpus"]
    embed_mat = train_data["embed_mat"]

    # Retrieve required values to create image
    # Retrieve data from file
    file_path = db.get_file_path(build_file).replace("/{}".format(build_file), "")

    # Retrieve image source path
    src_path = os.path.join(db.get_path(), "../")

    # Retrieve checkpoint file name
    file_name = "{}_model.ckpt".format(folder_name)
    
    img = helper.test_model(file_path,
                            src_path,
                            file_name,
                            data,
                            noise_data,
                            noise_ogm_train_data,
                            ogm_train_data,
                            ogm_train_key,
                            embed_mat,
                            corpus,
                            seq_num,
                            num)

    return jsonify({"filename": img}), 200


@bp.route("/status/<data_type>/<file_name>", methods=["GET"])
@cross_origin(origin="*")
def status(data_type, file_name):
    """
    Endpoint to accept requests to retrieve status of thread
    """
    if data_type == "build":

        # Check if queue is empty
        tmp = helper.check_queue(data_type, file_name, build_file_queue)

        # If queue is not empty, return message
        if tmp:
            return jsonify({"message": tmp}), 403

        if build_queue.empty():
            if build_prev_queue.empty():
                tmp = float(0)
            else:
                tmp = build_prev_queue.get()
        else:
            tmp = build_queue.get()
            
        while not build_prev_queue.empty():
            build_prev_queue.get()
            
        build_prev_queue.put(tmp)
        
    elif data_type == "train":

        # Check if queue is empty
        tmp = helper.check_queue(data_type, file_name, train_file_queue)

        # If queue is not empty, return message
        if tmp:
            return jsonify({"message": tmp}), 403
            
        if train_queue.empty():
            if train_prev_queue.empty():
                tmp = float(0)
            else:
                tmp = train_prev_queue.get()
        else:
            tmp = train_queue.get()
            
        while not train_prev_queue.empty():
            train_prev_queue.get()
            
        train_prev_queue.put(tmp)
        
    elif data_type == "gif":

        # Check if queue is empty
        tmp = helper.check_queue(data_type, file_name, gif_file_queue)

        # If queue is not empty, return message
        if tmp:
            return jsonify({"message": tmp}), 403
            
        if gif_gen_queue.empty():
            if gif_gen_prev_queue.empty():
                tmp = float(0)
            else:
                tmp = gif_gen_prev_queue.get()
        else:
            tmp = gif_gen_queue.get()
            
        while not gif_gen_prev_queue.empty():
            gif_gen_prev_queue.get()
            
        gif_gen_prev_queue.put(tmp)

    # Check if queue contains file name or progress and return accordingly
    if type(tmp[0]) == float:
        return jsonify({"progress": str(tmp)})
    else:
        if data_type == "build":
            helper.clear_queue(build_queue)
            helper.clear_queue(build_file_queue)
            helper.clear_queue(build_prev_queue)
        elif data_type == "train":
            helper.clear_queue(train_queue)
            helper.clear_queue(train_file_queue)
            helper.clear_queue(train_prev_queue)
        elif data_type == "gif":
            helper.clear_queue(gif_gen_queue)
            helper.clear_queue(gif_file_queue)
            helper.clear_queue(gif_gen_prev_queue)
        return jsonify({"filename": tmp})


@bp.route("/download", methods=["POST"])
@cross_origin(origin="*")
def download():
    """
    Endpoint to accept requests to download file

    Requires:
        file: String containing name of file to download
    """
    # Get required value from form
    file_name = request.form["file"]

    # Get file path of file to download
    file_path = db.get_file_path(file_name)
    
    if "checkpoint" in file_path:
        tmp = file_name.split("_")[0]
        file_path = file_path.replace("/{}".format(file_name), "")
        
        zip_file = os.path.join(file_path.replace("checkpoint", ""), "{}_checkpoint".format(tmp))
        
        if not os.path.exists(zip_file):
            shutil.make_archive(zip_file, "zip", "{}/..".format(file_path), "checkpoint")
        
        file_path = "{}.zip".format(zip_file)
        
    if os.path.isfile(file_path):
        return send_file(file_path), 200
    else:
        return jsonify({"message": "File not found."}), 404

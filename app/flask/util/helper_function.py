import pickle
import sys
import os
import ast

from . import build
from . import train
from . import test
from . import viz as v
from os import listdir
from os.path import isfile, join

sys.path.append("../../src")

import preprocess as pp


def check_form(form):
    """
    Helper function to check form in request

    Requires:
        form: request.form received by flask application
    """
    if "seg" in form.keys():
        if int(form["seg"]) < 0:
            return False
    if "delta" in form.keys():
       if float(form["delta"]) < 0:
           return False
    if "epoch" in form.keys():
        if int(form["epoch"]) < 0:
            return False
    if "batch_size" in form.keys():
        if int(form["batch_size"]) < 0:
            return False
    if "learn_rate" in form.keys():
        if float(form["learn_rate"]) < 0 or float(form["learn_rate"]) > 1:
            return False
    if "num" in form.keys():
        if int(form["num"]) < 0:
            return False
    return True


def clear_queue(queue):
    while not queue.empty():
        queue.get()
    return



def check_queue(data_type, file_name, queue):
    """
    Helper function to check queue

    Requires:
        data_type: String containing type of queue to check (build, train etc)
        file_name: String containing file name for checking purposes
        queue: Queue to check
    """
    if queue.empty():
        return "No running {} threads.".format(data_type)
    tmp = queue.get()
    queue.put(tmp)
    if filter_file_name(file_name) not in tmp:
        return "Running {} thread with {} instead of {}.".format(data_type, tmp, file_name)
    return


def get_ext(file_type):
    """
    Helper function to get extension of file

    Requires:
        file_type: /file/<file_type> received by flask application
    """
    if file_type == "dataset":
        return ".pkl"
    elif file_type == "build":
        return "_build"
    elif file_type == "train":
        return "_train"
    elif file_type == "ckpt":
        return ".ckpt.meta"
    else:
        return


def get_file_type(file_name):
    """
    Helper function to get file type given file name

    Requires:
        file_name: String containing name of file
    """
    if ".pkl" in file_name:
        return "dataset"
    elif "build" in file_name:
        return "build"
    elif "train" in file_name:
        return "train"
    elif "ckpt" in file_name:
        return "ckpt"


def filter_file_name(file_name):
    """
    Helper function to remove extension of file given file name

    Requires:
        file_name: String containing name of file
    """
    if ".pkl" in file_name:
        return file_name[:-4]
    elif "build" in file_name:
        return file_name.replace("_build", "")
    elif "train" in file_name:
        return file_name.replace("_train", "")
    elif ".ckpt" in file_name:
        return file_name.split(".")[0].split("_")[0]
    else:
        return file_name


def get_fig(data, path, src_path, seq_num):
    """
    Helper function to draw a sequence on a plot

    Requires:
        data: data from chosen file
        path: String containing save path
        src_path: String containing base image source path
        seq_num: String containing sequence to draw, in the format "sequence_xx"
    """
    img = pp.draw(seq=seq_num, data=data, path=path, src_path=src_path)
    return img


def get_gif(name, data, path, src_path, seq_num, queue):
    """
    Helper function to draw a gif on a plot

    Requires:
        name: String containing name to use to save gif
        data: data from chosen file
        path: String containing save path
        src_path: String containing base image source path
        seq_num: String containing sequence to draw, in the format "sequence_xx"
    """
    v.viz_impl(seq=str.encode(seq_num), data=data, queue=queue, save_name=name, path=path, src_path=src_path, save=True)


def build_corpus(app, seg, thres, delta, xlim, ylim, data, file_name, queue):
    """
    Helper function to build corpus

    Requires:
        app: Application context
        seg: Integer containing segment length
        thres: Jaccard threshold
        delta: Float containing delta value to use
        xlim: Array of 2 floats containing the x-axis limits
        ylim: Array of 2 floats containing the y-axis limits
        data: data from chosen file
        file_name: String containing name of chosen file
        queue: Queue to use while building corpus
    """

    # ogm
    ogm_train_data, ogm_train_key = build.ogm_impl(data, seg, delta, xlim, ylim, queue)
    
    # corrupted_noise
    noise_ogm_train_data, train_noise_data = build.noise_impl(data, seg, delta, xlim, ylim, queue)
    
    # corrupted_drop
    # drop_ogm_train_data = build.drop_impl(train_data, seg, delta, xlim, ylim, seq_num, queue)
    
    # building
    build.build_impl(app,
                     seg,
                     delta,
                     xlim,
                     ylim,
                     file_name,
                     train_noise_data,
                     ogm_train_data,
                     ogm_train_key,
                     noise_ogm_train_data,
                     queue)


def train_model(file_name, file_path, corpus, noise_ogm_train_data, ogm_train_data, epoch, batch_size, rnn_size,
                num_layers, encoding_embedding_size, decoding_embedding_size, learning_rate, window_size, queue):
    """
    Helper function to train model
    """
    embed_mat = train.embed_impl(file_name, file_path, corpus, epoch, batch_size, window_size, queue)
    train.dae_impl(file_name,
                   file_path,
                   corpus,
                   noise_ogm_train_data,
                   ogm_train_data,
                   embed_mat,
                   epoch,
                   batch_size,
                   rnn_size,
                   num_layers,
                   encoding_embedding_size,
                   decoding_embedding_size,
                   learning_rate,
                   queue)


def test_model(file_path, src_path, file_name, org_data, noise_data, noise_ogm_train_data, ogm_train_data,
               ogm_train_key, embed_mat, corpus, seq_num, num):
    """
    Helper function to test model, returns an array of size num + 1 consisting of image names
    """

    img = test.test_impl(file_path, src_path, file_name, org_data, noise_data, noise_ogm_train_data, ogm_train_data,
                         ogm_train_key, embed_mat, corpus, seq_num, num)
    
    return img

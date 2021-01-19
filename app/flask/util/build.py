import sys
import pickle
import os
from flask import current_app as app

sys.path.append("../../src")

import ogm
import building
import corrupted_noise as noise
import corrupted_drop as drop


def ogm_impl(train_data, seg, delta, xlim, ylim, queue):
    ogm_train_data = []
    ogm_train_key = []

    for key in train_data.keys():
        if queue.empty():
            num = list(train_data.keys()).index(key) + 1
            den = len(list(train_data.keys()))
            queue.put([num / den, 0, 0])
        ogm_train_data.append(
            ogm.mseq2ogm(seq=key,
                         data=train_data,
                         segment=seg,
                         delta=delta,
                         xlim=xlim,
                         ylim=ylim)
        )
        ogm_train_key.append(key)
        
    return ogm_train_data, ogm_train_key


def noise_impl(train_data, seg, delta, xlim, ylim, queue):
    train_noise_data = noise.corrupt_noise(train_data, rate_noise=0.2, factor=1)

    noise_ogm_train_data = []

    for key in train_noise_data.keys():

        if queue.empty():
            num = list(train_noise_data.keys()).index(key) + 1
            den = len(list(train_noise_data.keys()))
            queue.put([float(0), num / den, 0])
        noise_ogm_train_data.append(noise.mseq2ogm(seq=key,
                                                   data=train_noise_data,
                                                   segment=seg,
                                                   delta=delta,
                                                   xlim=xlim,
                                                   ylim=ylim))

    return noise_ogm_train_data, train_noise_data


# def drop_impl(train_data, seg, delta, xlim, ylim, seq_num, queue):
#     drop_id = drop.corrupt_drop(train_data, rate_drop=0.2)
#
#     drop_ogm_train_data = [drop.mseq2ogm(seq=seq_num,
#                                          data=train_data,
#                                          segment=seg,
#                                          delta=delta,
#                                          xlim=xlim,
#                                          ylim=ylim,
#                                          drop_id=drop_id[seq_num])]
#
#     return drop_ogm_train_data


def build_impl(app, seg, thres, delta, xlim, ylim, file_name, train_noise_data, ogm_train_data, ogm_train_key, noise_ogm_train_data, queue):
    
    senbag = ogm_train_data + noise_ogm_train_data
    corpus = {}
    id = 0
    counter = 1
    
    for wordbag in senbag:
        
        if queue.empty():
            queue.put([float(0), 0, counter/len(senbag)])
        for words in wordbag:
            temp = -1
            temp_value = -1
            if id == 0:
                corpus[frozenset(words)] = id
                id = id + 1
                continue
            for key, value in corpus.items():
                J = building.Jaccard(frozenset(words), key)
                if temp < J:
                    temp = J
                    temp_value = value
            if temp > thres:
                corpus[frozenset(words)] = temp_value
            else:
                corpus[frozenset(words)] = id
                id = id + 1
        counter += 1
    
    corpus_file_name = os.path.join(os.getcwd(), app.config["SAVE_PATH"], file_name[:-4], "{}_build".format(file_name[:-4]))
    
    tmp = open(corpus_file_name, "wb")
    data = {
            "delta": delta, 
            "xlim": xlim, 
            "ylim": ylim,
            "corpus": corpus, 
            "noise_ogm_train_data": noise_ogm_train_data, 
            "train_noise_data": train_noise_data, 
            "ogm_train_data": ogm_train_data, 
            "ogm_train_key": ogm_train_key
        }
        
    pickle.dump(data, tmp, protocol=2)
    
    queue.put("{}_build".format(file_name[:-4]))

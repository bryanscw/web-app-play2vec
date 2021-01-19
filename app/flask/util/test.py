import os
import sys
import pickle
import copy
import numpy as np
import tensorflow as tf

sys.path.append("../../src")

import estimate as est
import preprocess


def test_impl(file_path, src_path, file_name, org_data, noise_data, noise_ogm_train_data, ogm_train_data, ogm_train_key, embed_mat, corpus, seq_num, num):

    np.random.seed(123)
    tf.compat.v1.random.set_random_seed(123)
    
    img = []
    seq = []
    
    # testing
    draw_data = {}
    draw_data.update(org_data.items()) 
    draw_data.update({k + b"noise": v for k, v in noise_data.items()}.items())
    train_key = ogm_train_key + [i + b"noise" for i in ogm_train_key]
    estimate = ogm_train_data + noise_ogm_train_data
    
    embed_mat, source_int_to_letter, source_letter_to_int, source_int = est.model_preprocess(embed_mat, corpus, estimate)
    
    represent = est.get_result(source_int, embed_mat, source_letter_to_int, os.path.join(file_path, "checkpoint"), file_name)[0]
    
    img.append(preprocess.draw(seq=str.encode(seq_num), data=draw_data, path=file_path, src_path=src_path))
    
    tmp = copy.deepcopy(num)
    
    while len(img) != num + 1:
    
        res = est.search(represent, str.encode(seq_num), train_key, topk=tmp)

        for play in res:
        
            if b"noise" in play or play in seq:
                continue
            
            seq.append(play)
            img.append(preprocess.draw(seq=play, data=draw_data, path=file_path, src_path=src_path))
            
            if len(img) == num + 1:
                break
        
        tmp += num
    
    return img

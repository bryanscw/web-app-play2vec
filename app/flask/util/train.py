import sys
import os, os.path
import pickle
import tensorflow as tf
import numpy as np
sys.path.append("../../src")

import embedding as eb
import dae


def embed_impl(file_name, file_path, corpus, epoch, batch_size, window_size, queue):
    int_to_vocab = {v: k for k, v in corpus.items()}
    int_words = list(corpus.values())
    train_words = int_words

    train_graph = tf.Graph()

    with train_graph.as_default():
        inputs = tf.compat.v1.placeholder(tf.int32, shape=[None], name="inputs")
        labels = tf.compat.v1.placeholder(tf.int32, shape=[None, None], name="labels")

    vocab_size = len(int_to_vocab)
    embedding_size = 20
    
    with train_graph.as_default():
        embedding = tf.Variable(tf.random.uniform([vocab_size, embedding_size], -1, 1))
        embed = tf.nn.embedding_lookup(embedding, inputs)

    n_sampled = 100

    with train_graph.as_default():
        softmax_w = tf.Variable(tf.random.truncated_normal([vocab_size, embedding_size], stddev=0.1))
        softmax_b = tf.Variable(tf.zeros(vocab_size))

        # negative sampling loss
        loss = tf.nn.sampled_softmax_loss(softmax_w, softmax_b, labels, embed, n_sampled, vocab_size)

        cost = tf.reduce_mean(loss)
        optimizer = tf.compat.v1.train.AdamOptimizer().minimize(cost)

    with train_graph.as_default():
        norm = tf.sqrt(tf.reduce_sum(tf.square(embedding), 1, keepdims=True))
        normalized_embedding = embedding / norm

    with train_graph.as_default():
        saver = tf.compat.v1.train.Saver()

    path = os.path.join(file_path, "checkpoint")
    checkpoint = os.path.join(path, "{}_ogm.ckpt".format(file_name))

    if not os.path.exists(path):
        os.makedirs(path)

    with tf.compat.v1.Session(graph=train_graph) as sess:
        
        loss = 0
        sess.run(tf.compat.v1.global_variables_initializer())
        
        if os.path.exists(checkpoint):
            saver.restore(sess, checkpoint)
    
        for e in range(1, epoch+1):
            batches = eb.get_batches(train_words, batch_size, window_size)
            for x, y in batches:
                feed = {inputs: x,
                        labels: np.array(y)[:, None]}
                train_loss, _ = sess.run([cost, optimizer], feed_dict=feed)
                
                loss += train_loss
                
                if queue.empty():
                    queue.put([e-1/(epoch*2), 0])
                    
        saver.save(sess, checkpoint)
        embed_mat = sess.run(normalized_embedding)
        
    return embed_mat


def dae_impl(file_name, file_path, corpus, noise_ogm_train_data, ogm_train_data, embed_mat, epoch, batch_size, rnn_size, num_layers, encoding_embedding_size, decoding_embedding_size, learning_rate, queue):
    embed_mat = np.r_[embed_mat,np.random.rand(len(embed_mat[0])).reshape(1, -1)]
    embed_mat = np.r_[embed_mat,np.random.rand(len(embed_mat[0])).reshape(1, -1)]
    embed_mat = np.r_[embed_mat,np.random.rand(len(embed_mat[0])).reshape(1, -1)]
    embed_mat = np.r_[embed_mat,np.random.rand(len(embed_mat[0])).reshape(1, -1)]
    
    source_int_to_letter, source_letter_to_int = dae.extract_character_vocab(noise_ogm_train_data, corpus)
    target_int_to_letter, target_letter_to_int = dae.extract_character_vocab(ogm_train_data, corpus)
    source_int = dae.mapping_source_int(noise_ogm_train_data, corpus)
    target_int = dae.mapping_target_int(ogm_train_data, corpus)

    # building graph
    train_graph = tf.Graph()
    with train_graph.as_default():
        embed_seq, input_data, targets, lr, target_sequence_length, max_target_sequence_length, source_sequence_length = dae.get_inputs()
        training_decoder_output, predicting_decoder_output = dae.seq2seq_model(embed_seq,
                                                                               input_data,
                                                                               targets,
                                                                               lr,
                                                                               target_sequence_length,
                                                                               max_target_sequence_length,
                                                                               source_sequence_length,
                                                                               len(source_letter_to_int),
                                                                               len(target_letter_to_int),
                                                                               encoding_embedding_size,
                                                                               decoding_embedding_size,
                                                                               rnn_size,
                                                                               num_layers)
        training_logits = tf.identity(training_decoder_output.rnn_output, "logits")

        masks = tf.sequence_mask(target_sequence_length, max_target_sequence_length, dtype=tf.float32, name="masks")

        with tf.name_scope("optimization"):
            # Loss function
            cost = tf.contrib.seq2seq.sequence_loss(
                                                    training_logits,
                                                    targets,
                                                    masks)
            # Optimizer
            optimizer = tf.train.AdamOptimizer(lr)

            # Gradient Clipping
            gradients = optimizer.compute_gradients(cost)
            capped_gradients = [(tf.clip_by_value(grad, -5., 5.), var) for grad, var in gradients if grad is not None]
            train_op = optimizer.apply_gradients(capped_gradients)
    
    # train and validation
    train_source = source_int[batch_size:]
    train_target = target_int[batch_size:]

    path = os.path.join(file_path, "checkpoint")
    checkpoint = os.path.join(path, "{}_model.ckpt".format(file_name))

    if not os.path.exists(path):
        os.makedirs(path)

    with tf.Session(graph=train_graph) as sess:
        sess.run(tf.global_variables_initializer())
        
        if os.path.exists(checkpoint):
            saver.restore(sess, checkpoint)
            
        for epoch_i in range(1, epoch+1):
            for batch_i, (embed_batch, targets_batch, sources_batch, targets_lengths, sources_lengths) in enumerate(
                    dae.get_batches(train_target, train_source, batch_size,
                                    source_letter_to_int["<PAD>"],
                                    target_letter_to_int["<PAD>"],
                                    embed_mat)):
                _ , loss = sess.run(
                       [train_op, cost],
                       {embed_seq: embed_batch,
                        input_data: sources_batch,
                        targets: targets_batch,
                        lr: learning_rate,
                        target_sequence_length: targets_lengths,
                        source_sequence_length: sources_lengths})
                if queue.empty():
                    if round(((batch_i * epoch_i)/(epoch * len(train_source))), 2) == 1:
                        continue
                    queue.put([float(0), (batch_i * epoch_i)/(epoch * len(train_source))])
        # save model
        saver = tf.train.Saver()
        saver.save(sess, checkpoint)
    
    train_file_name = os.path.join(file_path, file_name + "_train")
    
    tmp = open(train_file_name, "wb")
    
    train = {
            "epoch": epoch,
            "embed_mat": embed_mat
          }
          
    pickle.dump(train, tmp, protocol=2)
    queue.put(file_name + "_train")

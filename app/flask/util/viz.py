import pickle
import os
import imageio
import matplotlib.pyplot as plt
import numpy as np
from PIL import Image


def viz_impl(seq, data, src_path="", queue=None, save_name=None, path=None, save=False):

    image = []
    
    if not os.path.exists(path):
        os.makedirs(path)
    
    if seq not in data.keys():
        if queue:
            queue.put("No such sequence!")
        else:
            print("No this sequence!")
        
    else:
        
        defense_x = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20]
        attacking_x = [22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42]
        ball_x = [44]
        plt.figure()
        
        for frame in range(len(data[seq])):
        
            plt.xlim(-52.5, 52.5)
            plt.ylim(-34, 34)
            img=plt.imread(src_path + "so.gif")
            plt.imshow(img, zorder=0, extent=[-52.5, 52.5, -34, 34], aspect="auto")
            plt.axis("off")
            
            for i in defense_x:
                l1, = plt.plot(data[seq][frame, i], data[seq][frame, i+1], "b-", linewidth=1)
                plt.scatter(data[seq][frame, i], data[seq][frame, i+1], marker=".", color="b", s=100)
                
            for i in attacking_x:
                l2, = plt.plot(data[seq][frame, i], data[seq][frame, i+1], "r-", linewidth=1)
                plt.scatter(data[seq][frame, i], data[seq][frame, i+1], marker=".", color="r", s=100)
                
            for i in ball_x:
                l3, = plt.plot(data[seq][frame, i], data[seq][frame, i+1], " yo", linewidth=1)
            
            # plt.legend(handles = [l1, l2, l3], labels = ["defense","attacking","ball"], loc = "best")

            if save:
                plt.savefig(os.path.join(path, "frame{}.eps".format(frame)), format="eps", dpi=1000)

            plt.clf()
            image.append(imageio.imread(os.path.join(path, "frame{}.eps".format(frame))))
                
            if queue:
                if queue.empty():
                    queue.put([int(frame)/len(data[seq])])
    
    if image:
        imageio.mimsave(os.path.join(path, "{}.gif".format(save_name)), image)
        for file_name in os.listdir(path):
            if ".eps" in file_name:
                os.remove(os.path.join(path, file_name))
                
        if queue:
            if not queue.empty():
                queue.get()
            queue.put("{}.gif".format(save_name))

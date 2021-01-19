import os
import pickle


class FileDB:
    def __init__(self, data_path):
        """
        Initialises self.path with the save path of flask application
        """
        self.path = os.path.join(os.getcwd(), data_path)
        
    def get_path(self):
        """
        Returns save path of flask application relative to container/user
        """
        return self.path
        
    def get_data(self, file_name):
        """
        Returns data within provided file
        """
        folder_name = file_name.split("_", 1)[0].replace(".pkl", "")
        
        return pickle.load(open(os.path.join(self.path, folder_name, file_name), "rb"), encoding="bytes")
    
    def check_file(self, file_name):
        """
        Checks if file exists
        """
        if "." in file_name:
            folder_name = file_name.split(".", 1)[0]
        
        else:
            folder_name = file_name.split("_", 1)[0]
        
        return os.path.exists(os.path.join(self.path, folder_name, file_name))
        
    def check_img(self, file_path):
        """
        Checks if image file exists
        """
        return os.path.exists(os.path.join(self.path, file_path))
        
    def get_file_path(self, file_name):
        """
        Returns exact file path of provided file
        """
        folder_name = file_name.split("_", 1)[0].replace(".pkl", "")
        
        if "checkpoint" in file_name:
            return os.path.join(self.path, folder_name, "checkpoint", file_name)
            
        else:
            return os.path.join(self.path, folder_name, file_name)
    
    def get_dataset(self, file_type):
        """
        Returns all files matching file_type
        """
        
        if file_type == "dataset":
            ext = ".pkl"
        elif file_type == "build":
            ext = "_build"
        elif file_type == "train":
            ext = "_train"
            
        if file_type == "ckpt":
            return ["{}_{}".format(root.split("/")[-1], name) for root, dirs, files in os.walk(self.path) for name in dirs if "checkpoint" in name]
        else:
            return [name for root, dirs, files in os.walk(self.path) for name in files if ext in name]
    
    def delete_data(self, file_name):
        """
        Deletes file given file name
        """
        folder_name = file_name.split("_", 1)[0].replace(".pkl", "")
        
        if "ckpt" in file_name:
            file_path = os.path.join(self.path, folder_name, "checkpoint", file_name)
        
        else:
            file_path = os.path.join(self.path, folder_name, file_name)
            
        if not os.path.exists(file_path):
            return
            
        os.remove(os.path.join(self.path, file_path))
        return file_name
        
    def upload(self, recv_file, file_name):
        """
        Uploads file contents given blob and file name
        """
        folder_name = file_name.split("_", 1)[0].replace(".pkl", "")
        
        file_path = os.path.join(self.path, folder_name)
        
        if not os.path.exists(file_path):
            os.makedirs(file_path)
            
        if ".ckpt" in file_name or "checkpoint" in file_name:
            file_path = os.path.join(file_path, "checkpoint")
            
            if not os.path.exists(file_path):
                os.makedirs(file_path)
            
        recv_file.save(os.path.join(file_path, file_name))

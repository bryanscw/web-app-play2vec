from database.file import FileDB

def get_database(config, data_path=None):
    if config == "file":
        return FileDB(data_path)

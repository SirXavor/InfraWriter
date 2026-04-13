from threading import Lock

_repo_lock = Lock()


class RepoLock:
    def __enter__(self):
        _repo_lock.acquire()

    def __exit__(self, exc_type, exc_val, exc_tb):
        _repo_lock.release()
const localStorageKey = 'vue-game-server';

class ClientStorageService {
    _interval = null;
    _data = JSON.parse(localStorage[localStorageKey]||'{}');

    get data() {
        clearInterval(this._interval);
        this._interval = setTimeout(() => {
            this.saveState();
        }, 1);
        return this._data;
    }

    getData(key, val) {
        return this._data[key];
    }

    setData(key, val) {
        this._data[key] = val;
        this.saveState();
        return val;
    }

    delData(key) {
        delete this._data[key];
        this.saveState();
    }

    saveState() {
        localStorage[localStorageKey] = JSON.stringify(this._data);
    }
}

module.exports = new ClientStorageService();

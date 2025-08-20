import Vue from 'vue';
import Peer from 'peerjs';

const updateControlsDebounce = 20;

class ConnectionRef {
    connectedAt;
    registeredAt;
    id;
    controller;
    connection;
    name;
    actor;
    chosenWeapon;
    team;

    _updateCtrlInterval;
    _updateCtrlData;

    constructor(conn, id) {
        this.connection = conn;
        this.id = id;
        this.connectedAt = Date.now();
    }

    send(data) {
        this.connection.send(data);
    }

    updateControls(data) {
        this._updateCtrlData = data;
        if ( !this._updateCtrlInterval ) {
            this.actor.controller.setSerializable(this._updateCtrlData);
            this._updateCtrlInterval = setTimeout(() => this._updateCtrlInterval = null, updateControlsDebounce);
        }
    }
}

class ServerConnectionService {
    _nextIndex = 0;
    peer        = new Peer(null, {key : peerApiKey});
    connections = {};

    getIndex() {
        return this._nextIndex += 1;
    }

    constructor() {
        this.peer.on('connection', conn => {

            conn.on('open', () => {

                let ind = this.getIndex();
                Vue.set(this.connections, ind, new ConnectionRef(conn, ind));

                conn.on('data', data => this.handleClientMessage(this.connections[ind], data));
                conn.on('close', data => {
                    if ( this.controller ) {
                        this.controller.deletePlayer(ind);
                    } else {
                        delete this.connections[ind];
                    }
                });
            });

        });
    }

    handleClientMessage(connRef, req) {
        //console.log(connRef, req);
        if ( this.controller && req.action ) {
            this.controller.handleClientMessage(connRef, req);
        }
    }

    send(data) {
        Object.keys(this.connections).forEach(id => {
            this.connections[id].send(data);
        });
    }
}

module.exports = new ServerConnectionService();

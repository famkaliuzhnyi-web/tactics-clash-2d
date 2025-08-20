import Peer from 'peerjs';

class ClientConnectionService {
    controller;
    connection;
    peer = new Peer(null, { key: peerApiKey });

    constructor() {
    }

    connect(key) {
        this.connection = this.peer.connect(key);
        this.connection.on('open', () => {
            this.connection.on('data', data => {
                this.handleServerMessage(data);
            });
            this.connection.send({
                action: 'getLevelState'
            });
        });
        this.connection.on('close', () => {
            if ( this.controller ) {
                this.controller.disconnected();
            }
        });
    }

    handleServerMessage(req) {
        //console.log(req);
        if ( this.controller && req.action ) {
            this.controller.handleServerMessage(req);
        }
    }

    send(data) {
        this.connection.send(data);
    }
}

module.exports = new ClientConnectionService();

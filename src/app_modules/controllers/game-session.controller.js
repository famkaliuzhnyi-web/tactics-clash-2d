export const STATES = {
    lobby  : 'lobby',
    play   : 'play',
    finish : 'finish'
};

const CHECKTS = 1000;

export class GameSessionController {
    states               = STATES;
    state                = STATES.lobby;
    playerTeamMapping    = {};
    redTeamAlivePlayers  = 0;
    blueTeamAlivePlayers = 0;
    playerScores         = {};
    onlobby              = () => {};
    onplay               = () => {};
    onfinish             = () => {};
    onstateChange        = () => {};
    _interval            = () => {};
    latestWinTeam;

    start() {
        this.stop();
        this.state = STATES.lobby;
        this.onlobby();
        this.onstateChange(this.state);
        this._interval = setInterval(this.checkState.bind(this), CHECKTS);
    }

    stop() {
        clearInterval(this._interval);
    }

    resetAlive() {
        this.redTeamAlivePlayers = 0;
        this.blueTeamAlivePlayers = 0;

        Object.keys(this.playerTeamMapping).forEach(pid => {
            this[this.playerTeamMapping[pid]+'TeamAlivePlayers'] += 1;
        });
    }

    registerPlayer(player) {
        if ( player.team === 'red' ) {
            this.redTeamAlivePlayers += 1;
        } else {
            this.blueTeamAlivePlayers += 1;
        }
        this.playerTeamMapping[player.id] = player.team;
        this.playerScores[player.id]      = 0;
    }

    _removePlayerFromTeam(player, team) {
        if ( this.playerTeamMapping[player.id] ) {
            delete this.playerTeamMapping[player.id];
            delete this.playerScores[player.id];
            if ( !player.actor.isDead ) {
                this[team + 'TeamAlivePlayers'] -= 1;
            }
        }
    }

    removePlayer(player) {
        this._removePlayerFromTeam(player, player.team);
    }

    handleKill(target, killer) {
        this.playerScores[killer.connectionId] += 1;
        this[this.playerTeamMapping[target.connectionId] + 'TeamAlivePlayers'] -= 1;
    }

    stateHandlers = {
        lobby  : () => {
            //console.log('lobby');
            if ( this.redTeamAlivePlayers && this.blueTeamAlivePlayers ) {
                this.state = STATES.play;
                this.onplay();
                this.onstateChange(this.state);
            }
        },
        play   : () => {
            //console.log('play');
            if ( !this.redTeamAlivePlayers || !this.blueTeamAlivePlayers ) {
                this.latestWinTeam = this.redTeamAlivePlayers && 'red' || 'blue';
                this.state = STATES.finish;
                this.onfinish();
                this.onstateChange(this.state);
            }
        },
        finish : () => {
            //console.log('finish');
            this.stop();
        }
    };

    checkState() {
        this.stateHandlers[this.state]();
    }
}

export default {
    name : 'score-widget',
    props: ['controller'],
    data() {
        return {};
    },
    computed: {
        teams() {
            let result = {
                red: [],
                blue: []
            };

            Object.keys(this.controller.players).forEach(pid => {
                let player = this.controller.players[pid];
                result[player.team].push(player);
            });

            console.log(result, this.controller.players);
            return result;
        }
    },
    methods: {
        getTeamName(team) {
            if ( team === 'red' ) {
                return this.controller.levelParams.redTeamName;
            } else {
                return this.controller.levelParams.blueTeamName;
            }
        }
    }
};

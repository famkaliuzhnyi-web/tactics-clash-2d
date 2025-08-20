import Gamefield from './gamefield';

const doOnActor = function(ref) {
    return new Promise(resolve => {
        let actor = ref.levelRef.actors[0];
        if ( actor ) {
            resolve(actor);
        }
    });
};

export default {
    name : 'scene-player',
    components: {
        gamefield: Gamefield
    },
    props: ['levelRef'],
    data() {
        return {
        };
    },
    mounted: function() {
        this.$el.getElementsByClassName('focusInput')[0].focus();
    },
    methods: {
        handlePointer(x, y) {
            doOnActor(this).then(actor => actor.facePotentialPosition(x, y));
        },
        handleWDown() {
            doOnActor(this).then(actor => actor.controller.isMovingForward = true);
        },
        handleWUp() {
            doOnActor(this).then(actor => actor.controller.isMovingForward = false);
        },
        handleDDown() {
            doOnActor(this).then(actor => actor.controller.isMovingRight = true);
        },
        handleDUp() {
            doOnActor(this).then(actor => actor.controller.isMovingRight = false);
        },
        handleADown() {
            doOnActor(this).then(actor => actor.controller.isMovingLeft = true);
        },
        handleAUp() {
            doOnActor(this).then(actor => actor.controller.isMovingLeft = false);
        },
        handleSDown() {
            doOnActor(this).then(actor => actor.controller.isMovingBackwards = true);
        },
        handleSUp() {
            doOnActor(this).then(actor => actor.controller.isMovingBackwards = false);
        },
        handleShiftDown() {
            doOnActor(this).then(actor => actor.controller.isSprinting = true);
        },
        handleShiftUp() {
            doOnActor(this).then(actor => actor.controller.isSprinting = false);
        },

        handleActionFireStart() {
            doOnActor(this).then(actor => actor.controller.isFiring = true);
        },
        handleActionFireStop() {
            doOnActor(this).then(actor => actor.controller.isFiring = false);
        },
        handleActionReload() {
            doOnActor(this).then(actor => actor.controller.isReloading = true);
        }
    },
};

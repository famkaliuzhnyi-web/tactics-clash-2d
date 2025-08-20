import ClientCell from './client-cell';
import ClientActor from './client-actor';
import ClientProjectile from './client-projectile';

export default {
    name       : 'clientgamefield',
    components : {
        clientcell  : ClientCell,
        clientactor : ClientActor,
        clientprojectile : ClientProjectile,
    },
    props      : ['controller'],
    data() {
        return {
            isLeftEmmitted: false,
            isRightEmmitted: false,
        };
    },
    methods: {
        handleMouseMove(ev) {
            let rect = this.$el.getBoundingClientRect();
            this.$emit('pointerupdate', ev.clientX - Math.round(rect.left) - 16, ev.clientY - Math.round(rect.top) - 16);
        },
        handleMouseDown(ev) {
            if ( ev.button === 2 ) {
                if ( !this.isRightEmmitted ) {
                    this.$emit('pointerrightdown');
                    this.isRightEmmitted = true;
                }
            } else if (!this.isLeftEmmitted) {
                this.$emit('pointerleftdown');
                this.isLeftEmmitted = true;
            }
        },
        handleMouseUp(ev) {
            if ( ev.button === 2 ) {
                this.$emit('pointerrightup');
                this.isRightEmmitted = false;
            } else {
                this.$emit('pointerleftup');
                this.isLeftEmmitted = false;
            }
        }
    }
};

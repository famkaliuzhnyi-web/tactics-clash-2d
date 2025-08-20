import Cell from './cell';
import Actor from './actor';
import Projectile from './projectile';

export default {
    name       : 'gamefield',
    components : {
        cell  : Cell,
        actor : Actor,
        projectile : Projectile,
    },
    props      : ['levelRef'],
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

const STRS = {
    sp: '',
    p1 : 'translate(',
    p2 : 'px, ',
    p3 : 'px)',
    c1: 'rotate(',
    c2: 'rad)',
    c3: 'px'
};

export default {
    name     : 'clientprojectile',
    props    : ['projectile'],
    data() {
        return {};
    },
    computed : {
        parentCls() {
            return {
                transform : [STRS.p1, this.projectile.x, STRS.p2, this.projectile.y, STRS.p3].join(STRS.sp)
            };
        },
        childCls() {
            return {
                transform  : [STRS.c1, this.projectile.rotation, STRS.c2].join(STRS.sp),
                width      : this.projectile.length + STRS.c3,
                marginLeft : -this.projectile.length / 2 + STRS.c3
            };
        }
    }
};

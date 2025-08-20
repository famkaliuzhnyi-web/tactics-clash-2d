export default {
    name : 'clientcell',
    props: ['blockList', 'x', 'y'],
    data() {
        return {};
    },
    methods: {
        formatCls(block, level) {
            if (!block) {
                return '';
            }
            let clsMap = ['level level-',level,' texture-',block.texture];
            return clsMap.join('');
        },
        formatBgCls(block, level) {
            return ['bg bg-', level, ' cls-', block.texture].join('');
        },
        damageCls(block) {
            return ['destruction destruction-'+Math.round(10 * (block.health / block.maxHealth))].join('');
        }
    }
};

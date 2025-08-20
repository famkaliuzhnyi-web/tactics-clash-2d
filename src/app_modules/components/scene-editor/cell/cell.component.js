export default {
    name: 'cell',
    props: ['blockList'],
    data() {
        return {
        };
    },
    methods: {
        formatCls(block, level) {
            if (!block) {
                return '';
            }
            let clsMap = ['level level-',level,' texture-',block.model.texture];
            return clsMap.join('');
        },
        formatBgCls(block, level) {
            return ['bg bg-', level, ' cls-', block.model.texture].join('');
        },
        handleClick(ev) {
            this.$emit('clicked', ev);
        }
    }
};

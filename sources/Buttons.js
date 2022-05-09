export default {
    props: ['values', 'value'],
    model: {
        prop: 'value',
        event: 'input'
    },

    /*    render(h) {
        return h('select', {
            staticClass: ['btn-group'],
            domProps: {
                value: this.value
            },
            on: {
                change: this.handleChange
            },
            attrs: {
                id: ['allViews']
            },
            style: {
                'background': '#FFFFFF',
                'padding': '10px',
                'display': 'flex',
                'flex - direction': 'row',
                'float': 'right'
            }
        }, [
            this.values.map(r => {
                const text = r
                var str = text;
                str = str.replace(/\s+/g, '_').toLowerCase();
                str = str.replace('table_', '');
                str = str.replace('_chart', '');
                return h('option', {
                    attrs: {
                        value: r,
                        title: r
                    },
                    class: [
                        r === this.value ? 'btn active' : 'btn'
                    ]
                }, [h('img', {
                    attrs: {
                        src: 'https://sk1-dashboard-staging-11.dashboard.clevertap.com/images/svg/pivots/' + 'table' + '.svg'
                    },
                    class: ['tooltip pivots-btn']
                }, [h('span', { class: ['tooltiptext'] }, [text])])])
            })
        ])
    }*/

    created() {
        this.$emit('input', this.values[0])
    },
    methods: {
        handleChange(e) {
            this.$emit('input', e.currentTarget.value ? e.currentTarget.value : 'Table')
        }
    },
    render(h) {
        return h('div', {
            staticClass: ['btn-group'],
            domProps: {
                value: this.value
            },
            attrs: {
                id: ['allViews']
            },
            style: {
                'background': '#FFFFFF',
                'padding': '10px',
                'display': 'flex',
                'flex - direction': 'row',
                'float': 'right'
            }
        }, [
            this.values.map(r => {
                const text = r
                var str = text;
                str = str.replace(/\s+/g, '_').toLowerCase();
                str = str.replace('table_', '');
                str = str.replace('_chart', '');
                return h('button', {
                    attrs: {
                        value: r,
                        title: r,
                        'data-toggle': 'tooltip',
                        'data-placement': 'top',
                        'title': r
                    },
                    on: {
                        click: this.handleChange
                    },
                    class: [
                        r === this.value ? 'btn active' : 'btn'
                    ]
                }, [h('img', {
                    attrs: {
                        src: 'https://sk1-dashboard-staging-11.dashboard.clevertap.com/images/svg/pivots/' + 'table' + '.svg'
                    },
                    class: ['pivots-btn']
                })])
            })
        ])
    }
}
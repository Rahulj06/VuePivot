export default {
  props: ['values', 'value'],
  model: {
    prop: 'value',
    event: 'input'
  },
  created () {
    this.$emit('input', this.values[0])
  },
  methods: {
    handleChange (e) {
      this.$emit('input', e.currentTarget.value ? e.currentTarget.value : 'Table')
    }
  },
  render (h) {
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
        var str = text
        str = str.replace(/\s+/g, '_').toLowerCase()
        str = str.replace('_chart', '')
        str = str.replace('line', 'trend')
        str = str.replace('stacked_bar', 'stack')
        if (str === 'heatmap') {
          str = 'table_heatmap'
        }
        return h('button', {
          attrs: {
            value: r,
            title: r,
            'data-toggle': 'tooltip',
            'data-placement': 'top'
          },
          on: {
            click: this.handleChange
          },
          class: [
            r === this.value ? 'btn active' : 'btn'
          ]
        }, [h('img', {
          attrs: {
            src: 'https://sk1-dashboard-staging-11.dashboard.clevertap.com/images/svg/pivots/' + str + '.svg'
          },
          class: ['pivots-btn']
        })])
      })
    ])
  }
}

import { PivotData } from './helper/utils'
import defaultProps from './helper/common'

var huesBrown = []
huesBrown.push([47, 89, 133, 165, 193, 215, 223, 232, 242, 251, 253, 253, 253, 253, 253, 253, 252, 252, 251])
huesBrown.push([190, 196, 201, 207, 211, 214, 213, 214, 214, 213, 209, 203, 197, 191, 185, 179, 158, 134, 109])
huesBrown.push([103, 97, 91, 97, 104, 107, 105, 103, 101, 98, 98, 98, 98, 98, 98, 98, 98, 98, 98])

var huesGray = []
huesGray.push([250, 247, 244, 241, 238, 235, 232, 229, 226])
huesGray.push([250, 247, 244, 241, 238, 235, 232, 229, 226])
huesGray.push([250, 247, 244, 241, 238, 235, 232, 229, 226])

function hueColorScaleGenerator (values, hues) {
  var max, min
  min = Math.min.apply(Math, values)
  max = Math.max.apply(Math, values)
  return function (x) {
    if (x !== null) {
      var i = (1.0 * (x - min) / (max - min))

      var rr = hues[0]
      var gg = hues[1]
      var bb = hues[2]

      var ni = (rr.length - 1) * i
      var indexLower = parseInt(ni)
      var indexUpper = Math.min(indexLower + 1, rr.length - 1)

      var w2 = ni - indexLower
      var w1 = 1 - w2

      var r = parseInt(w1 * rr[indexLower] + w2 * rr[indexUpper])
      var g = parseInt(w1 * gg[indexLower] + w2 * gg[indexUpper])
      var b = parseInt(w1 * bb[indexLower] + w2 * bb[indexUpper])

      return { 'background-color': 'rgb(' + r + ',' + g + ',' + b + ')' }
    } else {
      return { 'background-color': 'rgb(' + 255 + ',' + 255 + ',' + 255 + ')' }
    }
  }
};

function makeRenderer (opts = {}) {
  const TableRenderer = {
    name: opts.name,
    mixins: [
      defaultProps
    ],
    props: {
      heatmapMode: String,
      tableColorScaleGenerator: {
        type: Function,
        default: hueColorScaleGenerator
      },
      tableOptions: {
        type: Object,
        default: function () {
          return {
            clickCallback: null
          }
        }
      },
      localeStrings: {
        type: Object,
        default: function () {
          return {
            totals: 'Totals'
          }
        }
      }
    },
    methods: {
      spanSize (arr, i, j) {
        // helper function for setting row/col-span in pivotTableRenderer
        let x
        if (i !== 0) {
          let asc, end
          let noDraw = true
          for (
            x = 0, end = j, asc = end >= 0; asc ? x <= end : x >= end; asc ? x++ : x--
          ) {
            if (arr[i - 1][x] !== arr[i][x]) {
              noDraw = false
            }
          }
          if (noDraw) {
            return -1
          }
        }
        let len = 0
        while (i + len < arr.length) {
          let asc1, end1
          let stop = false
          for (
            x = 0, end1 = j, asc1 = end1 >= 0; asc1 ? x <= end1 : x >= end1; asc1 ? x++ : x--
          ) {
            if (arr[i][x] !== arr[i + len][x]) {
              stop = true
            }
          }
          if (stop) {
            break
          }
          len++
        }
        return len
      }
    },
    render (h) {
      let pivotData = null
      try {
        const props = Object.assign({},
          this.$props,
          this.$attrs.props
        )
        pivotData = new PivotData(props)
      } catch (error) {
        // eslint-disable-next-line no-console
        if (console && console.error(error.stack)) {
          return this.computeError(h)
        }
      }
      const colAttrs = pivotData.props.cols
      const rowAttrs = pivotData.props.rows
      const rowKeys = pivotData.getRowKeys()
      const colKeys = pivotData.getColKeys()
      const grandTotalAggregator = pivotData.getAggregator([], [])
      // eslint-disable-next-line no-unused-vars
      let valueCellColors = () => {}
      // eslint-disable-next-line no-unused-vars
      let rowTotalColors = () => {}
      // eslint-disable-next-line no-unused-vars
      let colTotalColors = () => {}
      if (opts.heatmapMode) {
        const colorScaleGenerator = this.tableColorScaleGenerator
        const rowTotalValues = colKeys.map(x =>
          pivotData.getAggregator([], x).value()
        )
        rowTotalColors = colorScaleGenerator(rowTotalValues, huesGray)
        const colTotalValues = rowKeys.map(x =>
          pivotData.getAggregator(x, []).value()
        )
        colTotalColors = colorScaleGenerator(colTotalValues, huesGray)

        if (opts.heatmapMode === 'full') {
          const allValues = []
          rowKeys.map(r =>
            colKeys.map(c =>
              allValues.push(pivotData.getAggregator(r, c).value())
            )
          )
          const colorScale = colorScaleGenerator(allValues, huesBrown)
          valueCellColors = (r, c, v) => colorScale(v)
        } else if (opts.heatmapMode === 'row') {
          const rowColorScales = {}
          rowKeys.map(r => {
            const rowValues = colKeys.map(x =>
              pivotData.getAggregator(r, x).value()
            )
            rowColorScales[r] = colorScaleGenerator(rowValues, huesBrown)
          })
          valueCellColors = (r, c, v) => rowColorScales[r](v)
        } else if (opts.heatmapMode === 'col') {
          const colColorScales = {}
          colKeys.map(c => {
            const colValues = rowKeys.map(x =>
              pivotData.getAggregator(x, c).value()
            )
            colColorScales[c] = colorScaleGenerator(colValues, huesBrown)
          })
          valueCellColors = (r, c, v) => colColorScales[c](v)
        }
      }
      const getClickHandler = (value, rowValues, colValues) => {
        const tableOptions = this.tableOptions
        if (tableOptions && tableOptions.clickCallback) {
          const filters = {}
          let attr = {}
          for (let i in colAttrs) {
            if (!colValues.hasOwnProperty(i)) continue
            attr = colAttrs[i]
            if (colValues[i] !== null) {
              filters[attr] = colValues[i]
            }
          }
          for (let i in rowAttrs) {
            if (!rowValues.hasOwnProperty(i)) continue
            attr = rowAttrs[i]
            if (rowValues[i] !== null) {
              filters[attr] = rowValues[i]
            }
          }
          return e => tableOptions.clickCallback(e, value, filters, pivotData)
        }
      }
      return h('table', {
        staticClass: ['pvtTable']
      }, [
        h('thead', [
          colAttrs.map((c, j) => {
            return h('tr', {
              attrs: {
                key: `colAttrs${j}`
              }
            }, [
              j === 0 && rowAttrs.length !== 0 ? h('th', {
                attrs: {
                  colSpan: rowAttrs.length,
                  rowSpan: colAttrs.length
                }
              }) : undefined,

              h('th', {
                staticClass: ['pvtAxisLabel']
              }, c),

              colKeys.map((colKey, i) => {
                const x = this.spanSize(colKeys, i, j)
                if (x === -1) {
                  return null
                }
                return h('th', {
                  staticClass: ['pvtColLabel'],
                  attrs: {
                    key: `colKey${i}`,
                    colSpan: x,
                    rowSpan: j === colAttrs.length - 1 && rowAttrs.length !== 0 ? 2 : 1
                  }
                }, colKey[j])
              }),
              j === 0 && this.rowTotal ? h('th', {
                staticClass: ['pvtTotalLabel'],
                attrs: {
                  rowSpan: colAttrs.length + (rowAttrs.length === 0 ? 0 : 1)
                }
              }, this.localeStrings.totals) : undefined
            ])
          }),

          rowAttrs.length !== 0 ? h('tr', [
            rowAttrs.map((r, i) => {
              return h('th', {
                staticClass: ['pvtAxisLabel'],
                attrs: {
                  key: `rowAttr${i}`
                }
              }, r)
            }),

            this.rowTotal
              ? h('th', { staticClass: ['pvtTotalLabel'] }, colAttrs.length === 0 ? this.localeStrings.totals : null)
              : (colAttrs.length === 0 ? undefined : h('th', { staticClass: ['pvtTotalLabel'] }, null))
          ]) : undefined

        ]),

        h('tbody', [
          rowKeys.map((rowKey, i) => {
            const totalAggregator = pivotData.getAggregator(rowKey, [])
            return h('tr', {
              attrs: {
                key: `rowKeyRow${i}`
              }
            }, [
              rowKey.map((text, j) => {
                const x = this.spanSize(rowKeys, i, j)
                if (x === -1) {
                  return null
                }
                return h('th', {
                  staticClass: ['pvtRowLabel'],
                  attrs: {
                    key: `rowKeyLabel${i}-${j}`,
                    rowSpan: x,
                    colSpan: j === rowAttrs.length - 1 && colAttrs.length !== 0 ? 2 : 1
                  }
                }, text)
              }),

              colKeys.map((colKey, j) => {
                const aggregator = pivotData.getAggregator(rowKey, colKey)
                return h('td', {
                  staticClass: ['pvVal'],
                  style: valueCellColors(rowKey, colKey, aggregator.value()),
                  attrs: {
                    key: `pvtVal${i}-${j}`
                  },
                  on: this.tableOptions.clickCallback ? {
                    click: getClickHandler(aggregator.value(), rowKey, colKey)
                  } : {}
                }, aggregator.format(aggregator.value()))
              }),

              this.rowTotal ? h('td', {
                staticClass: ['pvtTotal'],
                style: colTotalColors(totalAggregator.value()),
                on: this.tableOptions.clickCallback ? {
                  click: getClickHandler(totalAggregator.value(), rowKey, [])
                } : {}
              }, totalAggregator.format(totalAggregator.value())) : undefined
            ])
          }),

          h('tr', [
            this.colTotal ? h('th', {
              staticClass: ['pvtTotalLabel'],
              attrs: {
                colSpan: rowAttrs.length + (colAttrs.length === 0 ? 0 : 1)
              }
            }, this.localeStrings.totals) : undefined,

            this.colTotal ? colKeys.map((colKey, i) => {
              const totalAggregator = pivotData.getAggregator([], colKey)
              return h('td', {
                staticClass: ['pvtTotal'],
                style: rowTotalColors(totalAggregator.value()),
                attrs: {
                  key: `total${i}`
                },
                on: this.tableOptions.clickCallback ? {
                  click: getClickHandler(totalAggregator.value(), [], colKey)
                } : {}
              }, totalAggregator.format(totalAggregator.value()))
            }) : undefined,

            this.colTotal && this.rowTotal ? h('td', {
              staticClass: ['pvtGrandTotal'],
              on: this.tableOptions.clickCallback ? {
                click: getClickHandler(grandTotalAggregator.value(), [], [])
              } : {}
            }, grandTotalAggregator.format(grandTotalAggregator.value())) : undefined
          ])
        ])

      ])
    },
    renderError (h, error) {
      return this.renderError(h)
    }
  }
  return TableRenderer
}

export default {
  Table: makeRenderer({ name: 'vue-table' }),
  'Heatmap': makeRenderer({ heatmapMode: 'full', name: 'vue-table-heatmap' }),
  'Row Heatmap': makeRenderer({ heatmapMode: 'row', name: 'vue-table-col-heatmap' }),
  'Col Heatmap': makeRenderer({ heatmapMode: 'col', name: 'vue-table-col-heatmap' })
}

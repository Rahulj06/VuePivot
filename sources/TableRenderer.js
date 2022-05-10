import { PivotData } from './helper/utils'
import defaultProps from './helper/common'

var hues_brown = [];
hues_brown.push([47, 89, 133, 165, 193, 215, 223, 232, 242, 251, 253, 253, 253, 253, 253, 253, 252, 252, 251]);
hues_brown.push([190, 196, 201, 207, 211, 214, 213, 214, 214, 213, 209, 203, 197, 191, 185, 179, 158, 134, 109]);
hues_brown.push([103, 97, 91, 97, 104, 107, 105, 103, 101, 98, 98, 98, 98, 98, 98, 98, 98, 98, 98]);

var hues_gray = [];
hues_gray.push([250, 247, 244, 241, 238, 235, 232, 229, 226]);
hues_gray.push([250, 247, 244, 241, 238, 235, 232, 229, 226]);
hues_gray.push([250, 247, 244, 241, 238, 235, 232, 229, 226]);

var hues_blue = [];
hues_blue.push([247, 222, 198, 158, 107, 66, 33]);
hues_blue.push([251, 235, 219, 202, 174, 146, 113]);
hues_blue.push([255, 247, 239, 225, 214, 198, 181]);

var hues_green = [];
hues_green.push([247, 229, 199, 161, 116, 65, 35]);
hues_green.push([252, 245, 233, 217, 196, 171, 139]);
hues_green.push([245, 224, 192, 155, 118, 93, 69]);

function hueColorScaleGenerator(values, hues) {
    var max, min;
    min = Math.min.apply(Math, values);
    max = Math.max.apply(Math, values);
    return function(x) {
        var i = (1.0 * (x - min) / (max - min));

        var rr = hues[0];
        var gg = hues[1];
        var bb = hues[2];

        var ni = (rr.length - 1) * i;
        var indexLower = parseInt(ni);
        var indexUpper = Math.min(indexLower + 1, rr.length - 1);

        var w2 = ni - indexLower;
        var w1 = 1 - w2;

        var r = parseInt(w1 * rr[indexLower] + w2 * rr[indexUpper]);
        var g = parseInt(w1 * gg[indexLower] + w2 * gg[indexUpper]);
        var b = parseInt(w1 * bb[indexLower] + w2 * bb[indexUpper]);


        return { 'background-color': 'rgb(' + r + ',' + g + ',' + b + ')' };
    };
};

function makeRenderer(opts = {}) {
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
                default: function() {
                    return {
                        clickCallback: null
                    }
                }
            },
            localeStrings: {
                type: Object,
                default: function() {
                    return {
                        totals: 'Totals'
                    }
                }
            }
        },
        methods: {
            spanSize(arr, i, j) {
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
        render(h) {
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
                rowTotalColors = colorScaleGenerator(rowTotalValues, hues_gray)
                const colTotalValues = rowKeys.map(x =>
                    pivotData.getAggregator(x, []).value()
                )
                colTotalColors = colorScaleGenerator(colTotalValues, hues_gray)

                if (opts.heatmapMode === 'full') {
                    const allValues = []
                    rowKeys.map(r =>
                        colKeys.map(c =>
                            allValues.push(pivotData.getAggregator(r, c).value())
                        )
                    )
                    const colorScale = colorScaleGenerator(allValues, hues_brown)
                    valueCellColors = (r, c, v) => colorScale(v)
                } else if (opts.heatmapMode === 'row') {
                    const rowColorScales = {}
                    rowKeys.map(r => {
                        const rowValues = colKeys.map(x =>
                            pivotData.getAggregator(r, x).value()
                        )
                        rowColorScales[r] = colorScaleGenerator(rowValues, hues_brown)
                    })
                    valueCellColors = (r, c, v) => rowColorScales[r](v)
                } else if (opts.heatmapMode === 'col') {
                    const colColorScales = {}
                    colKeys.map(c => {
                        const colValues = rowKeys.map(x =>
                            pivotData.getAggregator(x, c).value()
                        )
                        colColorScales[c] = colorScaleGenerator(colValues, hues_brown)
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

                        this.rowTotal ?
                        h('th', { staticClass: ['pvtTotalLabel'] }, colAttrs.length === 0 ? this.localeStrings.totals : null) :
                        (colAttrs.length === 0 ? undefined : h('th', { staticClass: ['pvtTotalLabel'] }, null))
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
        renderError(h, error) {
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
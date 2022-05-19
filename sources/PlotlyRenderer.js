import { PivotData } from './helper/utils'
import defaultProps from './helper/common'
import { Plotly } from 'vue-plotly'

function makeRenderer(opts = {}, traceOptions = {}, layoutOptions = {}, transpose = false) {
    var rotateAngle = 0
    const plotlyRenderer = {
        name: opts.name,
        mixins: [defaultProps],
        props: {
            plotlyOptions: {
                type: Object,
                default: function() {
                    return {}
                }
            }
        },
        render(h) {
            const pivotData = new PivotData(this.$props)
            const rowKeys = pivotData.getRowKeys()
            const colKeys = pivotData.getColKeys()
            const traceKeys = transpose ? colKeys : rowKeys
            if (traceKeys.length === 0) traceKeys.push([])
            const datumKeys = transpose ? rowKeys : colKeys
            if (datumKeys.length === 0) datumKeys.push([])

            let fullAggName = this.$props.aggregatorName
            const numInputs = this.$props.aggregators[fullAggName]([])().numInputs || 0
            if (numInputs !== 0) {
                fullAggName += ` of ${this.$props.vals.slice(0, numInputs).join(', ')}`
            }
            const data = traceKeys.map(traceKey => {
                const values = []
                const labels = []
                for (const datumKey of datumKeys) {
                    const val = parseFloat(
                        pivotData.getAggregator(
                            transpose ? datumKey : traceKey,
                            transpose ? traceKey : datumKey
                        ).value()
                    )
                    values.push(isFinite(val) ? val : null)
                    labels.push(datumKey.join('-') || ' ')
                }
                const trace = { name: traceKey.join('-') || fullAggName }
                if (traceOptions.type === 'pie') {
                    trace.values = values
                    trace.labels = labels.length > 1 ? labels : [fullAggName]
                } else {
                    trace.x = transpose ? values : labels
                    trace.y = transpose ? labels : values
                    for (var i = 0; i < (trace.x).length; i++) {
                        if ((trace.x[i]).length > 25 || (trace.x).length > 10)
                            rotateAngle = -45
                    }
                    trace.marker = {
                        color: Array((trace.x).length).fill(['#2f7ed8', '#0d233a', '#8bbc21', '#910000', '#1aadce',
                            '#492970', '#f28f43', '#77a1e5', '#c42525', '#a6c96a'
                        ]).flat().splice(0, (trace.x).length)
                    }
                }
                return Object.assign(trace, traceOptions)
            })


            let titleText = fullAggName
            const hAxisTitle = transpose ? this.$props.rows.join('-') : this.$props.cols.join('-')
            const groupByTitle = transpose ? this.$props.cols.join('-') : this.$props.rows.join('-')
            if (hAxisTitle !== '') titleText += ` vs ${hAxisTitle}`
            if (groupByTitle !== '') titleText += ` by ${groupByTitle}`

            const layout = {
                title: hAxisTitle,
                showlegend: true,
                legend: {
                    font: {
                        family: 'proxima-nova, Arial, sans-serif',
                        size: 12,
                        weight: 'bold'
                    },
                    color: '#333333',
                    cursor: 'pointer',
                    fill: '#333333',
                },

                hovermode: 'closest'
            }

            if (traceOptions.type === 'pie') {
                const columns = Math.ceil(Math.sqrt(data.length))
                const rows = Math.ceil(data.length / columns)
                layout.grid = { columns, rows }
                data.forEach((d, i) => {
                    d.domain = {
                        row: Math.floor(i / columns),
                        column: i - columns * Math.floor(i / columns)
                    }
                    if (data.length > 1) {
                        d.title = d.name
                    }
                })
                if (data[0].labels.length === 1) {
                    layout.showlegend = false
                }
            } else {
                layout.xaxis = {
                    tickangle: rotateAngle,
                    title: {
                        font: {
                            family: 'proxima-nova, Arial, sans-serif;',
                            size: 12,
                            color: '#666666',
                            fill: '#666666'
                        }
                    },
                    automargin: true,
                    tickfont: {
                        size: 12,
                        color: '#666666'
                    }
                }
                layout.yaxis = {
                    automargin: true,
                    tickfont: {
                        size: 12,
                        color: '#666666'
                    },
                    zeroline: false
                }
            }

            return h(Plotly, {
                props: {
                    data,
                    layout: Object.assign({},
                        layout,
                        layoutOptions,
                        this.$props.plotlyOptions
                    )
                }
            })
        }
    }
    return plotlyRenderer
}

export default {
    'Stacked Bar Chart': makeRenderer({ name: 'vue-stacked-column-chart' }, { type: 'bar' }, { barmode: 'relative' }),
    'Bar Chart': makeRenderer({ name: 'vue-grouped-column-chart' }, { type: 'bar' }, { barmode: 'group' }),
    'Line Chart': makeRenderer({ name: 'vue-line-chart' }),
    'Area Chart': makeRenderer({ name: 'vue-area-chart' }, { stackgroup: 1 }),
}
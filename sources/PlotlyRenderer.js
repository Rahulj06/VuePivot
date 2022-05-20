import { PivotData } from './helper/utils'
import defaultProps from './helper/common'
import { Chart } from 'highcharts-vue'

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
                    trace.data = transpose ? labels : values
                    for (var i = 0; i < (trace.x).length; i++) {
                        if ((trace.x[i]).length > 25 || (trace.x).length > 10)
                            rotateAngle = -45
                    }
                    /*trace.marker = {
                        color: Array((trace.x).length).fill(['rgb(81,108,245)', 'rgb(244,186,89)', '#ffc933', '#ef6f35', '#b7e803', '#3ad8ed', '#e37cf1', '#a64cfc', '#5656f4', '#a1b6cb']).flat().splice(0, (trace.x).length)
                    }*/
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
            const options = {
                exporting: {
                    buttons: {
                        enabled: true,
                        contextButton: {
                            symbolFill: '#434761',
                            symbolStroke: '#434761',
                            menuItems: [{
                                    text: 'Print chart',
                                    onclick: function() {
                                        this.print();
                                    }
                                },
                                {
                                    text: 'Download PNG Image',
                                    onclick: function() {
                                        this.exportChartLocal({ type: 'image/png', filename: 'PivotTable' });
                                    }
                                },
                                {
                                    text: 'Download JPEG Image',
                                    onclick: function() {
                                        this.exportChartLocal({ type: 'image/jpeg', filename: 'PivotTable' });
                                    }
                                },
                                {
                                    text: 'Download PDF Document',
                                    onclick: function() {
                                        this.exportChartLocal({ type: 'application/pdf', filename: 'PivotTable' });
                                    }
                                },
                                {
                                    text: 'Download SVG Image',
                                    onclick: function() {
                                        this.exportChartLocal({ type: 'image/svg+xml', filename: 'PivotTable' });
                                    }
                                }
                            ]
                        }
                    }
                },
                credits: {
                    enabled: false
                },
                tooltip: {
                    backgroundColor: "#1d2f41",
                    style: { color: "#ffffff" },
                    borderWidth: 1,
                    borderColor: '#1d2f41',
                    useHTML: true,
                    shared: true,
                    shadow: false
                },
                title: {
                    text: ''
                },
                legend: {
                    align: 'center',
                    verticalAlign: 'bottom',
                    enabled: true,
                    itemMarginTop: 8
                },
                xAxis: {
                    title: {
                        text: hAxisTitle,
                        style: {
                            font: {
                                family: 'proxima-nova, Arial, sans-serif;',
                                size: 12,
                                color: '#666666',
                                fill: '#666666'
                            }
                        }
                    },
                    categories: data[0].x,
                    tickWidth: 1
                },
                yAxis: {
                    title: '',
                    plotLines: [{
                        value: 0,
                        width: 1,
                        color: '#808080'
                    }]
                },
                series: data
            }
            options.exporting = {
                enabled: true
            }

            if (traceOptions.type === 'area') {
                options.plotOptions = {
                    area: {
                        stacking: 'normal',
                        marker: {
                            symbol: 'circle'
                        }
                    }
                }
            }

            if (layoutOptions.stacked) {
                options.plotOptions = {
                    column: {
                        stacking: 'normal',
                        borderWidth: 0
                    }
                }
            }

            if (traceOptions.type === 'line') {
                options.plotOptions = {
                    series: {
                        borderWidth: 0,
                        marker: {
                            symbol: 'circle'
                        }
                    }
                }
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

            return h(Chart, {
                props: {
                    options
                }
            })
        }
    }
    return plotlyRenderer
}

export default {
    'Stacked Bar Chart': makeRenderer({ name: 'vue-stacked-column-chart' }, { type: 'column' }, { stacked: true }),
    'Bar Chart': makeRenderer({ name: 'vue-grouped-column-chart' }, { type: 'column' }, { barmode: 'group' }),
    'Line Chart': makeRenderer({ name: 'vue-line-chart' }, { type: 'line' }),
    'Area Chart': makeRenderer({ name: 'vue-area-chart' }, { type: 'area', stacked: true })
}
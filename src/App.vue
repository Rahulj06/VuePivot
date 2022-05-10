<template>
  <div id="pivot-table">
        <vue-pivottable-ui
          v-model="config"
          :data="pivotData"
          :locale="locale"
          :locales="locales"
          :rendererName="rendererName"
          :aggregatorName="aggregatorName"
          :tableColorScaleGenerator="colorScaleGenerator"
          :attributes="attributes"
          :valueFilter="valueFilter"
          :rows="rows"
          :cols="cols"
          :vals="vals"
          :async="false"
          :disabledFromDragDrop="disabledFromDragDrop"
          :sortonlyFromDragDrop="sortonlyFromDragDrop"
          :hiddenFromDragDrop="hiddenFromDragDrop"
          :sorters="sorters"
          rowOrder="value_a_to_z"
          :tableOptions="tableOptions"
          @no:filterbox="noFilterbox"
        >
          <!-- Slot ColGroup -->
          <template v-slot:colGroup>
            <colgroup >
                <col :width="300">
                <col>
            </colgroup>
          </template>
          <!-- Slot Output -->
          <!-- <template v-slot:output>
            <div v-if="loading">
              loading...
            </div>
          </template> -->
          <div v-if="loading" slot="output">
            loading...
          </div>

          <!-- Scoped Slot PvtAttr -->
          <template v-slot:pvtAttr="{ name }">
            {{ name }}
          </template>

          <!-- Scoped Slot Output -->
          <!-- <template v-if="!loading" v-slot:output="{ pivotData }">
            <div v-if="!viewTable">
              <button @click="viewTable = !viewTable">
                View Table
              </button>
              <button @click="otherAction(pivotData)">
                Other action
              </button>
            </div>
            <template v-else>
              <table-renderer
                v-if="pivotData.props.rendererName === 'Table'"
                :data="pivotData.props.data"
                :props="pivotData.props"
              >
              </table-renderer>
              <heatmap-renderer
                v-if="pivotData.props.rendererName === 'Table Heatmap'"
                :data="pivotData.props.data"
                :props="pivotData.props"
              >
              </heatmap-renderer>
            </template>
          </template> -->

        </vue-pivottable-ui>
        <!-- <vue-pivottable
          :data="data"
          :rendererName="rendererName"
          :aggregatorName="aggregatorName"
          :rows="rows"
          :cols="cols"
          :vals="vals"
          :sorters="sorters"
          :locales="locales"
          :locale="locale"
        >
        </vue-pivottable> -->
      </div>
</template>

<script>

import tips from './tips'
// import tips2 from './tips2'
import { VuePivottableUi, PivotUtilities, Renderer } from '../sources'
import '../sources/assets/vue-pivottable.css'
// const HeatmapRenderer = Renderer.TableRenderer['Table Heatmap']
// const TableRenderer = Renderer.TableRenderer['Table']

export default {
  components: {
    VuePivottableUi
    // TableRenderer,
    // HeatmapRenderer
    // VuePivottable
  },
  name: 'pivot-table',
  data () {
    return {
      viewTable: false,
      // fix issue #27
      valueFilter: {
        Meal: {
          Dinner: true
        }
      },
      config: {},
      filteredData: [],
      pivotData: tips,
      asyncFields: ['Unused 1'],
      attributes: ['Unused 1', 'Meal', 'Payer Smoker', 'Day of Week', 'Payer Gender', 'Party Size'],
      rows: ['Payer Gender', 'Party Size'],
      cols: ['Meal', 'Payer Smoker', 'Day of Week'],
      vals: ['Total Bill'],
      disabledFromDragDrop: [], // ['Payer Gender'],
      hiddenFromDragDrop: ['Total Bill'],
      sortonlyFromDragDrop: [], // ['Party Size'],
      pivotColumns: ['Meal', 'Payer Smoker', 'Day of Week', 'Payer Gender', 'Party Size'],
      loading: false,
      aggregatorName: 'Count',
      rendererName: 'Table',
      locale: 'en'
    }
  },
  created () {
    this.data = tips
  },
  computed: {
    tableOptions () {
      return {
        clickCallback: function (e, value, filters, pivotData) {
          const values = []
          pivotData.forEachMatchingRecord(filters,
            function (record) {
              values.push(Object.values(record))
            }
          )
          alert(values.join('\n'))
        }
      }
    },
    sorters () {
      return {
        'Day of Week': PivotUtilities.sortAs(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])
      }
    },
    locales () {
      return {
        en: {
          aggregators: this.aggregators,
          localeStrings: {
            renderError: 'An error occurred rendering the PivotTable results.',
            computeError: 'An error occurred computing the PivotTable results.',
            uiRenderError: 'An error occurred rendering the PivotTable UI.',
            selectAll: 'Select All',
            selectNone: 'Select None',
            tooMany: '(too many to list)',
            filterResults: 'Filter values',
            totals: 'Totals',
            only: 'Only',
            vs: 'vs',
            by: 'by'
          }
        },
        ko: {
          aggregators: this.aggregators,
          localeStrings: {
            renderError: '피벗 테이블 결과를 렌더링하는 동안 오류가 발생 했습니다.',
            computeError: '피벗 테이블 결과를 계산하는 동안 오류가 발생 했습니다.',
            uiRenderError: '피벗 테이블 UI를 렌더링하는 동안 오류가 발생 했습니다.',
            selectAll: '모두 선택',
            selectNone: '선택 안함',
            tooMany: '표시 할 값이 너무 많습니다.',
            filterResults: '값 필터링',
            totals: '합계',
            only: '단독',
            vs: 'vs',
            by: 'by'
          }
        }
      }
    },
    aggregators () {
      const usFmtInt = PivotUtilities.numberFormat({ digitsAfterDecimal: 0 })
      const usFmtPct = PivotUtilities.numberFormat({
        digitsAfterDecimal: 1,
        scaler: 100,
        suffix: '%'
      })

      return ((tpl) => ({
        'Count': tpl.count(usFmtInt),
        'Count as Fraction of Total': tpl.fractionOf(tpl.count(), 'total', usFmtPct),
        'Count as Fraction of Rows': tpl.fractionOf(tpl.count(), 'row', usFmtPct),
        'Count as Fraction of Columns': tpl.fractionOf(tpl.count(), 'col', usFmtPct)
      })
      )(PivotUtilities.aggregatorTemplates)
    },
    renderers () {
      const TableRenderer = Renderer.TableRenderer
      const PlotlyRenderer = Renderer.PlotlyRenderer
      return (() => ({
        'Table': TableRenderer.Table,
        'Heatmap': TableRenderer['Table Heatmap'],
        'Row Heatmap': TableRenderer['Table Row Heatmap'],
        'Col Heatmap': TableRenderer['Table Col Heatmap'],
        'Stacked Bar Chart': PlotlyRenderer['Stacked Column Chart'],
        'Bar Chart': PlotlyRenderer['Grouped Column Chart'],
        'Line Chart': PlotlyRenderer['Line Chart'],
        'Area Chart': PlotlyRenderer['Area Chart']
      })
      )()
    }
  },
  methods: {
    colorScaleGenerator (values, hues) {
      var max, min
      min = Math.min.apply(Math, values)
      max = Math.max.apply(Math, values)
      return function (x) {
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
      }
    },
    noFilterbox () {
      alert('no data')
    },
    otherAction (pivotData) {
      alert(`All Total Count: ${pivotData.allTotal.count}`)
    }
  },
  watch: {
    config: {
      handler (value, oldValue) {
        delete value.data
      },
      deep: true,
      immediate: false
    }
  }
}
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Merienda&display=swap');
html {
    margin: 0;
    padding: 0;
    border: 0;
    outline: 0;
    font-size: 100%;
    vertical-align: baseline;
    background: transparent;
}
body {
    font-family: proxima-nova, Arial, sans-serif !important;
    font-size: 15px;
    line-height: 20px;
    color: #434761;
}
</style>

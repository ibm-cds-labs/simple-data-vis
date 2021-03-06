/* global SimpleDataVis */

/**
 *  - Bar Chart visualization for the SimpleDataVis JavaScript module
 */
;(function (win) {
  var BarChartVis = function (datavis) {
    var d3 = typeof module !== 'undefined' && module.exports ? require('d3') : win.d3

    datavis.register({
      type: 'bar-chart',

      canRender: function (barchartdata) {
        var data = barchartdata ? (barchartdata.data || barchartdata) : []
        // an array of objects with key/value
        return Object.prototype.toString.call(data) === '[object Array]' &&
          data.length &&
          data.length > 0 &&
          data[0].hasOwnProperty('key') &&
          !isNaN(parseInt(data[0].value, 10))
      },

      render: function (selection, barchartdata, options, callbacks) {
        if (d3.version.split('.')[0] === '3') {
          this.renderV3(selection, barchartdata, options, callbacks)
        } else {
          this.renderV4(selection, barchartdata, options, callbacks)
        }
      },

      renderV3: function (selection, barchartdata, options, callbacks) {
        // initTooltip()
        var xScale = d3.scale.linear()
        var yScale = d3.scale.linear()

        var data = barchartdata ? (barchartdata.data || barchartdata) : []

        var box = selection.node().getBoundingClientRect()
        var width = (box.width || 1024)
        var h = (box.height || 600)
        var margin = { left: 100, right: 75 }

        var height = Math.min(h, data.length * 50)

        var cdom = data.map(function (d) { return d.key })
        cdom.sort(function (a, b) { return a > b })
        var color = d3.scale.category10().domain(cdom)

        // set the ranges
        xScale.range([margin.left, width - margin.left - margin.right])
        yScale.range([0, height])

        // scale the data
        xScale.domain([0, d3.max(data, function (d) { return d.value })])
        yScale.domain([0, data.length])

        // setup the svg element
        var svg = selection.selectAll('svg').data([data])
        svg.enter().append('svg')
          .attr('xmlns', 'http://www.w3.org/2000/svg')
          .style('font-family', 'HelvNeue,Helvetica,sans-serif')
          .style('font-size', '0.8rem')
          .style('font-weight', '300')
        svg.attr('width', width)
          .attr('height', height)

        var bars = svg.selectAll('rect.bar').data(data)

        // add new bars
        bars.enter().append('rect')
          .attr('class', 'bar')
          .attr('opacity', 0)

        // update bars
        var barstransition = typeof module === 'undefined' || !module.exports ? bars.transition() : bars

        barstransition
          .attr('x', xScale(0))
          .attr('y', function (d, i) { return yScale(i + 0.1) })
          .attr('height', function (d, i) {
            return yScale(i + 0.9) - yScale(i + 0.1)
          })
          .attr('width', function (d) { return xScale(d.value) })
          .attr('opacity', 1)
          .style('fill', function (d, i) { return color(d.key) })

        if (typeof module === 'undefined' || !module.exports) {
          bars
            .on('mouseover', function (d, i) {
              SimpleDataVis.tooltip.mouseover(d, i, options)
            })
            .on('mousemove', SimpleDataVis.tooltip.mousemove)
            .on('mouseout', SimpleDataVis.tooltip.mouseout)
        }

        if (options.click) {
          bars
            .style('cursor', 'pointer')
            .on('click', function (d, i) {
              d3.event.stopPropagation()
              options.click(d, i)
            })
        }

        // remove old bars
        bars.exit().transition()
          .attr('opacity', 0)
          .attr('width', 0)
          .remove()

        // key labels
        var keyLabels = svg.selectAll('text.barkey').data(data)

        // add new key labels
        keyLabels.enter().append('text')
          .attr('class', 'barkey')
          .attr('opacity', 0)
          .attr('dx', '-0.3em')
          .attr('dy', '0.35em')
          .attr('text-anchor', 'end')

        if (typeof module === 'undefined' || !module.exports) {
          keyLabels
            .on('mouseover', function (d, i) {
              SimpleDataVis.tooltip.mouseover(d, i, options)
            })
            .on('mousemove', SimpleDataVis.tooltip.mousemove)
            .on('mouseout', SimpleDataVis.tooltip.mouseout)
        }

        // update key labels
        var keylabelstransition = typeof module === 'undefined' || !module.exports ? keyLabels.transition() : keyLabels
        keylabelstransition
          .attr('x', xScale(0))
          .attr('y', function (d, i) { return yScale(i + 0.5) })
          .attr('opacity', 1)
          .text(function (d) {
            var l = margin.left / 10
            if (d.key.length > l) {
              return d.key.substring(0, l) + '...'
            } else {
              return d.key
            }
          })

        // remove old key labels
        keyLabels.exit().transition()
          .attr('opacity', 0)
          .attr('x', 0)
          .remove()

        // value labels
        var valueLabels = svg.selectAll('text.barvalue').data(data)

        // add new value labels
        valueLabels.enter().append('text')
          .attr('class', 'barvalue')
          .attr('opacity', 0)
          .attr('dx', '0.3em')
          .attr('dy', '0.35em')

        // update value labels
        var valuelabelstransition = typeof module === 'undefined' || !module.exports ? valueLabels.transition() : valueLabels
        valuelabelstransition
          .attr('x', function (d) { return xScale(d.value) + margin.left })
          .attr('y', function (d, i) { return yScale(i + 0.5) })
          .attr('opacity', 1)
          .text(function (d) { return '(' + d.value + ')' })

        // remove old value labels
        valueLabels.exit().transition()
          .attr('opacity', 0)
          .attr('x', 0)
          .remove()
      },

      renderV4: function (selection, barchartdata, options, callbacks) {
        var xScale = d3.scaleLinear()
        var yScale = d3.scaleLinear()

        var data = barchartdata ? (barchartdata.data || barchartdata) : []

        var box = selection.node().getBoundingClientRect()
        var width = (box.width || 1024)
        var h = (box.height || 600)
        var margin = { left: 100, right: 75 }

        var height = Math.min(h, data.length * 50)

        var cdom = data.map(function (d) { return d.key })
        cdom.sort(function (a, b) { return a > b })
        var color = d3.scaleOrdinal(d3.schemeCategory10).domain(cdom)

        // set the ranges
        xScale.range([margin.left, width - margin.left - margin.right])
        yScale.range([0, height])

        // scale the data
        xScale.domain([0, d3.max(data, function (d) { return d.value })])
        yScale.domain([0, data.length])

        // setup the svg element
        var svg = selection.selectAll('svg').data([data])
        svg = svg.enter().append('svg')
          .attr('xmlns', 'http://www.w3.org/2000/svg')
          .style('font-family', 'HelvNeue,Helvetica,sans-serif')
          .style('font-size', '0.8rem')
          .style('font-weight', '300')
          .merge(svg)
        svg.attr('width', width)
          .attr('height', height)

        var bars = svg.selectAll('rect.bar').data(data)

        // add new bars
        bars = bars.enter().append('rect')
          .attr('class', 'bar')
          .attr('opacity', 0)
          .merge(bars)

        // update bars
        var barstransition = typeof module === 'undefined' || !module.exports ? bars.transition() : bars

        barstransition
          .attr('x', xScale(0))
          .attr('y', function (d, i) { return yScale(i + 0.1) })
          .attr('height', function (d, i) {
            return yScale(i + 0.9) - yScale(i + 0.1)
          })
          .attr('width', function (d) { return xScale(d.value) })
          .attr('opacity', 1)
          .style('fill', function (d, i) { return color(d.key) })

        if (typeof module === 'undefined' || !module.exports) {
          bars
            .on('mouseover', function (d, i) {
              SimpleDataVis.tooltip.mouseover(d, i, options)
            })
            .on('mousemove', SimpleDataVis.tooltip.mousemove)
            .on('mouseout', SimpleDataVis.tooltip.mouseout)
        }

        if (options.click) {
          bars
            .style('cursor', 'pointer')
            .on('click', function (d, i) {
              d3.event.stopPropagation()
              options.click(d, i)
            })
        }

        // remove old bars
        bars.exit().transition()
          .attr('opacity', 0)
          .attr('width', 0)
          .remove()

        // key labels
        var keyLabels = svg.selectAll('text.barkey').data(data)

        // add new key labels
        keyLabels = keyLabels.enter().append('text')
          .attr('class', 'barkey')
          .merge(keyLabels)
          .attr('opacity', 0)
          .attr('dx', '-0.3em')
          .attr('dy', '0.35em')
          .attr('text-anchor', 'end')

        if (typeof module === 'undefined' || !module.exports) {
          keyLabels
            .on('mouseover', function (d, i) {
              SimpleDataVis.tooltip.mouseover(d, i, options)
            })
            .on('mousemove', SimpleDataVis.tooltip.mousemove)
            .on('mouseout', SimpleDataVis.tooltip.mouseout)
        }

        // update key labels
        var keylabelstransition = typeof module === 'undefined' || !module.exports ? keyLabels.transition() : keyLabels
        keylabelstransition
          .attr('x', xScale(0))
          .attr('y', function (d, i) { return yScale(i + 0.5) })
          .attr('opacity', 1)
          .text(function (d) {
            var l = margin.left / 10
            if (d.key.length > l) {
              return d.key.substring(0, l) + '...'
            } else {
              return d.key
            }
          })

        // remove old key labels
        keyLabels.exit().transition()
          .attr('opacity', 0)
          .attr('x', 0)
          .remove()

        // value labels
        var valueLabels = svg.selectAll('text.barvalue').data(data)

        // add new value labels
        valueLabels = valueLabels.enter().append('text')
          .attr('class', 'barvalue')
          .merge(valueLabels)
          .attr('opacity', 0)
          .attr('dx', '0.3em')
          .attr('dy', '0.35em')

        // update value labels
        var valuelabelstransition = typeof module === 'undefined' || !module.exports ? valueLabels.transition() : valueLabels
        valuelabelstransition
          .attr('x', function (d) { return xScale(d.value) + margin.left })
          .attr('y', function (d, i) { return yScale(i + 0.5) })
          .attr('opacity', 1)
          .text(function (d) { return '(' + d.value + ')' })

        // remove old value labels
        valueLabels.exit().transition()
          .attr('opacity', 0)
          .attr('x', 0)
          .remove()
      }
    })
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = BarChartVis
  } else {
    BarChartVis(SimpleDataVis)
  }
}(this))

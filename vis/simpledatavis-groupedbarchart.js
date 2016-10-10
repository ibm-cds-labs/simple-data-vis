/* global d3, SimpleDataVis */

/**
 *  - Grouped Bar Chart visualization for the SimpleDataVis JavaScript module
 */
(function (datavis) {
  datavis.register({
    type: 'grouped-bar-chart',

    canRender: function (groupedbarchartdata) {
      var data = groupedbarchartdata ? (groupedbarchartdata.data || groupedbarchartdata) : []
      // an array with key/value and value is an object
      return Object.prototype.toString.call(data) === '[object Array]' &&
      data.length &&
      data.length > 0 &&
      data[0].hasOwnProperty('key') &&
      data[0].value != null &&
      typeof data[0].value === 'object'
    },

    render: function (selection, groupedbarchartdata, options, callbacks) {
      var data = groupedbarchartdata ? (groupedbarchartdata.data || groupedbarchartdata) : []
      var opts = options || {}

      var groupKeys = []
      if (typeof data[0].value === 'object') {
        data.forEach(function (d) {
          for (var key in d.value) {
            if (groupKeys.indexOf(key) === -1) {
              groupKeys.push(key)
            }
          }
        })

        data.forEach(function (d) {
          var dd = d
          d.groups = groupKeys.map(function (entry) { return {key: entry, value: +d.value[entry], data: dd} })
        })
      } else {
        data.forEach(function (d) {
          for (var key in d) {
            if (key !== 'key' && groupKeys.indexOf(key) === -1) {
              groupKeys.push(key)
            }
          }
        })

        data.forEach(function (d) {
          var dd = d
          d.groups = groupKeys.map(function (entry) { return {key: entry, value: +d[entry], data: dd} })
        })
      }

      // separate data into multiple series to be charted
      var series = []
      var standoutGroups = []
      var standout = (typeof opts.standout === 'string') ? [opts.standout] : (opts.standout || [])
      var maxGroups = opts.maxgroups && !isNaN(parseInt(opts.maxgroups, 10)) ? Number(opts.maxgroups) : data.length
      if (maxGroups) {
        var row = []
        for (var i = 0; i < data.length; i++) {
          if (standout.indexOf(data[i].key) !== -1) {
            standoutGroups.push(data[i])
          } else {
            row.push(data[i])
            if (row.length === maxGroups) {
              series.push(row)
              row = []
            }
          }
        }
        if (row.length > 0) {
          series.push(row)
        }
      }
      if (standoutGroups.length > 0) {
        series.unshift(standoutGroups)
      }

      data = series

      var color = d3.scale.category10()
      var margin = {top: 20, right: 150, bottom: 120, left: 80}
      var box = selection.node().getBoundingClientRect()
      var width = (box.width || 600) - margin.left - margin.right
      var height = (box.height || 600) - margin.top - margin.bottom
      // var width = Math.max(400, box.width) - margin.left - margin.right
      // var height = (data.length > 1 ? 450 : 600) - margin.top - margin.bottom

      // setup the svg element
      var svg = selection.selectAll('svg').data([data])
      svg.enter().append('svg')
      svg.attr('width', width + margin.left + margin.right)
        .attr('height', (height + margin.top + margin.bottom) * data.length)
      svg.exit().remove()

      // setup series graph for each series
      var sGraph = svg.selectAll('g.series').data(data)
      sGraph.enter().append('g')
          .attr('class', 'series')
      sGraph.attr('transform', function (d, i) {
        return 'translate(' + margin.left + ',' + (margin.top + (height + margin.bottom) * i) + ')'
      })
      sGraph.exit().remove()

      sGraph.each(function (sData, index) {
        var graph = d3.select(this)

        var nb = sData.length * groupKeys.length
        var bw = nb <= 15 ? 55 : sData.length <= 21 ? 35 : 15
        var maxValue = d3.max(sData, function (d) { return d3.max(d.groups, function (d) { return d.value }) })

        var xScale = d3.scale.ordinal().rangeRoundBands([0, Math.min(nb * bw, width)], 0.25)
        var groupScale = d3.scale.ordinal()
        var yScale = d3.scale.linear().range([height, 0])

        // define the axis
        var xAxis = d3.svg.axis().scale(xScale).orient('bottom')
        var yAxis = d3.svg.axis().scale(yScale).orient('left').tickFormat(d3.format(maxValue > 1000 ? '.2s' : ','))

        // scale the data
        xScale.domain(sData.map(function (d) { return d.key }))
        groupScale.domain(groupKeys).rangeRoundBands([0, xScale.rangeBand()])
        yScale.domain([0, maxValue])

        // setup the x axis
        var xaxis = graph.selectAll('g.x').data([sData])
        xaxis.enter().append('g')
          .attr('class', 'x axis')
          .style('font-size', '0.8rem')
        xaxis.transition()
          .attr('transform', 'translate(0,' + height + ')')
          .attr('opacity', 1)
          .call(xAxis)
          .selectAll('text')
            .attr('y', 7)
            .attr('x', 7)
            .attr('dy', '.35em')
            .attr('transform', 'rotate(45)')
            .style('text-anchor', 'start')
        xaxis.exit().remove()

        // setup the y axis
        var yaxis = graph.selectAll('g.y').data([sData])
        yaxis.enter().append('g')
          .attr('class', 'y axis')
          .style('font-size', '0.8rem')
        yaxis.transition()
          .attr('opacity', 1)
          .call(yAxis)
        yaxis.exit().remove()

        // style the axis
        graph.selectAll('.axis path')
          .style('fill', 'none')
          .style('stroke', '#152935')
        graph.selectAll('.axis line')
          .style('fill', 'none')
          .style('stroke', '#152935')
        xaxis.selectAll('path')
          .style('stroke', 'none')

        var group = graph.selectAll('.group').data(sData)
        // add new groups
        group.enter().append('g')
          .attr('class', 'group')
          .attr('opacity', 0)
        // update groups
        group.transition()
          .attr('opacity', 1)
          .attr('transform', function (d) { return 'translate(' + xScale(d.key) + ',0)' })
        // remove old groups
        group.exit().transition()
          .attr('opacity', 0)
          .remove()

        var bars = group.selectAll('rect.bar').data(function (d) { return d.groups })
        // add new bars
        bars.enter().append('rect')
          .attr('opacity', 0)
        // update bars
        bars.transition()
          .attr('class', function (d, i) { return 'bar bar-' + d.key.replace(/\s+/g, '') })
          .attr('opacity', 1)
          .attr('width', groupScale.rangeBand())
          .attr('x', function (d) { return groupScale(d.key) })
          .attr('y', function (d) { return d.value ? yScale(d.value) : height })
          .attr('height', function (d) { return d.value ? height - yScale(d.value) : 0 })
          .style('fill', function (d) { return color(d.key) })
          .each('end', function (d) {
            d3.select(this)
              .on('mouseover', function (d, i) {
                SimpleDataVis.tooltip.mouseover(d, i, opts)
              })
              .on('mousemove', SimpleDataVis.tooltip.mousemove)
              .on('mouseout', SimpleDataVis.tooltip.mouseout)
          })
        // remove old bars
        bars.exit().transition()
          .attr('opacity', 0)
          .attr('width', 0)
          .remove()
      })

      // legend key
      var legendkey = svg.selectAll('rect.legend').data(groupKeys)

      // add new keys
      legendkey.enter().append('rect')
        .attr('class', 'legend')

      // update keys
      legendkey
        .style('fill', function (d) { return color(d) })
        .attr('x', width + margin.left + 25)
        .attr('y', function (d, i) { return i * 20 })
        .attr('width', 18)
        .attr('height', 18)

      // remove old keys
      legendkey.exit().transition()
        .attr('opacity', 0)
        .remove()

      // legend label
      var legendlabel = svg.selectAll('text.legend').data(groupKeys)

      // add new labels
      legendlabel.enter().append('text')
        .attr('class', 'legend')

      // update labels
      legendlabel
        .text(function (d) { return d })
        .attr('x', width + margin.left + 45)
        .attr('y', function (d, i) { return (i * 20 + 9) })
        .attr('dy', '.35em')
        .on('mouseover', function (d, i) {
          d3.select(this)
            // .style('cursor', 'pointer')
            .style('font-weight', 'bold')
          d3.selectAll('.bar:not(.bar-'+d.replace(/\s+/g, '') + ')')
            .attr('opacity', 0)
        })
        .on('mouseout', function (d, i) {
          d3.select(this)
            // .style('cursor', null)
            .style('font-weight', null)
          d3.selectAll('.bar:not(.bar-'+d.replace(/\s+/g, '') + ')')
            .attr('opacity', 1)
        })

      // remove old labels
      legendlabel.exit().transition()
        .attr('opacity', 0)
        .remove()
    }
  })
}(SimpleDataVis))

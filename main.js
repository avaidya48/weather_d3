
    const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
    ];

    var colors = ['#e41a1c','#377eb8','#4daf4a'];

    var svg2;
    var svg3;
    var scatters;
    var lines = new Map();

d3.csv("https://raw.githubusercontent.com/fuyuGT/CS7450-data/main/atl_weather_20to22.csv").then(function (data) {

    var years = new Set();
    data.forEach(element => {
        element.Date =  new Date(element.Date);
        years.add(element.Date.getFullYear());
        element.Dewpoint = Number(element.Dewpoint);
        element.TempMax = Number(element.TempMax);
        element.Pressure = Number(element.Pressure);
    });

    var body = document.getElementsByTagName('body')[0];
    

    plotBarChart(data, years);
    
    //var filterData = data.filter(d => d.Date.getFullYear()==2020 && d.Date.getMonth()==0);

    plotScatter(data);

    plotLine(data);

})


function plotBarChart(data, years) {
    var margin = {top: 10, right: 10, bottom: 20, left: 50},
    width = 1400 - margin.left - margin.right,
    height = 300 - margin.top - margin.bottom;

    var svg = d3.select("#main")
    .append("svg")
    .attr("width", width+20 + margin.left + margin.right)
    .attr("height", height+20 + margin.top + margin.bottom)
    .append("g")
    .attr("transform","translate(" + margin.left + "," + margin.top + ")");

    d3.select("#main").on('dblclick',function(event, d){
        document.getElementById("scatter").innerHTML = '';
        plotScatter(data);
        document.getElementById("line").innerHTML = '';
        plotLine(data);
    })

    var dataByMonth = d3.group(data, d => d.Date.getMonth());
    var barChartData = [];
    var greatest =0;
    dataByMonth.forEach(function (element, key){
        var res = d3.rollups(element, v => d3.mean(v, d => d.Precip), d => d.Date.getFullYear());
        var obj = Object.fromEntries(res);
        const values = Array.from(res.values());
        const great = d3.greatest(values.map(e => e[1]));
        greatest = great> greatest ? great : greatest;
        obj.month = monthNames[key];
        barChartData.push(obj);
    });


    var subgroups = Array.from(years);
    var months = Array.from(dataByMonth.keys());
    var groups = months.map(e => monthNames[e]);
    var x = d3.scaleBand()
      .domain(groups)
      .range([40, width-200])
      .padding([0.2])

    svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x).tickSize(0));

    var y = d3.scaleLinear()
    .domain([0, greatest])
    .range([ height, 0 ]);

    svg.append("g")
    .attr("transform","translate(" + (40) + ",0)")
    .call(d3.axisLeft(y));

  var xSubgroup = d3.scaleBand()
    .domain(subgroups)
    .range([0, x.bandwidth()])
    .padding([0.05])

    var color = d3.scaleOrdinal()
    .domain(subgroups)
    .range(colors)

  // Show the bars
  var barGroup = svg.append("g")
    .selectAll("g")
    .data(barChartData)
    .enter()
    .append("g")
    .attr("transform", function(d) { return "translate(" + x(d.month) + ",0)"; })
    .selectAll("rect")
    .data(function(d) { return subgroups.map(function(key) { 
        return {key: key, value: d[key], month: d.month};}); 
    })
    .enter().append("rect")
      .attr('class', 'myBar')
      .attr("x", function(d) { return xSubgroup(d.key);})
      .attr("y", function(d) { return y(d.value); })
      .attr("width", xSubgroup.bandwidth())
      .attr("height", function(d) { return height - y(d.value); })
      .attr("fill", function(d) { return color(d.key); });

  var legendHeight = 10;
  subgroups.forEach((element,index) =>{
        svg.append("circle").attr("cx",width-180).attr("cy",legendHeight).attr("r", 6).style("fill", colors[index]);
        svg.append("text").attr("x", width-150).attr("y", legendHeight).text(element).style("font-size", "15px").attr("alignment-baseline","middle");
        legendHeight+=30;
  })

  legendHeight+=30;
  svg.append("text").attr("x", width-180).attr("y", legendHeight).text("Interactions:").style("font-size", "15px").attr("alignment-baseline","middle");
  legendHeight+=30;
  svg.append("text").attr("x", width-180).attr("y", legendHeight).text("Hover:Highlight").style("font-size", "15px").attr("alignment-baseline","middle");
  legendHeight+=30;
  svg.append("text").attr("x", width-180).attr("y", legendHeight).text("Click:Filter").style("font-size", "15px").attr("alignment-baseline","middle");
  legendHeight+=30;
  svg.append("text").attr("x", width-180).attr("y", legendHeight).text("Doubleclick:Reset").style("font-size", "15px").attr("alignment-baseline","middle");

    svg.append("text")
    .attr("text-anchor", "end")
    .attr("x", width/2+40)
    .attr("y", 10)
    .style("font-size", "20px")
    .text("Monthly Precipitation grouped by Year");

    svg.append("text")
    .attr("text-anchor", "end")
    .attr("x", width/2)
    .attr("y", height+30)
    .style("font-size", "14px")
    .text("Months (grouped by years)");

    svg.append("text")
    .attr("text-anchor", "end")
    .attr("y", 0)
    .attr("x", -height/5)
    .attr("transform", "rotate(-90)")
    .style("font-size", "14px")
    .text("Average Precipitation");

    
                    
    barGroup
    .on('mouseover', function(event, d){
            d3.selectAll('.myBar').style('opacity', 0.4);
            d3.select(this).style('opacity', 1);
            var chosenMonth = monthNames.indexOf(d.month);
            var chosenYear = d.key;
            scatters.style('opacity', function(element){
                if(element.Date.getFullYear()==chosenYear && element.Date.getMonth()==chosenMonth){
                    return 1;
                }else{
                    return 0.1;
                }
            })
            for(const [k,v] of lines){
                if(k!=chosenYear){
                    v.style('opacity',0.1);
                }
            }

    })
    .on('mouseout', function(){
                d3.selectAll('.myBar')
                .style('opacity', 1);
                scatters.style('opacity', 1);
                for(const [k,v] of lines){
                    v.style('opacity',1);
                }
    })
    .on('click',function(event, d){
        var chosenMonth = monthNames.indexOf(d.month);
        var chosenYear = d.key;
        document.getElementById("scatter").innerHTML = '';
        plotScatter(data.filter(d => d.Date.getFullYear()==chosenYear && d.Date.getMonth()==chosenMonth));
        document.getElementById("line").innerHTML = '';
        plotLine(data.filter(d => d.Date.getFullYear()==chosenYear && d.Date.getMonth()==chosenMonth));
    })
}

function plotScatter(data){

    var margin = {top: 50, right: 20, bottom: 20, left: 50},
    width = 700 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

var weatherColors = new Map();
weatherColors.set("sun","#FFBF00");
weatherColors.set("rain","#89CFF0");
weatherColors.set("drizzle","#AFE1AF");
weatherColors.set("snow","#967bb6");

var leastDew = d3.least(data, d=>d.Dewpoint).Dewpoint;
var leastTempMax = d3.least(data, d=>d.TempMax).TempMax;
var greatestDew = d3.greatest(data, d=>d.Dewpoint).Dewpoint;
var greatestTempMax = d3.greatest(data, d=>d.TempMax).TempMax;

svg2 = d3.select("#scatter")
  .append("svg")
    .attr("width", width+20 + margin.left + margin.right)
    .attr("height", height+20 + margin.top + margin.bottom)
  .append("g")
    .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");

          var x = d3.scaleLinear()
          .domain([leastTempMax, greatestTempMax])
          .range([ 40, width-50 ]);
        svg2.append("g")
          .attr("transform", "translate(0," + height + ")")
          .call(d3.axisBottom(x));
      
        // Add Y axis
        var y = d3.scaleLinear()
          .domain([leastDew,greatestDew])
          .range([ height, 10]);
        svg2.append("g")
        .attr("transform","translate(" + (40) + ",0)")
          .call(d3.axisLeft(y));
      
        // Add dots
            scatters = svg2.append('g')
            .selectAll("dot")
            .data(data)
            .enter()
            .append("circle")
                .attr("cx", function (d) { return x(d.TempMax); } )
                .attr("cy", function (d) { return y(d.Dewpoint); } )
                .attr("r", function (d) { return (d.Pressure-1000)/5 })
                .style("fill", function(d){
                    return weatherColors.get(d.Weather);
            });

            svg2.append("text")
            .attr("text-anchor", "end")
            .attr("x", width-150)
            .attr("y", 5)
            .style("font-size", "16px")
            .text("Dewpoint vs TempMax(radius proportional to pressure)");
                
            svg2.append("text")
            .attr("text-anchor", "end")
            .attr("x", width/2)
            .attr("y", height+30)
            .style("font-size", "14px")
            .text("TempMax");
        
            svg2.append("text")
            .attr("text-anchor", "end")
            .attr("y", 0)
            .attr("x", -height/3)
            .attr("transform", "rotate(-90)")
            .style("font-size", "14px")
            .text("Dewpoint");

            legendHeight = 10;
            for (let [key, value] of weatherColors) {
                svg2.append("circle").attr("cx",width-30).attr("cy",legendHeight).attr("r", 5).style("fill", value);
                svg2.append("text").attr("x", width-20).attr("y", legendHeight).text(key).style("font-size", "10px").attr("alignment-baseline","middle");
                legendHeight+=30;
            }
            svg2.append("text").attr("x", width-30).attr("y", legendHeight).text("Interaction:").style("font-size", "10px").attr("alignment-baseline","middle");
            legendHeight+=30;
            svg2.append("text").attr("x", width-30).attr("y", legendHeight).text("Hover: Tooltip").style("font-size", "10px").attr("alignment-baseline","middle");
            

            let scatterTooltip = svg2.append('text')
            .attr('x', 0)
            .attr('y', 0)
            .style('font-size', 16)
            .style('fill', 'black')
            .style('text-anchor', 'middle')
            .style("visibility", "hidden")  // hide it initially

            let xLine = svg2.append("line")
                .style('stroke', 'black')
                .style('stroke-width', 1)
                .style("visibility", "hidden")
            let yLine = svg2.append("line")
            .style('stroke', 'black')
            .style('stroke-width', 1)
            .style("visibility", "hidden")

            scatters.on('mouseover',function(event,d){

                scatterTooltip
                .style('visibility', 'visible')
                .text(`TempMax: ${d.TempMax} - DewPoint: ${d.Dewpoint}`)
                .attr('x', x(d.TempMax))
                .attr('y', y(d.Dewpoint) - 10)
                //highlighting
                scatters  //or use d3.selectAll(".myCircles")
                    .style('opacity', 0.1)
                d3.select(this)
                    .style('opacity', 1)

                xLine
                .style('visibility', 'visible')
                .attr('x1', x(d.TempMax))
                .attr('x2', x(d.TempMax))
                .attr('y1', y(leastDew))
                .attr('y2', y(d.Dewpoint))
                yLine
                    .style('visibility', 'visible')
                    .attr('x1', x(leastTempMax))
                    .attr('x2', x(d.TempMax))
                    .attr('y1', y(d.Dewpoint))
                    .attr('y2', y(d.Dewpoint))
            })

            scatters.on('mouseout',function(){
                scatterTooltip
                .style('visibility', 'hidden')
                scatters.style('opacity', 1)
                xLine.style('visibility', 'hidden')
                yLine.style('visibility', 'hidden')
            })


}


function plotLine(data){
    var margin = {top: 50, right: 30, bottom: 20, left: 20},
    width = 700 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

    var svg3 = d3.select("#line")
  .append("svg")
    .attr("width", width+20 + margin.left + margin.right)
    .attr("height", height+20 + margin.top + margin.bottom)
  .append("g")
    .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");

    var colorMapStroke = new Map();
    colorMapStroke.set(2020,'#e41a1c');
    colorMapStroke.set(2021,'#377eb8');
    colorMapStroke.set(2022,'#4daf4a');

    var colorMapFill = new Map();
    colorMapFill.set(2020,'#FAA0A0');
    colorMapFill.set(2021,'#ADD8E6');
    colorMapFill.set(2022,'#AFE1AF');

    // Add Y axis
    var y = d3.scaleLinear()
      .domain([0, d3.max(data, function(d) { return +d.TempMax; })])
      .range([ height, 0 ]);
    svg3.append("g")
        .attr("transform","translate(" + (40) + ",0)")
      .call(d3.axisLeft(y));
    
      var x = d3.scaleTime()
      .domain(d3.extent(data, function(d) { return d.Date; }))
      .range([ 40, width-50 ]);
      svg3.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x));

      var dataByYear = d3.group(data, d => d.Date.getFullYear());
      for (const [key, value] of dataByYear) {
            var line = svg3.append("path")
                        .datum(value)
                        .attr("fill", colorMapFill.get(key))
                        .attr("stroke", colorMapStroke.get(key))
                        .attr("stroke-width", 1.5)
                        .attr("d", d3.area()
                        .x(function(d) { return x(d.Date) })
                        .y0(function(d){return y(d.TempMin) })
                        .y1(function(d){return y(d.TempMax) })
              )
              lines.set(key, line);

      }

            svg3.append("text")
            .attr("text-anchor", "end")
            .attr("x", width/2+90)
            .attr("y", 10)
            .style("font-size", "16px")
            .text("Temperature Range (Max to Min)");

            svg3.append("text")
            .attr("text-anchor", "end")
            .attr("x", width/2)
            .attr("y", height+30)
            .style("font-size", "14px")
            .text("Date");
        
            svg3.append("text")
            .attr("text-anchor", "end")
            .attr("y", 0)
            .attr("x", -height/4)
            .attr("transform", "rotate(-90)")
            .style("font-size", "14px")
            .text("TempMax - TempMin");

      legendHeight = 10;
        for (let [key, value] of colorMapStroke) {
                svg3.append("circle").attr("cx",width-30).attr("cy",legendHeight).attr("r", 5).style("fill", value);
                svg3.append("text").attr("x", width-20).attr("y", legendHeight).text(key).style("font-size", "10px").attr("alignment-baseline","middle");
                legendHeight+=30;
        }

}
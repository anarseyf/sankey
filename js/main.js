
window.onload = function() {
    
    document.getElementById("fileupload").onchange = function() {
        if (window.File && window.FileReader && window.FileList && window.Blob) {
            var file = document.getElementById("fileupload").files[0],
                reader = new FileReader();
            
            reader.onload = (function(f) {
                console.log("Reading file: " + f.name);
                sample(f.name);
            })(file);
            reader.readAsText(file);
        }
    };
    
    var setLegendText = function(text) {
        d3.select("#legend").text(text);
    };
    
    var margin = { top: 10, right: 10, bottom: 10, left: 10 },
        width = 1200 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;
        
    var formatNumber = d3.format(",.0f"),
        format = function(d) { return formatNumber(d); },
        color = d3.scale.category20();

    var svg = d3.select("#chart").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var sankey = d3.sankey()
        .nodeWidth(15)
        .nodePadding(10)
        .size([width, height]);

    var path = sankey.link();

    var sample = function(fileName) {
        svg.text("");
        d3.csv(fileName, function(csvData) {
        
            var allNodeNames = csvData.reduce(function(accumulator, current) {
                var nodeNames = (current.Sequence ? current.Sequence.split(",") : []);
                return accumulator.concat(nodeNames);
            }, []);
            
            allNodeNames = ["Start", "End"].concat(uniques(allNodeNames));
            
            var links = [];
            csvData.forEach(function(d) {
                var nodeNames = (d.Sequence ? d.Sequence.split(",") : []);
                
                var nodeIndices = nodeNames.map(function(name) {
                    return allNodeNames.indexOf(name);
                });
                nodeIndices = [0].concat(nodeIndices).concat([1]); // prepend Start, append End
                for (var i = 1; i < nodeIndices.length; i++) {
                    links.push({ source: nodeIndices[i - 1], target: nodeIndices[i], value: +d.MsgCount });
                };
            });
            
            var nodes = allNodeNames.map(function(name) { return { name: name }; });
            var data = { nodes: nodes, links: links };
            
            draw(data);
        });
    };

    var energy = function(fileName) {
        svg.text("");
        d3.json(fileName, draw);
    };
    
    var draw = function(data) {
         
        d3.select("#data").text(jsonify(data));
        
        sankey
            .nodes(data.nodes)
            .links(data.links)
            .layout(32);
        
        var linkTitleFn = function(d) {
            return d.source.name + " --> " + d.target.name + ": " + format(d.value);
        };
        
        var link = svg.append("g").selectAll(".link")
            .data(data.links)
            .enter().append("path")
            .attr("class", "link")
            .attr("d", path)
            .style("stroke-width", function(d) { return Math.max(1, d.dy); })
            .sort(function(a, b) { return b.dy - a.dy; })
            .on("mouseenter", function(d) { setLegendText(linkTitleFn(d)); })
            .on("mouseleave", function(d) { setLegendText(""); });
        
        link.append("title").text(linkTitleFn);
            
        var node = svg.append("g").selectAll(".node")
            .data(data.nodes)
            .enter().append("g")
            .attr("class", "node")
            .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
            .call(d3.behavior.drag()
                  .origin(function(d) { return d; })
                  .on("dragstart", function() { this.parentNode.appendChild(this); })
                  .on("drag", dragmove));
            
        node.append("rect")
            .attr("height", function(d) { return d.dy; })
            .attr("width", sankey.nodeWidth())
            .style("fill", function(d) { return d.color = color(d.name.replace(/ .*/, "")); })
            .style("stroke", function(d) { return d3.rgb(d.color).darker(2); })
            .append("title")
            .text(function(d) { return d.name + ": " + format(d.value); });
            
        node.append("text")
            .attr("x", -6)
            .attr("y", function(d) { return d.dy / 2; })
            .attr("dy", ".35em")
            .attr("text-anchor", "end")
            .attr("transform", null)
            .text(function(d) { return d.name; })
            .filter(function(d) { return d.x < width / 2; })
            .attr("x", 6 + sankey.nodeWidth())
            .attr("text-anchor", "start");
            
        function dragmove(d) {
            d3.select(this)
                .attr("transform", "translate(" + d.x + "," + (d.y = Math.max(0, Math.min(height - d.dy, d3.event.y))) + ")");
            sankey.relayout();
            link.attr("d", path);
        };
    };

    d3.select("#energy").on("click", function() {
        energy("samples/energy.json");
    });
    d3.select("#cycle").on("click", function() {
        energy("samples/energy-cycle.json");
    });
    d3.select("#sample").on("click", function() {
        sample("samples/sample.csv");
    });
};
/* sources :
    https://bl.ocks.org/mbostock/1021953
    https://bl.ocks.org/d3indepth/9491e05b23ca7a02fca8d4ddf12df5df
    https://bl.ocks.org/mbostock/4062045
    https://bl.ocks.org/mbostock/7881887
    Nathan Jau
*/

var USER_SPEED = "fast";

var sched_objs = [];

var act_codes = [
    {"index": "0", "short": "Sleeping", "desc": "Sleeping"},
    {"index": "1", "short": "Personal Care & Tasks", "desc": "Personal Care"},
    {"index": "2", "short": "Eat/Drink & Shopping", "desc": "Eating and Drinking"},
    {"index": "3", "short": "Education", "desc": "Education"},
    {"index": "4", "short": "Work", "desc": "Work and Work-Related Activities"},
    {"index": "5", "short": "Housework", "desc": "Household Activities"},
    {"index": "6", "short": "Volunteer / Care for Others", "desc": "Care for others / Volunteer Activities"},
    {"index": "7", "short": "Leisure / Sports", "desc": "Socializing, Relaxing, Leisure, Sports, Exercise, and Recreation"},
    {"index": "8", "short": "Religion", "desc": "Religious and Spiritual Activities"},
    {"index": "9", "short": "Misc.", "desc": "Telephone Calls, Other"},
    {"index": "10", "short": "Traveling", "desc": "Traveling"}
];

var cat_key = [0,1,2,3,4,5,6,6,2,1,7,7,8,6,9,9,10];

var speeds = { "slow": 1000, "fast": 35 };

var treemap_arr = [];

var pause = true;

// Load data
d3.tsv("../../../data/america/america_survey.tsv", function(error, data) {

    data.forEach(function(d) {
        var day_array = d.day.split(",");
        var activities = [];

        var treemap_obj = [];

        for (var i=0; i < day_array.length; i++) {
            // Duration
            if (i % 2 == 1) {
                var act = day_array[i - 1];

                var act_index = activities.findIndex(function (v) {
                    return v.act == act;
                });

                var child_obj;

                switch(+act) {
                    case 0:
                    case 1:
                    case 2:
                    case 3:
                    case 4:
                    case 5:
                    case 6:
                        if (act_index = -1) {
                            activities.push({'act': act, 'duration': +day_array[i]});
                        } else {
                            activities[act_index].duration += +day_array[i];
                        }
                        child_obj = {"name": act, "size": +day_array[i]};
                        break;
                    case 7:
                    case 13:
                        if (act_index = -1) {
                            activities.push({'act': '6', 'duration': +day_array[i]});
                        } else {
                            activities['6'] += +day_array[i];
                        }
                        child_obj = {"name": '6', "size": +day_array[i]};
                        break;
                    case 8:
                        if (act_index = -1) {
                            activities.push({'act': '2', 'duration': +day_array[i]});
                        } else {
                            activities['2'] += +day_array[i];
                        }
                        child_obj = {"name": '2', "size": +day_array[i]};
                        break;
                    case 9:
                        if (act_index = -1) {
                            activities.push({'act': '1', 'duration': +day_array[i]});
                        } else {
                            activities['1'] += +day_array[i];
                        }
                        child_obj = {"name": '1', "size": +day_array[i]};
                        break;
                    case 10:
                    case 11:
                        if (act_index = -1) {
                            activities.push({'act': '7', 'duration': +day_array[i]});
                        } else {
                            activities['7'] += +day_array[i];
                        }
                        child_obj = {"name": '7', "size": +day_array[i]};
                        break;
                    case 12:
                        if (act_index = -1) {
                            activities.push({'act': '8', 'duration': +day_array[i]});
                        } else {
                            activities['8'] += +day_array[i];
                        }
                        child_obj = {"name": '8', "size": +day_array[i]};
                        break;
                    case 14:
                    case 15:
                        if (act_index = -1) {
                            activities.push({'act': '9', 'duration': +day_array[i]});
                        } else {
                            activities['9'] += +day_array[i];
                        }
                        child_obj = {"name": '9', "size": +day_array[i]};
                        break;
                    case 16:
                        if (act_index = -1) {
                            activities.push({'act': '10', 'duration': +day_array[i]});
                        } else {
                            activities['10'] += +day_array[i];
                        }
                        child_obj = {"name": '10', "size": +day_array[i]};
                        break;
                }
            }
        }
        sched_objs.push(activities);
    });

    runVis();
    function runVis () {

        var width = 780,
                height = 800,
                padding = 1,
                maxRadius = 3;

        var curr_minute = 0;

        // Activity to put in center of circle arrangement
        var center_act = "Traveling",
                center_pt = { "x": 380, "y": 365 };

        // Coordinates for activities
        var foci = {};
        var act_index = [];
        act_codes.forEach(function(code, i) {
            act_index.push(code.short);
            if (code.desc == center_act) {
                foci[code.index] = center_pt;
            } else {
                var theta = 2 * Math.PI / (act_codes.length-1);
                foci[code.index] = {x: 250 * Math.cos(i * theta)+380, y: 250 * Math.sin(i * theta)+365 };
            }
        });

        // Start the SVG
        var svg = d3.select("#chart").append("svg")
                .attr("width", width)
                .attr("height", height);

        var margin = {top: 40, right: 10, bottom: 160, left: 60};

        var width2 = 300 - margin.left - margin.right,
                height2 = 430 - margin.top - margin.bottom;

        var svg2 = d3.select("#bar-chart").append("svg")
                .attr("width", width2 + margin.left + margin.right)
                .attr("height", height2 + margin.top + margin.bottom);

        // Used for percentages by minute
        var act_counts = [{"index": 0, "count": 0}, {"index": 1, "count": 0}, {"index": 2, "count": 0},
            {"index": 3, "count": 0}, {"index": 4, "count": 0}, {"index": 5, "count": 0},
            {"index": 6, "count": 0}, {"index": 7, "count": 0}, {"index": 8, "count": 0},
            {"index": 9, "count": 0}, {"index": 10, "count": 0}];

        // A node for each person's schedule
        var nodes = sched_objs.map(function (o, i) {
            var act = o[0].act;
            act_counts[+act].count += 1;
            var init_x = foci[act].x + Math.random();
            var init_y = foci[act].y + Math.random();
            return {
                act: act,
                radius: 3,
                x: init_x,
                y: init_y,
                color: "#00cdc0", //color(act),
                moves: 0,
                next_move_time: o[0].duration,
                sched: o
            }
        });

        var force = d3.layout.force()
                .nodes(nodes)
                .size([width, height])
                // .links([])
                .gravity(0)
                .charge(0)
                .friction(.9)
                .on("tick", tick)
                .start();

        var circle = svg.selectAll("circle")
                .data(nodes)
                .enter().append("circle")
                .attr("r", function (d) {
                    return d.radius;
                })
                .attr("class","dot")
                .on("click", function (d) {
                    updateTreemap(treemap_arr[d.index]);
                });

        // Activity labels
        var label = svg.selectAll("text")
                .data(act_codes)
                .enter().append("text")
                .attr("class", "actlabel")
                .attr("x", function (d, i) {
                    if (d.desc == center_act) {
                        return center_pt.x;
                    } else {
                        var theta = 2 * Math.PI / (act_codes.length - 1);
                        return 340 * Math.cos(i * theta) + 380;
                    }

                })
                .attr("y", function (d, i) {
                    if (d.desc == center_act) {
                        return center_pt.y;
                    } else {
                        var theta = 2 * Math.PI / (act_codes.length - 1);
                        return 340 * Math.sin(i * theta) + 365;
                    }
                });

        label.append("tspan")
                .attr("x", function () {
                    return d3.select(this.parentNode).attr("x");
                })
                // .attr("dy", "1.3em")
                .attr("text-anchor", "middle")
                .text(function (d) {
                    return d.short;
                });
        label.append("tspan")
                .attr("dy", "1.3em")
                .attr("x", function () {
                    return d3.select(this.parentNode).attr("x");
                })
                .attr("text-anchor", "middle")
                .attr("class", "actpct")
                .text(function (d) {
                    return readablePercent(act_counts[d.index].count);
                });
//	}

        // Scales
        var x = d3.scale.ordinal()
                .domain(act_index)
                .rangeRoundBands([0, width2], .1);

        var y = d3.scale.linear()
                .domain([0, 1000])
                .range([height2, 0]);

        var ylabel = d3.scale.linear()
                .domain([0, 1])
                .range([height2, 0]);

        // Axes

        var xAxis = d3.svg.axis()
                .scale(x)
                .orient("bottom");

        var yAxis = d3.svg.axis()
                .scale(ylabel)
                .tickFormat(d3.format("%"))
                .orient("left");

        svg2.append("g")
                .attr("class", "x-axis axis")
                .attr("transform", "translate(" + margin.left + "," + (margin.top + height2) + ")");

        svg2.append("g")
                .attr("class", "y-axis axis")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        svg2.select(".x-axis")
                .transition().duration(1000)
                .call(xAxis)
                .selectAll("text")
                .style("text-anchor", "end")
                .style("font-size", "12px")
                .attr("dx", "-.8em")
                .attr("dy", ".15em")
                .attr("transform", "rotate(-65)");

        svg2.select(".y-axis")
                .transition().duration(1000)
                .style("font-size","12px")
                .call(yAxis);

        // axis label

        svg2.append("text")
                .attr("x", -height2 / 2)
                .attr("y", 5)
                .attr("dy", ".7em")
                .attr("transform", "rotate(-90)")
                .style("text-anchor", "middle")
                .text("peoples");

        var tip = d3.tip()
                .attr('class', 'd3-tip');

        function updateBars(data) {
            var rect = svg2.selectAll("rect")
                    .data(data);

            tip
                    .html(function (d) {
                        return (d.count / 10) + "%";
                    });

            svg2.call(tip);

            rect
                    .enter().append("rect")
                    .attr("class", "bar")
                    .on("mouseover", tip.show)
                    .on('mouseout', tip.hide);

            rect
                    .transition().duration(40)
                    .attr("x", function (d, index) {
                        return x(act_index[index]);
                    })
                    .attr("y", function (d) {
                        return y(d.count);
                    })
                    .attr("width", x.rangeBand())
                    .attr("height", function (d) {
                        return height2 - y(d.count);
                    })
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            rect.exit().remove();
        }

        function updateRanking(data) {

            var sortedData = Array.prototype.slice.call(data).sort(function (a, b) {
                return b.count - a.count;
            });

            sortedData.forEach(function (d, index) {
                document.getElementById(index + 1).innerHTML = act_codes[d.index].short;
            });
        }

        updateBars(act_counts);
        updateRanking(act_counts);

        // Update nodes based on activity and duration
        function timer() {
            d3.range(nodes.length).map(function (i) {
                var curr_node = nodes[i],
                        curr_moves = curr_node.moves;

                // Time to go to next activity
                if (curr_node.next_move_time == curr_minute) {
                    if (curr_node.moves == curr_node.sched.length - 1) {
                        curr_moves = 0;
                    } else {
                        curr_moves += 1;
                    }

                    // Subtract from current activity count
                    act_counts[+curr_node.act].count -= 1;

                    // Move on to next activity
                    curr_node.act = curr_node.sched[curr_moves].act;

                    // Add to new activity count
                    act_counts[+curr_node.act].count += 1;

                    curr_node.moves = curr_moves;
                    curr_node.cx = foci[curr_node.act].x;
                    curr_node.cy = foci[curr_node.act].y;

                    nodes[i].next_move_time += nodes[i].sched[curr_node.moves].duration;
                }
            });

            force.resume();
            curr_minute += 1;

            label.selectAll("tspan.actpct")
                    .text(function (d) {
                        return readablePercent(act_counts[+d.index].count);
                    });

            updateBars(act_counts);
            updateRanking(act_counts);

            var true_minute = curr_minute % 1440;
            d3.select("#current_time").text(minutesToTime(true_minute));

            if (!pause) {
                setTimeout(timer, speeds[USER_SPEED]);
            }
        }

        // Time Control
        d3.select("#play").style("display", "initial").on("click", function () {
            setTimeout(timer, speeds[USER_SPEED]);
            pause = false;
            d3.select("#play").style("display", "none");
            d3.select("#pause").style("display", "initial");
        });
        d3.select("#pause").on("click", function () {
            pause = true;
            d3.select("#play").style("display", "initial");
            d3.select("#pause").style("display", "none");
        });
        d3.select("#reset").style("display", "initial").on("click", reset);

        function tick(e) {
            var k = 0.04 * e.alpha;

            // Push nodes toward their designated focus.
            nodes.forEach(function (o, i) {
                var curr_act = o.act;

                // Make sleep more sluggish moving.
                if (curr_act == "0") {
                    var damper = 0.6;
                } else {
                    var damper = 1;
                }
                o.color = "#00cdc0";
                o.y += (foci[curr_act].y - o.y) * k * damper;
                o.x += (foci[curr_act].x - o.x) * k * damper;
            });

            circle
                    .each(collide(.5))
                    .attr("cx", function (d) {
                        return d.x;
                    })
                    .attr("cy", function (d) {
                        return d.y;
                    })
                    .attr("class","dot");
        }

        // Resolve collisions between nodes.
        function collide(alpha) {
            var quadtree = d3.geom.quadtree(nodes);
            return function (d) {
                var r = d.radius + maxRadius + padding,
                        nx1 = d.x - r,
                        nx2 = d.x + r,
                        ny1 = d.y - r,
                        ny2 = d.y + r;
                quadtree.visit(function (quad, x1, y1, x2, y2) {
                    if (quad.point && (quad.point !== d)) {
                        var x = d.x - quad.point.x,
                                y = d.y - quad.point.y,
                                l = Math.sqrt(x * x + y * y),
                                r = d.radius + quad.point.radius + (d.act !== quad.point.act) * padding;
                        if (l < r) {
                            l = (l - r) / l * alpha;
                            d.x -= x *= l;
                            d.y -= y *= l;
                            quad.point.x += x;
                            quad.point.y += y;
                        }
                    }
                    return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
                });
            };
        }

        // Speed toggle
        d3.selectAll(".togglebutton")
                .on("click", function () {
                    if (d3.select(this).attr("data-val") == "slow") {
                        d3.select(".slow").classed("current", true);
                        d3.select(".medium").classed("current", false);
                        d3.select(".fast").classed("current", false);
                    } else if (d3.select(this).attr("data-val") == "medium") {
                        d3.select(".slow").classed("current", false);
                        d3.select(".medium").classed("current", true);
                        d3.select(".fast").classed("current", false);
                    }
                    else {
                        d3.select(".slow").classed("current", false);
                        d3.select(".medium").classed("current", false);
                        d3.select(".fast").classed("current", true);
                    }

                    USER_SPEED = d3.select(this).attr("data-val");
                });

        function reset() {
            if (! pause) {
                d3.select("#play").style("display", "initial");
                d3.select("#pause").style("display", "none");
                pause = true;
            }
            d3.select("#current_time").html("4:00am");
            d3.selectAll("svg").remove();
            curr_minute = -1;
            runVis();
        }

    }

}); // @end d3.tsv

// Output readable percent based on count.
function readablePercent(n) {

    var pct = 100 * n / 1000;
    if (pct < 1 && pct > 0) {
        pct = "<1%";
    } else {
        pct = Math.round(pct) + "%";
    }

    return pct;
}


// Minutes to time of day. Data is minutes from 4am.
function minutesToTime(m) {
    var minutes = (m + 4*60) % 1440;
    var hh = Math.floor(minutes / 60);
    var ampm;
    if (hh > 12) {
        hh = hh - 12;
        ampm = "pm";
    } else if (hh == 12) {
        ampm = "pm";
    } else if (hh == 0) {
        hh = 12;
        ampm = "am";
    } else {
        ampm = "am";
    }
    var mm = minutes % 60;
    if (mm < 10) {
        mm = "0" + mm;
    }

    return hh + ":" + mm + ampm
}
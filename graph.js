const graphDetails = (height, width, margin, data) => {
  const self = {
    line: d3
      .line()
      .defined((d) => !isNaN(d.distance))
      .x((d) => self.x(d.date))
      .y((d) => self.y(d.distance)),

    x: d3
      .scaleUtc()
      .domain(d3.extent(data, (d) => d.date))
      .range([margin.left, width - margin.right]),

    xAxis: (g) =>
      g.attr("transform", `translate(0,${height - margin.bottom})`).call(
        d3
          .axisBottom(self.x)
          .ticks(width / 80)
          .tickSizeOuter(0)
      ),

    y: d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.distance)])
      .nice()
      .range([height - margin.bottom, margin.top]),

    yAxis: (g) =>
      g
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(self.y))
        .call((g) => g.select(".domain").remove())
        .call((g) =>
          g
            .select(".tick:last-of-type text")
            .clone()
            .attr("x", 3)
            .attr("text-anchor", "start")
            .attr("font-weight", "bold")
            .text("distance (miles)")
        ),
  };
  return self;
};

const makeGraph = (
  data,
  { stroke = "steelblue", yAxisLabel = "miles" } = {}
) => {
  const [height, width] = [300, 500];
  const margin = { bottom: 20, left: 30, right: 30, top: 10 };

  const svg = d3.create("svg").attr("viewBox", [0, 0, width, height]);

  const x = d3
    .scaleUtc()
    .domain(d3.extent(data, ({ date }) => date))
    .range([margin.left, width - margin.right]);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(data, ({ value }) => value)])
    .nice()
    .range([height - margin.bottom, margin.top]);

  // X axis
  svg.append("g").call((g) =>
    g.attr("transform", `translate(0,${height - margin.bottom})`).call(
      d3
        .axisBottom(x)
        .ticks(width / 80)
        .tickSizeOuter(0)
    )
  );

  // Y axis
  svg.append("g").call((g) =>
    g
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y))
      .call((g) =>
        g
          .select(".tick:last-of-type text")
          .clone()
          .attr("x", 3)
          .attr("text-anchor", "start")
          .attr("font-weight", "bold")
          .text(yAxisLabel)
      )
  );

  // Right-side Y axis
  svg
    .append("g")
    .call((g) =>
      g
        .attr("transform", `translate(${width - margin.right},0)`)
        .call(d3.axisRight(y))
    );

  // Y-axis grid lines, so you can have a chance of figuring out the stuff
  // in the middle of the graph.
  svg.append("g").call((g) =>
    g
      .attr("transform", `translate(${margin.left},0)`)
      .attr("class", "grid-line")
      .call(
        d3
          .axisLeft(y)
          .tickFormat("")
          .ticks(8)
          .tickSizeInner(-width + margin.left + margin.right)
      )
  );

  const line = d3
    .line()
    .defined(({ value }) => !isNaN(value))
    .x(({ date }) => x(date))
    .y(({ value }) => y(value));

  svg
    .append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", stroke)
    .attr("stroke-width", 1.5)
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round")
    .attr("d", line);

  return svg;
};

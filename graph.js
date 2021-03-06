const graph = (
  data,
  {
    height = 300,
    margin = { bottom: 20, left: 30, right: 30, top: 10 },
    width = 500,
    yAxisLabel = "",
  } = {}
) => {
  const svg = d3.create("svg").attr("viewBox", [0, 0, width, height]);

  const x = d3
    .scaleBand()
    .domain(data.map(({ date }) => date))
    .range([margin.left, width - margin.right]);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(data, ({ value }) => value)])
    .nice()
    .range([height - margin.bottom, margin.top]);

  // X axis
  svg.append("g").call((g) => {
    g.attr("transform", `translate(0,${height - margin.bottom})`);
    g.call(
      d3
        .axisBottom(x)
        .tickSizeOuter(0)
        .tickFormat(d3.timeFormat("%b"))
        .tickValues(x.domain().filter((date) => date.getDate() === 1))
    );
  });

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

  const self = {
    append: (selector) => {
      document.querySelector(selector)?.append(svg.node());
      return self;
    },

    addBar: (
      barData = null,
      { fill = "steelblue", onMouseOut = null, onMouseOver = null } = {}
    ) => {
      const d = barData ?? data;

      const barWidth = x.bandwidth() * 0.7;
      const barXOffset = (x.bandwidth() - barWidth) / 2.0;

      const el = svg
        .append("g")
        .selectAll(".bar")
        .data(d)
        .enter()
        .append("rect")
        .attr("x", ({ date }) => x(date) + barXOffset)
        .attr("y", ({ value }) => y(value))
        .attr("width", barWidth)
        .attr("height", ({ value }) => height - y(value) - margin.bottom)
        .attr("fill", fill);

      if (typeof onMouseOut === "function") {
        el.on("mouseout", onMouseOut);
      }

      if (typeof onMouseOver === "function") {
        el.on(
          "mouseover",
          ({ clientX, clientY }, { date, value: distance, pace }) => {
            onMouseOver({ clientX, clientY }, { date, distance, pace });
          }
        );
      }

      return self;
    },

    addLine: (lineData = null, { stroke = "steelblue" } = {}) => {
      const d = lineData ?? data;

      const line = d3
        .line()
        .defined(({ value }) => !isNaN(value))
        .x(({ date }) => x(date))
        .y(({ value }) => y(value));

      svg
        .append("path")
        .datum(d)
        .attr("fill", "none")
        .attr("stroke", stroke)
        .attr("stroke-width", 1.5)
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("d", line);

      return self;
    },
  };

  return self;
};

export { graph };

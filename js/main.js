const DATA_URL = "./Reddit Posts 2015-2025.csv";
const SCHEMA = "https://vega.github.io/schema/vega-lite/v5.json";
const CHART_HEIGHT = 280;
const EMBED_OPTIONS = { actions: false };

const baseSpec = (overrides) => ({
  $schema: SCHEMA,
  data: { url: DATA_URL },
  ...overrides
});

const getResponsiveWidth = (baseWidth, selector) => {
  const container = document.querySelector(selector);
  if (!container) return baseWidth;
  
  const section = container.closest('section');
  if (!section) return baseWidth;
  
  const sectionWidth = section.offsetWidth;
  const padding = parseFloat(getComputedStyle(section).paddingLeft) + 
                  parseFloat(getComputedStyle(section).paddingRight);
  
  if (window.innerWidth <= 1280) {
    const availableWidth = sectionWidth - padding;
    return Math.min(600, availableWidth);
  }
  
  const gap = 32;
  const textMinWidth = 300;
  const availableWidth = sectionWidth - padding - gap - textMinWidth;
  
  if (window.innerWidth <= 1024) {
    return Math.min(350, availableWidth);
  } else {
    return Math.min(baseWidth, availableWidth);
  }
};

const embed = (selector, spec, name) => {
  let responsiveSpec = spec;
  if (selector === "#vis-popularity") {
    const responsiveWidth = getResponsiveWidth(spec.width, selector);
    responsiveSpec = {
      ...spec,
      width: responsiveWidth,
      height: Math.round((spec.height / spec.width) * responsiveWidth)
    };
  }
  
  vegaEmbed(selector, responsiveSpec, EMBED_OPTIONS)
    .then((result) => {
      console.log(`${name} loaded`);
    })
    .catch(error => console.error(`${name} error:`, error));
};

const redditEngagementVsSentimentBubble = baseSpec({
  transform: [
    {
      calculate: "datum.score + datum.num_comments",
      as: "engagement"
    },
    {
      aggregate: [
        { op: "mean", field: "engagement", as: "avg_engagement" },
        { op: "mean", field: "sentiment_score", as: "avg_sentiment" }
      ],
      groupby: ["subreddit"]
    }
  ],
  mark: { type: "circle", opacity: 1 },
  encoding: {
    x: {
      field: "avg_sentiment",
      type: "quantitative",
      title: "Average Sentiment (Negative → Positive)",
      scale: { domain: [-0.2, 0.2] }
    },
    y: {
      field: "avg_engagement",
      type: "quantitative",
      title: "Average Engagement",
        axis: {
          labelExpr:
            "datum.value >= 1e9 ? (datum.value/1e9 + 'B') : " +
            "datum.value >= 1e6 ? (datum.value/1e6 + 'M') : " +
            "datum.value >= 1e3 ? (datum.value/1e3 + 'k') : datum.value"
        }
    },
    size: {
      field: "avg_engagement",
      type: "quantitative",
      title: "Bubble Size (Avg Engagement)",
      scale: { range: [50, 2000] },
      legend: null
    },
    color: {
      field: "avg_sentiment",
      type: "quantitative",
      title: "Sentiment",
      scale: { scheme: "redblue" }
    },
    tooltip: [
      { field: "subreddit", type: "nominal" },
      { field: "avg_engagement", type: "quantitative",format: ".2~s" },
      { field: "avg_sentiment", type: "quantitative", format: ".2f" }
    ]
  },
  width: 500,
  height: 400
});

const getAvgSentimentSpec = () => {
  const isTabletOrSmaller = window.innerWidth <= 768;
  
  return baseSpec({
    mark: "bar",
    encoding: {
      x: { field: "subreddit", type: "nominal", title: "Subreddit", sort: "-y" },
      y: {
        aggregate: "mean",
        field: "sentiment_score",
        type: "quantitative",
        title: isTabletOrSmaller ? "Avg Sentiment (-1 to +1)" : "Average sentiment score (-1 = negative, +1 = positive)"
      },
    color: {
      aggregate: "mean",
      field: "sentiment_score",
      type: "quantitative",
      title: "Average sentiment",
      scale: { scheme: "redblue", domain: [-1, 1] }
    },
    tooltip: [
      { field: "subreddit", type: "nominal", title: "Subreddit" },
      { aggregate: "mean", field: "sentiment_score", type: "quantitative", title: "Average sentiment", format: ".3f" },
      { aggregate: "count", type: "quantitative", title: "Number of posts" }
    ]
  },
  width: 400,
  height: CHART_HEIGHT
  });
};

// Note: Use getAvgSentimentSpec() or embedAvgSentiment() for responsive title
// The function checks window width dynamically, so it will update on resize

const redditSentimentVsScore = baseSpec({
  selection: {
    subreddit_select: {
      type: "multi",
      fields: ["subreddit"],
      bind: "legend"
    }
  },
  mark: { type: "point", filled: true },
  encoding: {
    x: {
      field: "sentiment_score",
      type: "quantitative",
      title: "Sentiment score (-1 = negative, +1 = positive)"
    },
    y: {
      field: "score",
      type: "quantitative",
      title: "Post score (upvotes − downvotes)"
    },
    color: { field: "subreddit", type: "nominal", title: "Subreddit" },
    opacity: {
      condition: { selection: "subreddit_select", value: 0.9 },
      value: 0.15
    },
    tooltip: [
      { field: "title", type: "nominal", title: "Title" },
      { field: "subreddit", type: "nominal", title: "Subreddit" },
      { field: "sentiment_score", type: "quantitative", title: "Sentiment score", format: ".3f" },
      { field: "score", type: "quantitative", title: "Score" },
      { field: "num_comments", type: "quantitative", title: "Number of comments" },
      { field: "date_utc", type: "temporal", title: "Date" }
    ]
  },
  width: 400,
  height: CHART_HEIGHT
});

const redditEngagementVsSentiment = baseSpec({
  transform: [
    {
      calculate: "datum.score + datum.num_comments",
      as: "engagement"
    },
    {
      aggregate: [
        { op: "mean", field: "engagement", as: "avg_engagement" },
        { op: "mean", field: "sentiment_score", as: "avg_sentiment" }
      ],
      groupby: ["subreddit"]
    }
  ],
  mark: { type: "circle", opacity: 1 },
  encoding: {
    x: {
      field: "avg_sentiment",
      type: "quantitative",
      title: "Average Sentiment (Negative → Positive)",
      scale: { domain: [-0.2, 0.2] }
    },
    y: {
      field: "avg_engagement",
      type: "quantitative",
      title: "Average Engagement",
      axis: { format: ".2~s" }
    },
    size: {
      field: "avg_engagement",
      type: "quantitative",
      title: "Bubble Size (Avg Engagement)",
      legend: null,
      scale: { range: [50, 2000] }
    },
    color: {
      field: "avg_sentiment",
      type: "quantitative",
      title: "Sentiment",
      legend: null,
      scale: { scheme: "redblue", reverse: true }
    },
    tooltip: [
      { field: "subreddit", type: "nominal" },
      { field: "avg_engagement", type: "quantitative" },
      { field: "avg_sentiment", type: "quantitative" }
    ]
  },
  width: 400,
  height: CHART_HEIGHT
});

const getSentimentEmotionsSpec = () => {
  const isMobile = window.innerWidth <= 480;
  
  return {
    $schema: SCHEMA,
    data: { url: DATA_URL },
    width: "container",
    height: 400,
    params: [
      {
        name: "Select_Subreddit",
        value: "AskReddit"
      }
    ],
    transform: [
      { filter: { field: "subreddit", equal: { expr: "Select_Subreddit" } } },
      { timeUnit: "year", field: "date_utc", as: "year" },
      {
        calculate: "year(datum.year)",
        as: "year_number"
      },
      {
        aggregate: [
          { op: "mean", field: "sentiment_score", as: "avg_sentiment" },
          { op: "mean", field: "score", as: "avg_engagement" }
        ],
        groupby: ["year_number"]
      },
      {
        calculate: "datum.avg_sentiment > 0.3 ? '🤩' : datum.avg_sentiment > 0.2 ? '😄' : datum.avg_sentiment > 0.1 ? '😊' : datum.avg_sentiment > 0.05 ? '🙂' : datum.avg_sentiment > -0.05 ? '😐' : datum.avg_sentiment > -0.1 ? '😕' : datum.avg_sentiment > -0.2 ? '😟' : datum.avg_sentiment > -0.3 ? '😠' : '🤬'",
        as: "emotion_emoji"
      }
    ],
    encoding: {
      x: {
        field: "year_number",
        type: "ordinal",
        title: "Year",
        axis: { 
          labelAngle: isMobile ? -90 : 0, 
          labelFontSize: isMobile ? 10 : 12
        }
      },
      y: {
        field: "avg_engagement",
        type: "quantitative",
        title: "Average Engagement (Upvotes)",
        axis: { 
          format: isMobile ? ".0s" : ".2s"
        },
        scale: { zero: false, padding: 0.2 }
      }
    },
    layer: [
      {
        mark: { type: "line", interpolate: "monotone", color: "#e0e0e0", strokeWidth: 2 }
      },
      {
        mark: { type: "circle", size: isMobile ? 1500 : 3000, opacity: .4, yOffset: -3 },
        encoding: {
          color: {
            field: "avg_sentiment",
            type: "quantitative",
            scale: { 
              scheme: "RdYlGn",
              domainMid: 0,
              range: ["#d73027", "#f46d43", "#fdae61", "#fee08b", "#ffffbf", "#e6f598", "#abdda4", "#66c2a5", "#3288bd"]
            },
            legend: isMobile ? null : { title: "Avg Sentiment" }
          }
        }
      },
      {
        mark: { type: "text", fontSize: isMobile ? 24 : 40, baseline: "middle" },
        encoding: {
          text: { field: "emotion_emoji" },
          tooltip: [
            { field: "avg_engagement", title: "Avg Engagement", format: ".2~s" },
            { field: "avg_sentiment", title: "Sentiment Score", format: ".3f" }
          ]
        }
      }
    ]
  };
};

const getBubbleSpec = () => {
  const isMobile = window.innerWidth <= 480;
  const isTabletOrSmaller = window.innerWidth <= 768;
  
  if (isTabletOrSmaller) {
    const container = document.querySelector("#vis-popularity");
    if (container) {
      const section = container.closest('section');
      if (section) {
        const sectionWidth = section.offsetWidth;
        const padding = parseFloat(getComputedStyle(section).paddingLeft) + 
                       parseFloat(getComputedStyle(section).paddingRight);
        const vizPadding = parseFloat(getComputedStyle(container.closest('.visualization')).paddingLeft) + 
                          parseFloat(getComputedStyle(container.closest('.visualization')).paddingRight);
        const availableWidth = sectionWidth - padding - vizPadding;
        
        let scaledWidth;
        if (isMobile) {
          scaledWidth = Math.min(280, Math.max(250, availableWidth - 10));
        } else {
          scaledWidth = Math.min(350, Math.max(280, availableWidth - 15));
        }
        const scaledHeight = Math.round((400 / 500) * scaledWidth);
        
        return {
          ...redditEngagementVsSentimentBubble,
          width: scaledWidth,
          height: scaledHeight
        };
      }
    }
  }
  
  return {
    ...redditEngagementVsSentimentBubble,
    width: getResponsiveWidth(500, "#vis-popularity"),
    height: Math.round((400 / 500) * getResponsiveWidth(500, "#vis-popularity"))
  };
};

const originalBubbleSpec = redditEngagementVsSentimentBubble;

const embedBubbleViz = () => {
  const spec = getBubbleSpec();
  embed("#vis-popularity", spec, "Vis 1");
};

embedBubbleViz();

let weatherView = null;

const setupSubredditButtons = () => {
  const subredditButtons = document.querySelectorAll('.subreddit-button');
  
  if (subredditButtons.length > 0) {
    subredditButtons[0].classList.add('selected');
    const initialSubreddit = subredditButtons[0].textContent.trim();
    
    if (weatherView) {
      weatherView.signal('Select_Subreddit', initialSubreddit).run();
    }
  }
  
  subredditButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      
      subredditButtons.forEach(btn => btn.classList.remove('selected'));
      button.classList.add('selected');
      
      const subreddit = button.textContent.trim();
      
      if (weatherView) {
        weatherView.signal('Select_Subreddit', subreddit).run();
      }
    });
  });
};

const embedSentimentEmotions = () => {
  const spec = getSentimentEmotionsSpec();
  const currentSubreddit = weatherView ? weatherView.signal("Select_Subreddit") : "AskReddit";
  spec.params[0].value = currentSubreddit;
  
  vegaEmbed("#vis-weather", spec, EMBED_OPTIONS)
    .then((result) => {
      weatherView = result.view;
      console.log("Vis Weather loaded");
      setupSubredditButtons();
    })
    .catch(error => console.error("Vis Weather error:", error));
};

embedSentimentEmotions();

document.addEventListener('DOMContentLoaded', () => {
  if (weatherView) {
    setupSubredditButtons();
  }
});

const embedAvgSentiment = () => {
  const spec = getAvgSentimentSpec();
  embed("#vis-sentiment-subreddit", spec, "Avg Sentiment");
};

// Embed if container exists
const sentimentSubredditContainer = document.querySelector("#vis-sentiment-subreddit");
if (sentimentSubredditContainer) {
  embedAvgSentiment();
}

let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    const container = document.querySelector("#vis-popularity");
    if (container && container.innerHTML) {
      embedBubbleViz();
    }
    const weatherContainer = document.querySelector("#vis-weather");
    if (weatherContainer && weatherContainer.innerHTML) {
      embedSentimentEmotions();
    }
    const sentimentContainer = document.querySelector("#vis-sentiment-subreddit");
    if (sentimentContainer && sentimentContainer.innerHTML) {
      embedAvgSentiment();
    }
    // Update bubble grid visualization on resize
    const selectElement = document.getElementById("subreddit-select");
    if (selectElement && fullData) {
      const currentSubreddit = selectElement.value;
      updateVisualization(currentSubreddit);
    }
  }, 250);
});

// final visualizations
let fullData = null;   // <-- global so updateVisualization() can access it

document.addEventListener("DOMContentLoaded", async function () {

    // Load CSV once
    fullData = await d3.csv("Reddit Posts 2015-2025.csv", d3.autoType);

    // Draw the default subreddit
    updateVisualization("technology");
});


// ----------- MAIN UPDATE FUNCTION -----------
function updateVisualization(selectedSubreddit) {

    // Filter dataset to selected subreddit
    const posts = fullData.filter(d => d.subreddit === selectedSubreddit);

    // Update right-panel text (you can customize this later)
    document.getElementById("subreddit-title").textContent = `r/${selectedSubreddit}`;
    document.getElementById("sentiment-stats").textContent =
        `${percent(posts, "negative")}% Negative, ` +
        `${percent(posts, "neutral")}% Neutral, ` +
        `${percent(posts, "positive")}% Positive`;

    // Clear old visualization
    const viz = document.getElementById("visualization-area");
    viz.innerHTML = "";

    // ----- DRAW BUBBLE GRID -----
    
    // Calculate responsive dimensions
    const isMobile = window.innerWidth <= 480;
    const isTablet = window.innerWidth <= 768;
    
    let width, height, radius, padding;
    if (isMobile) {
        const container = document.getElementById("visualization-area");
        const containerWidth = container ? container.offsetWidth : 280;
        width = Math.min(280, Math.max(250, containerWidth - 20));
        height = width; // Keep it square
        radius = 6;
        padding = 3;
    } else if (isTablet) {
        width = 350;
        height = 350;
        radius = 8;
        padding = 3.5;
    } else {
        width = 400;
        height = 400;
        radius = 10;
        padding = 4;
    }
    
    const columns = Math.floor(width / (radius * 2 + padding));

    const sentimentOrder = ["negative", "neutral", "positive"];

    posts.sort((a, b) =>
        sentimentOrder.indexOf(a.sentiment_name) -
        sentimentOrder.indexOf(b.sentiment_name)
    );

    posts.forEach((d, i) => {
        d.x = (i % columns) * (radius * 2 + padding) + radius;
        d.y = Math.floor(i / columns) * (radius * 2 + padding) + radius;
    });

    const color = {
        positive: "#4CAF50",
        neutral: "#CFCFCF",
        negative: "#E74C3C"
    };

    // Tooltip (create only if it doesn't exist)
    let tooltip = d3.select("body").select(".tooltip");
    if (tooltip.empty()) {
        tooltip = d3.select("body")
            .append("div")
            .attr("class", "tooltip");
    }

    // SVG container
    const svg = d3.select("#visualization-area")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // Draw circles
    svg.selectAll("circle")
        .data(posts)
        .join("circle")
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("r", radius)
        .attr("fill", d => color[d.sentiment_name])
        .on("mouseover", (event, d) => {
            const postBody = d.body || d.selftext || d.text || "";
            const postTitle = d.title || "(no title)";
            const postDate = d.date_utc ? new Date(d.date_utc).toLocaleDateString() : "Unknown date";
            const postScore = d.score !== undefined ? d.score.toLocaleString() : "N/A";
            const postComments = d.num_comments !== undefined ? d.num_comments.toLocaleString() : "N/A";
            
            tooltip
                .style("opacity", 1)
                .html(`
                    <div class="tooltip-header">
                        <strong>${d.sentiment_name.toUpperCase()}</strong>
                        <span class="tooltip-date">${postDate}</span>
                    </div>
                    <div class="tooltip-title">${postTitle}</div>
                    ${postBody ? `<div class="tooltip-body">${postBody.substring(0, 500)}${postBody.length > 500 ? '...' : ''}</div>` : ''}
                    <div class="tooltip-meta">
                        <span>Score: ${postScore}</span>
                        <span>Comments: ${postComments}</span>
                    </div>
                `);
        })
        .on("mousemove", event => {
            tooltip
                .style("left", (event.pageX + 12) + "px")
                .style("top", (event.pageY + 12) + "px");
        })
        .on("mouseout", () => tooltip.style("opacity", 0));
}


// ------ DROPDOWN LISTENER ------
document.getElementById("subreddit-select").addEventListener("change", (e) => {
    updateVisualization(e.target.value);
});


// ------ HELPERS ------
function percent(posts, sentiment) {
    const count = posts.filter(d => d.sentiment_name === sentiment).length;
    return Math.round((count / posts.length) * 100);
}

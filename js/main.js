const DATA_URL = "../Reddit Posts 2015-2025.csv";
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
  
  // At 1280px and below, layout is column (text on top, viz below)
  // So visualization can use full width minus padding
  if (window.innerWidth <= 1280) {
    const availableWidth = sectionWidth - padding;
    // Use a reasonable max width, but allow it to be responsive
    return Math.min(600, availableWidth);
  }
  
  // Above 1280px, layout is row (side by side)
  const gap = 32; // 2vw gap between text and visualization
  const textMinWidth = 300; // Minimum width for text column
  const availableWidth = sectionWidth - padding - gap - textMinWidth;
  
  // Use media query breakpoints
  if (window.innerWidth <= 1024) {
    return Math.min(350, availableWidth);
  } else {
    return Math.min(baseWidth, availableWidth);
  }
};

const embed = (selector, spec, name) => {
  // Calculate responsive width for the first visualization
  let responsiveSpec = spec;
  if (selector === "#vis-popularity") {
    const responsiveWidth = getResponsiveWidth(spec.width, selector);
    responsiveSpec = {
      ...spec,
      width: responsiveWidth,
      height: Math.round((spec.height / spec.width) * responsiveWidth) // Maintain aspect ratio
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
      title: "Average Engagement"
    },
    size: {
      field: "avg_engagement",
      type: "quantitative",
      title: "Bubble Size (Avg Engagement)",
      scale: { range: [50, 2000] }
    },
    color: {
      field: "avg_sentiment",
      type: "quantitative",
      title: "Sentiment",
      scale: { scheme: "redblue" }
    },
    tooltip: [
      { field: "subreddit", type: "nominal" },
      { field: "avg_engagement", type: "quantitative" },
      { field: "avg_sentiment", type: "quantitative" }
    ]
  },
  width: 500,
  height: 400
});

const redditAvgSentimentBySubreddit = baseSpec({
  mark: "bar",
  encoding: {
    x: { field: "subreddit", type: "nominal", title: "Subreddit", sort: "-y" },
    y: {
      aggregate: "mean",
      field: "sentiment_score",
      type: "quantitative",
      title: "Average sentiment score (-1 = negative, +1 = positive)"
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
      title: "Average Engagement"
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

// Store original spec for resize handling
let originalBubbleSpec = redditEngagementVsSentimentBubble;

embed("#vis-popularity", redditEngagementVsSentimentBubble, "Vis 1");
embed("#vis-sentiment-subreddit", redditAvgSentimentBySubreddit, "Vis 2");
embed("#vis-sentiment-score", redditSentimentVsScore, "Vis 3");
embed("#vis-engagement-sentiment", redditEngagementVsSentiment, "Vis 4");

// Handle window resize for responsive visualization
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    const container = document.querySelector("#vis-popularity");
    if (container && container.innerHTML) {
      embed("#vis-popularity", originalBubbleSpec, "Vis 1");
    }
  }, 250);
});

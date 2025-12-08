// main.js
// Vega-Lite visualizations for Reddit sentiment analysis

const DATA_URL = "../Reddit Posts 2015-2025.csv";
const SCHEMA = "https://vega.github.io/schema/vega-lite/v5.json";
const CHART_HEIGHT = 280;
const EMBED_OPTIONS = { actions: false };

// Helper function to create base spec
const baseSpec = (overrides) => ({
  $schema: SCHEMA,
  data: { url: DATA_URL },
  ...overrides
});

// Helper function to embed visualizations
const embed = (selector, spec, name) => {
  vegaEmbed(selector, spec, EMBED_OPTIONS)
    .then(() => console.log(`${name} loaded`))
    .catch(error => console.error(`${name} error:`, error));
};

// Vis 1: Popularity over time
const redditPopularityByYear = baseSpec({
  transform: [
    {
      filter: "year(datum.date_utc) >= 2020 && year(datum.date_utc) <= 2025"
    },
    {
      timeUnit: "year",
      field: "date_utc",
      as: "year"
    }
  ],
  mark: "line",
  encoding: {
    x: {
      field: "year",
      type: "temporal",
      title: "Year"
    },
    y: {
      aggregate: "average",
      field: "score",
      type: "quantitative",
      title: "Average Score",
      scale: { domain: [50000, 200000] }
    },
    color: {
      field: "subreddit",
      type: "nominal",
      title: "Subreddit"
    },
    tooltip: [
      { field: "year", type: "temporal", title: "Year" },
      { field: "subreddit", type: "nominal", title: "Subreddit" },
      { aggregate: "average", field: "score", type: "quantitative", title: "Avg Score" }
    ]
  },
  width: 400,
  height: CHART_HEIGHT
});

// Vis 2: Average sentiment by subreddit
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

// Vis 3: Sentiment vs score (scatterplot with interactive legend)
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

// Vis 4: Engagement vs Sentiment (bubble chart)
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
      legend: null,  // removed the legend
      scale: { range: [50, 2000] }
    },
    color: {
      field: "avg_sentiment",
      type: "quantitative",
      title: "Sentiment",
      legend: null,  // removed the legend
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

// Embed all visualizations
embed("#vis-popularity", redditPopularityByYear, "Vis 1");
embed("#vis-sentiment-subreddit", redditAvgSentimentBySubreddit, "Vis 2");
embed("#vis-sentiment-score", redditSentimentVsScore, "Vis 3");
embed("#vis-engagement-sentiment", redditEngagementVsSentiment, "Vis 4");

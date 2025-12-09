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

const redditSentimentEmotions = {
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
        labelAngle: 0, 
        labelFontSize: 12
      }
    },
    y: {
      field: "avg_engagement",
      type: "quantitative",
      title: "Average Engagement (Upvotes)",
      scale: { zero: false, padding: 0.2 }
    }
  },
  layer: [
    {
      mark: { type: "line", interpolate: "monotone", color: "#e0e0e0", strokeWidth: 2 }
    },
    {
      mark: { type: "circle", size: 3000, opacity: .4, yOffset: -3 },
      encoding: {
        color: {
          field: "avg_sentiment",
          type: "quantitative",
          scale: { 
            scheme: "RdYlGn",
            domainMid: 0,
            range: ["#d73027", "#f46d43", "#fdae61", "#fee08b", "#ffffbf", "#e6f598", "#abdda4", "#66c2a5", "#3288bd"]
          },
          legend: { title: "Avg Sentiment" }
        }
      }
    },
    {
      mark: { type: "text", fontSize: 40, baseline: "middle" },
      encoding: {
        text: { field: "emotion_emoji" },
        tooltip: [
          { field: "year", title: "Year", timeUnit: "year" },
          { field: "avg_engagement", title: "Avg Engagement", format: ",.0f" },
          { field: "avg_sentiment", title: "Sentiment Score", format: ".3f" }
        ]
      }
    }
  ]
};

const originalBubbleSpec = redditEngagementVsSentimentBubble;

embed("#vis-popularity", redditEngagementVsSentimentBubble, "Vis 1");

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

vegaEmbed("#vis-weather", redditSentimentEmotions, EMBED_OPTIONS)
  .then((result) => {
    weatherView = result.view;
    console.log("Vis Weather loaded");
    setupSubredditButtons();
  })
  .catch(error => console.error("Vis Weather error:", error));

document.addEventListener('DOMContentLoaded', () => {
  if (weatherView) {
    setupSubredditButtons();
  }
});

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

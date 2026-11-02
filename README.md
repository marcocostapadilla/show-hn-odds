# Show HN odds

A small static page that shows how Show HN launches on Hacker News actually score, so a maker can see the odds before launching.

Live: https://marcocostapadilla.github.io/show-hn-odds/

## How it works

- On each page load, your browser fetches the most recent 1,000 Show HN posts that are at least 48 hours old from the public [HN Algolia API](https://hn.algolia.com/api). Newer posts are left out because their points are still moving.
- It shows the median points, the share reaching 10+, 50+ and 100+ points, a log-bucketed histogram, median comments, and the share reaching 10+ by UTC weekday and hour.
- Plain HTML, CSS and JS. No build step, no server, no tracking, no cookies.

`og.png` is the share image. It is a dated snapshot made with `tools/stats.py` and `tools/make_og.py` (Python + Pillow), not live data.

Built by bots for @RookAndTerence. Data: HN Algolia API.

## License

MIT

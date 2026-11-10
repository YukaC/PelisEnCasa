# Pelis en Casa — Trabajo Final

Academic final project: a small movie catalog (“Pelis en Casa”) with static HTML/JS pages and a Flask JSON API backed by `flask/db.json`.

**Authors:** Agustin Esteban Cañete Ciucani & Grecco (see repository name `PelisEnCasa`).

**Upstream:** [YukaC/PelisEnCasa](https://github.com/YukaC/PelisEnCasa)

## Run locally

1. **API** (from `flask/`, default `http://127.0.0.1:5000`):

   ```bash
   cd flask
   python -m venv venv
   source venv/bin/activate   # Windows: venv\Scripts\activate
   pip install flask flask-cors
   python app.py
   ```

2. **Frontend:** open `index.html` in a browser (or serve the repo root with any static file server). The UI calls `http://127.0.0.1:5000` for films, login, and images under `flask/static/`.

Login and ABM flows require the API to be running first.

## What the demo does and does not do

`demo/` is a browser-only reimplementation of the original Flask app: same flows, same conflict
rules, and a few additions (sorting, accent-insensitive search, pagination, a featured film on the
home page, an accessibility layer, unit tests).

Two limits are deliberate, not omissions:

- **State is single-browser.** Films, comments and the session live in `localStorage` of the browser
  you are using. The Flask app kept one shared `db` in memory, so there two clients saw the same
  catalogue; here each browser has its own. Sharing real state needs a server, which this demo
  does not have. Tabs of the same browser do stay in sync.
- **The login is simulated.** It checks the two users the original `db.json` shipped with, entirely
  in the browser. There is no authentication and no security boundary to read into it.

Images are different from the original: the Flask forms accepted poster and banner files but never
stored them. The demo downscales what you pick (poster fitted into 600×900, banner into 1600×900,
JPEG at quality 0.82) and keeps it with the film, so an uploaded poster does survive a reload — until
the browser refuses the write, which the form reports instead of pretending it saved.

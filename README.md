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

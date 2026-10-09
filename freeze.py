"""Export the Flask site as static HTML into ./build (for GitHub Pages)."""
from flask_frozen import Freezer

from app import app

app.config["FREEZER_DESTINATION"] = "build"
app.config["FREEZER_RELATIVE_URLS"] = True

if __name__ == "__main__":
    Freezer(app).freeze()

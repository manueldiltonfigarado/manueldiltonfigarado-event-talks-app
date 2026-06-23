import requests
import xml.etree.ElementTree as ET
from flask import Flask, render_template, jsonify

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
NAMESPACES = {
    'atom': 'http://www.w3.org/2005/Atom'
}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/releases')
def get_releases():
    try:
        response = requests.get(FEED_URL, timeout=10)
        if response.status_code != 200:
            return jsonify({'error': f'Failed to fetch feed. Status code: {response.status_code}'}), 500
        
        root = ET.fromstring(response.content)
        entries = []
        for entry_el in root.findall('atom:entry', NAMESPACES):
            title = entry_el.find('atom:title', NAMESPACES)
            title_text = title.text if title is not None else "Unknown Date"
            
            id_el = entry_el.find('atom:id', NAMESPACES)
            id_text = id_el.text if id_el is not None else ""
            
            updated_el = entry_el.find('atom:updated', NAMESPACES)
            updated_text = updated_el.text if updated_el is not None else ""
            
            link_el = entry_el.find('atom:link[@rel="alternate"]', NAMESPACES)
            link_href = link_el.attrib.get('href') if link_el is not None else ""
            
            content_el = entry_el.find('atom:content', NAMESPACES)
            content_html = content_el.text if content_el is not None else ""
            
            entries.append({
                'title': title_text,
                'id': id_text,
                'updated': updated_text,
                'link': link_href,
                'content': content_html
            })
            
        return jsonify({'entries': entries})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)

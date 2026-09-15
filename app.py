import os
import json
import uuid
import pygame
import threading
from werkzeug.utils import secure_filename
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

app = Flask(__name__, static_folder='static')
CORS(app)

SOUNDS_DIR = 'sounds'
CONFIG_FILE = 'config.json'
COLORS_FILE = 'colors.json'
IMAGES_DIR = os.path.join('static', 'images')

os.makedirs(SOUNDS_DIR, exist_ok=True)
os.makedirs(IMAGES_DIR, exist_ok=True)

def load_config():
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            pass
            
    config = {"order": [], "items": {}}
    if os.path.exists(COLORS_FILE):
        try:
            with open(COLORS_FILE, 'r', encoding='utf-8') as f:
                colors = json.load(f)
                for k, v in colors.items():
                    config["items"][k] = {"color": v}
        except:
            pass
    return config

def save_config(config):
    with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
        json.dump(config, f, indent=4)

# Inicializar o mixer do pygame
pygame.mixer.pre_init(44100, -16, 2, 512)
pygame.mixer.init()

# Usar apenas current_playing para rastrear
current_playing = None
sound_lock = threading.Lock()

@app.route('/')
def index():
    return app.send_static_file('index.html')

@app.route('/<path:path>')
def static_files(path):
    return app.send_static_file(path)

@app.route('/api/sounds')
def get_sounds():
    try:
        files = [f for f in os.listdir(SOUNDS_DIR) if f.lower().endswith(('.mp3', '.wav', '.ogg'))]
        return jsonify({"sounds": sorted(files)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/playing')
def get_playing_sounds():
    global current_playing
    playing = []
    with sound_lock:
        if current_playing and pygame.mixer.music.get_busy():
            playing.append(current_playing)
        else:
            current_playing = None
    return jsonify({"playing": playing})

@app.route('/api/config', methods=['GET'])
def get_config():
    return jsonify(load_config())

@app.route('/api/config/<path:filename>', methods=['POST'])
def update_config(filename):
    try:
        data = request.get_json()
        config = load_config()
        if filename not in config["items"]:
            config["items"][filename] = {}
            
        if 'color' in data:
            config["items"][filename]["color"] = data["color"]
        if 'image' in data:
            if data["image"] is None:
                config["items"][filename].pop("image", None)
            else:
                config["items"][filename]["image"] = data["image"]
                
        save_config(config)
        return jsonify({"status": "success", "file": filename, "item": config["items"][filename]})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/order', methods=['POST'])
def update_order():
    try:
        data = request.get_json()
        if not data or 'order' not in data:
            return jsonify({"error": "No order provided"}), 400
            
        config = load_config()
        config["order"] = data["order"]
        save_config(config)
        return jsonify({"status": "success"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/upload_image/<path:filename>', methods=['POST'])
def upload_image(filename):
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file part"}), 400
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No selected file"}), 400
            
        ext = os.path.splitext(file.filename)[1]
        new_filename = f"{uuid.uuid4().hex}{ext}"
        filepath = os.path.join(IMAGES_DIR, new_filename)
        file.save(filepath)
        
        config = load_config()
        if filename not in config["items"]:
            config["items"][filename] = {}
        config["items"][filename]["image"] = f"images/{new_filename}"
        save_config(config)
        
        return jsonify({"status": "success", "image": f"images/{new_filename}"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/toggle/<path:filename>', methods=['POST'])
def toggle_sound(filename):
    global current_playing
    try:
        sound_path = os.path.join(SOUNDS_DIR, os.path.basename(filename))
        
        if not os.path.exists(sound_path):
            return jsonify({"error": "File not found"}), 404

        with sound_lock:
            # Se for o mesmo som que está tocando agora, para ele
            if current_playing == filename and pygame.mixer.music.get_busy():
                pygame.mixer.music.stop()
                current_playing = None
                return jsonify({"status": "stopped", "file": filename})
            else:
                # Se for outro som: para qualquer coisa que esteja tocando
                pygame.mixer.music.stop()
                # Toca a nova música
                pygame.mixer.music.load(sound_path)
                pygame.mixer.music.play()
                current_playing = filename
                return jsonify({"status": "playing", "file": filename})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("==================================================")
    print("SERVIDOR INICIADO COM SUPORTE A TOGGLE!")
    print("Para acessar no tablet, descubra o IP deste computador e acesse:")
    print("http://SEU_IP:5001")
    print("==================================================")
    app.run(host='0.0.0.0', port=5001, debug=False)

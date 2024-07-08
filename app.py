from flask import Flask, request, jsonify, render_template
import torch
from PIL import Image
from io import BytesIO
from ultralytics import YOLO
from flask_cors import CORS
import numpy as np

app = Flask(__name__)
CORS(app)

# Load the YOLOv8 model
model = YOLO('best.pt')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload():
    if 'image' not in request.files:
        return jsonify({'error': 'No image file provided'}), 400

    image_file = request.files['image']
    image = Image.open(BytesIO(image_file.read())).convert('RGB')

    results = model(image)

    detection_dict = {}
    if isinstance(results, list):
        for result in results:
            for detection in result.boxes:
                cls = int(detection.cls[0])
                class_name = model.names[cls] if model.names else f'Class {cls}'
                confidence = float(detection.conf[0])
                box = detection.xyxy[0].tolist()

                detection_info = {
                    'class': class_name,
                    'confidence': confidence,
                    'box': box,
                    'message': generate_message(class_name),
                    'medicine': generate_medicine(class_name)
                }

                if class_name not in detection_dict:
                    detection_dict[class_name] = detection_info

    filtered_detections = list(detection_dict.values())

    return jsonify({'detections': filtered_detections})

def generate_message(class_name):
    messages = {
        'virus_kuning': 'Virus kuning (Yellow Virus) sering menyerang tanaman cabai dan menyebabkan daun tanaman menguning, mengerut, dan pertumbuhan tanaman terhambat. Virus ini disebarkan oleh serangga vektor seperti kutu kebul (Bemisia tabaci)',
        'thrips': 'Thrips adalah serangga kecil yang menyerang daun, bunga, dan buah tanaman cabai, menyebabkan bercak-bercak perak dan deformasi pada tanaman. Thrips menyebar dengan cepat dalam kondisi cuaca kering dan panas. Mereka sering tersembunyi di dalam bunga dan lipatan daun, membuatnya sulit dideteksi pada tahap awal.',
        'bercak_daun': 'Bercak daun pada tanaman cabai dapat disebabkan oleh berbagai patogen seperti jamur dan bakteri. Gejala yang ditimbulkan berupa bercak-bercak coklat atau hitam pada daun yang dapat menyebabkan daun menguning dan rontok. Biasanya di sebabkan oleh jamur seperti Alternaria solani dan Cercospora capsici atau bakteri biasanya seperti Xanthomonas campestris.',
        'sehat': 'Tanaman cabai anda sehat. Lanjutkan perawatan dengan baik untuk menjaga kesehatannya.'
    }
    return messages.get(class_name, 'Informasi tidak tersedia untuk penyakit ini.')

def generate_medicine(class_name):
    medicines = {
        'virus_kuning': 'Penanggulangan virus kuning pada tanaman cabai melibatkan beberapa langkah. Pertama, penting untuk mengendalikan serangga vektor seperti kutu kebul yang menyebarkan virus ini, dengan menggunakan insektisida. Selain itu, penggunaan mulsa plastik dapat membantu mengurangi populasi serangga tersebut. Melindungi tanaman dengan jaring anti-serangga juga efektif dalam mencegah serangga vektor mencapai tanaman. Menanam varietas cabai yang tahan terhadap virus kuning dan melakukan rotasi tanaman dengan jenis tanaman yang tidak rentan terhadap virus ini juga merupakan langkah pencegahan yang baik.',
        'thrips': 'Untuk mengendalikan thrips pada tanaman cabai, insektisida sistemik atau kontak dapat digunakan untuk mengurangi populasi thrips. Pemantauan rutin tanaman untuk mendeteksi keberadaan thrips pada tahap awal sangat penting. Penggunaan perangkap kuning berperekat dapat menarik dan menangkap thrips. Selain itu, pengendalian biologis dengan menggunakan musuh alami seperti predator dan parasitoid dapat membantu mengendalikan populasi thrips. Menjaga kebersihan lahan tanam dan mengurangi kelembaban juga merupakan langkah penting dalam pengendalian thrips.',
        'bercak_daun': 'Penanggulangan bercak daun pada tanaman cabai melibatkan aplikasi fungisida untuk mengendalikan penyakit yang disebabkan oleh jamur. Menjaga kebersihan lahan dan menghindari kelembaban berlebih yang dapat memicu pertumbuhan jamur juga penting. Melakukan rotasi tanaman dengan jenis tanaman yang tidak rentan terhadap bercak daun dapat mencegah penyebaran penyakit. Menanam varietas cabai yang tahan terhadap penyakit ini juga sangat dianjurkan. Jika bercak daun disebabkan oleh bakteri, aplikasi bakterisida dapat membantu mengendalikan penyakit tersebut.'
    }
    return medicines.get(class_name, 'Informasi tidak tersedia untuk penyakit ini.')

if __name__ == '__main__':
    app.run(debug=True)

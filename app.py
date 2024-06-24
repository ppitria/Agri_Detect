from flask import Flask, request, render_template, send_file

app = Flask(__name__)


# WELCOME PAGE ========
@app.route('/')
@app.route('/index')
def index():
    return render_template('index.html')

@app.route('/intro')
def intro():
    return render_template('intro.html')

if __name__ == '__main__':
    app.run(debug=True)

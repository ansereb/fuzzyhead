import flask
from fuzzyhead import script
import os
import datetime
import sqlite3
import json

app = flask.Flask(__name__)
conn = sqlite3.connect('task.db', check_same_thread=False)
cursor = conn.cursor()
cursor.execute("""CREATE TABLE IF NOT EXISTS tasks (id text PRIMARY KEY, name text NOT NULL,
    started_at text NOT NULL, dict_path text NOT NULL, fuzzer text NOT NULL, target_ip text NOT NULL, 
    divide_number integer, cli_args text, status text NOT NULL, result text);""")
conn.commit()

def add_cors(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

@app.route('/', methods = ['GET', 'POST'])
def root():
    if flask.request.method == 'POST':
        fuzzing_dict=flask.request.files['dict']
        dict_name=fuzzing_dict.filename
        task_name=flask.request.form['name']
        divide_number=int(flask.request.form['divide_number'])
        target_ip=flask.request.form['target_ip']
        started=str(datetime.datetime.now().time())
        task_id=task_name+'_'+started
        dict_path=os.path.join(os.path.dirname(os.path.realpath('__file__')), 'dict', dict_name)
        
        cursor.execute("""INSERT INTO tasks (id, name, started_at, dict_path, fuzzer, target_ip, divide_number, 
        cli_args, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""", (task_id, task_name, started, dict_name,
        flask.request.form['fuzzer'], target_ip, divide_number, flask.request.form['cli_args'], 'Running'))
        conn.commit()
        fuzzing_dict.save(dict_path)
        return script.start_fuzzing(flask.request.form['fuzzer'], dict_path, divide_number, target_ip, task_id, conn, cursor)
    return add_cors(flask.send_from_directory('.', 'index.html'))

@app.route('/header.html')
def send_header():
    return add_cors(flask.send_from_directory('.', 'header.html'))

@app.route('/css/<path:path>')
def send_css(path):
    return add_cors(flask.send_from_directory('css', path))

@app.route('/js/<path:path>')
def send_js(path):
    return add_cors(flask.send_from_directory('js', path))

@app.route('/fonts/<path:path>')
def send_fonts(path):
    return add_cors(flask.send_from_directory('fonts', path))

@app.route('/getTaskList')
def getTaskList():
    args=flask.request.args
    if (len(args)>0 and args['getDbData']=='true'):
        cursor.execute('SELECT name, started_at, status FROM tasks')
        return add_cors(flask.Response(json.dumps(cursor.fetchall())))
    return add_cors(flask.send_from_directory('.', 'list.html'))

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5050)
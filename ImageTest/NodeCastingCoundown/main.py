#!/usr/bin/env python
from __builtin__ import float
from flask import Flask, Response, request
import cv2
import base64
import time
import csv

app = Flask(__name__)

cap = cv2.VideoCapture('coundown.mp4')


@app.route('/getCurrentImage', methods=['GET', 'POST'])
def getCurrentImage():
    # img_str = cv2.imencode('.jpg', img)[1].tostring()
    global cap
    ret, frame = cap.read()

    if not ret:
        print("Error")
        return

    cv2.imwrite('frame.jpg', frame)

    return Response((b'--frame\r\n'
           b'Content-Type: image/jpeg\r\n\r\n' + open('frame.jpg', 'rb').read() + b'\r\n'), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/streaming', methods=['GET', 'POST'])
def streaming():
    return Response(generate(),
        mimetype = "multipart/x-mixed-replace; boundary=frame")

def generate():
    """Video streaming generator function."""
    # link = 'http://'+host
    # print(link)

    while True:
        ret, frame = cap.read()

        if not ret:
            print("Error: failed to capture image")
            break

        cv2.imwrite('frame.jpg', frame)
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + open('frame.jpg', 'rb').read() + b'\r\n')

@app.route('/testconnection', methods=['GET', 'POST'])
def testconnection():
    return "done"

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True)
#!/usr/bin/env python
from __builtin__ import float
from flask import Flask, Response, request
import cv2
import base64
import time
import csv

app = Flask(__name__)

host = ""
cap = cv2.VideoCapture()

current_milli_time = lambda: int(round(time.time() * 1000))
requestCount = 0
dataLogs = []
isContinue = True
# frameCount = 0
filename = ""
isStop = False

cap = cv2.VideoCapture('video/countdown.mp4')

@app.route('/setHost', methods=['GET', 'POST'])
def my_route():
    #/setHost?host=172.17.0.4:8080
    global host
    global filename
    global cap

    if filename == request.args.get('filename', default = 'none', type = str) :
        return "done"

    if host == request.args.get('host', default = 'none', type = str) :
        return "done"

    host = request.args.get('host', default = 'none', type = str)
    filename = request.args.get('filename', default = 'none', type = str)
    if host != 'none' :
        cap = cv2.VideoCapture('http://' + host)
    else :
        print('choose filename')
        cap = cv2.VideoCapture('/todo/video/'+filename)
    return "done"

@app.route('/restart', methods=['GET', 'POST'])
def continueStream():
    global isStop
    isStop = False
    return "done"

@app.route('/stop', methods=['GET', 'POST'])
def stopStream():
    global isStop
    isStop = True
    return "done"

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

@app.route('/getCurrentString', methods=['GET', 'POST'])
def getCurrentString():
    # img_str = cv2.imencode('.jpg', img)[1].tostring()
    if (isStop) :
        return "stop"

    global cap
    global isContinue
    # global frameCount

    # ratio = request.args.get('resize', default=1, type=float)
    # retval, buffer = cv2.imencode('.jpg', cv2.imread('loading.jpg'))
    # retval, buffer = cv2.imencode('.jpg', small)
    # img_str = base64.b64encode(buffer)
    # return "{\"timesleep\":\"0.05\",\"data\":\"" + img_str + "\"}"
    try:
        if isContinue == False :
            print "Return test: isContinue == False"
            return text_test()
        # if frameCount >= 999:
        #     print "Return test: frameCount >= 999"
        #     return text_test()
        ret, frame = cap.read()
        # frameCount = frameCount + 1
        # small = cv2.resize(frame, (0, 0), fx=ratio, fy=ratio)

        if not ret:
            print "Error not return of video"
            isContinue = False
            return text_test()

        retval, buffer = cv2.imencode('.jpg', frame)
        img_str = base64.b64encode(buffer)

        # return "{\"timesleep\":\"0.05\",\"data\":\"" + img_str + "\"}"
        # return "{"+img_str+"}";
        global requestCount
        global dataLogs
        requestCount = requestCount + 1;
        currentTime = str(current_milli_time())
        # dataLogs.append([currentTime, str(requestCount)])
        return "{" + img_str + "|"+ currentTime +"|"+ str(requestCount)+ "}"
    except Exception as e:
        isContinue = False
        print "Exception"
        print str(e)
        return text_test()

@app.route('/getCurrentBinary', methods=['GET', 'POST'])
def getCurrentBinary():
    # img_str = cv2.imencode('.jpg', img)[1].tostring()
    global cap
    ret, frame = cap.read()

    if not ret:
        print("Error")
        return

    img_str = cv2.imencode('.jpg', frame)[1].tostring()

    return img_str

@app.route('/video_feed_local')
def video_feed_local():
    return Response(gen("/video/AQUAMAN.mp4"), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/video_feed')
def video_feed():
    return Response(gen('http://'+host), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/text_feed')
def text_feed():
    return Response(genText('http://'+host))

@app.route('/text_feed_local')
def text_feed_local():
    return Response(genText("/video/AQUAMAN.mp4"))

@app.route('/text_test_binary')
def text_test_binary():
    #img = cv2.imread('messi5.jpg',0)
    img_str = cv2.imencode('.jpg', cv2.imread('loading.jpg'))[1].tostring()
    return img_str

@app.route('/saveLogs', methods=['GET', 'POST'])
def saveLogs():
    global dataLogs
    with open('castingLogs.csv', mode='w') as logfile:
        writer = csv.writer(logfile, delimiter=',', quotechar='"', quoting=csv.QUOTE_MINIMAL)
        writer.writerow(['Timestamp', 'RequestCount'])
        for e in dataLogs:
            writer.writerow([e[0], e[1]])

    return "done"

@app.route('/text_test')
def text_test():
    print "Return text loading!!!!!!!"
    #img = cv2.imread('messi5.jpg',0)
    ratio = request.args.get('resize', default=1, type=float)
    small = cv2.resize(cv2.imread('loading.jpg'), (0, 0), fx=ratio, fy=ratio)
    #retval, buffer = cv2.imencode('.jpg', cv2.imread('loading.jpg'))
    retval, buffer = cv2.imencode('.jpg', small)
    img_str = base64.b64encode(buffer)
    # return "{\"timesleep\":\"0.05\",\"data\":\""+img_str+"\"}"
    global requestCount
    global dataLogs
    requestCount = requestCount + 1;
    currentTime = str(current_milli_time())
    # dataLogs.append([currentTime, str(requestCount)])
    return "{" + img_str + "|"+ currentTime +"|"+ str(requestCount)+ "}";

def genText(link):
    """Video streaming generator function."""
    cap = cv2.VideoCapture(link)

    while True:
        ret, frame = cap.read()

        if not ret:
            print("Error: failed to capture image")
            break

        #cv2.imwrite('frame.jpg', frame)
        retval, buffer = cv2.imencode('.jpg', frame)
        img_str = base64.b64encode(buffer)
        yield(img_str)

def gen(link):
    """Video streaming generator function."""
    # link = 'http://'+host
    # print(link)
    cap = cv2.VideoCapture(link)

    while True:
        ret, frame = cap.read()

        if not ret:
            print "Error: failed to capture image"
            break

        cv2.imwrite('frame.jpg', frame)
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + open('frame.jpg', 'rb').read() + b'\r\n')

@app.route('/testconnection', methods=['GET', 'POST'])
def testconnection():
    global isStop
    isStop = False
    return "done"

@app.route('/streaming', methods=['GET', 'POST'])
def streaming():
    print("Streaming")
    return Response(generate(),
        mimetype = "multipart/x-mixed-replace; boundary=frame")

def generate():
    """Video streaming generator function."""
    # link = 'http://'+host
    # print(link)
    global isStop

    while (isStop==False) :
        ret, frame = cap.read()
        
        # print(isStop)

        if not ret:
            print("Error: failed to capture image")
            break

        cv2.imwrite('frame.jpg', frame)
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + open('frame.jpg', 'rb').read() + b'\r\n')


if __name__ == '__main__':
    print "Start video streaming"
    app.run(host='0.0.0.0', debug=True)
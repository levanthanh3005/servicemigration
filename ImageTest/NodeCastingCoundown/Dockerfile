FROM levanthanh3005/opencv:debian-python2-opencv2

#RUN pip install -r requirements.txt

RUN pip install flask

ADD . /todo
WORKDIR /todo

CMD ["python", "main.py"]
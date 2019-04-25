import os
import signal
import socket
import subprocess
import time
import urllib.request as urllib2

from pydrive.auth import GoogleAuth
from pydrive.drive import GoogleDrive

import picamera
import RPi.GPIO as GPIO  # Import Raspberry Pi GPIO library'


"""
while True:
    if GPIO.input(25): # if port 25 == 1
        print ("Port 25 is 1/GPIO.HIGH/True" )
    else:
        print ("Port 25 is 0/GPIO.LOW/False"  )
    time.sleep(0.1)
"""


def check_kill_process(pstring):
    for line in os.popen("ps ax | grep " + pstring + " | grep -v grep"):
        fields = line.split()
        pid = fields[0]
        os.kill(int(pid), signal.SIGINT)
        os.kill(int(pid), signal.SIGTERM)


def internet_on():
    try:
        socket.create_connection(("8.8.8.8", 53), 2)
        return True
    except:
        return False


GPIO.setwarnings(False)  # Ignore warning for now
GPIO.setmode(GPIO.BCM)  # Use physical pin numbering
GPIO.setup(
    25, GPIO.IN
)  # Set pin 10 to be an input pin and set initial value to be pulled low (off)
GPIO.setup(13, GPIO.OUT)


def seutp_auth():
    while not internet_on():
        pass
    gauth = GoogleAuth()
    # Try to load saved client credentials

    flag = True
    while flag:
        try:
            # f = open("mycreds2.txt")
            f = open("credentials.json")
            f.close()
            flag = False
        except:
            pass
            # gauth.LoadCredentialsFile("mycreds2.txt")

    # gauth.LoadCredentialsFile("mycreds2.txt")
    gauth.LoadCredentialsFile("credentials.json")

    print("check1")
    if gauth.credentials is None:
        pass
        # Authenticate if they're not there
        gauth.LocalWebserverAuth()
    elif gauth.access_token_expired:
        # Refresh them if expired
        gauth.Refresh()
    else:
        # Initialize the saved creds
        gauth.Authorize()
    # Save the current credentials to a file
    gauth.SaveCredentialsFile("mycreds.txt")
    # check_kill_process('chromium')
    # gauth.LoadCredentialsFile("mycreds.txt")
    print("gauth\n")
    return GoogleDrive(gauth)


stop_thread = False


def blink_camera():
    from threading import Thread
    from time import sleep

    def target():
        global stop_thread
        while not stop_thread:
            GPIO.output(13, GPIO.LOW)
            sleep(0.5)
            GPIO.output(13, GPIO.HIGH)
            sleep(0.5)

    thread = Thread(target=target)
    thread.start()
    return thread


print("camera start\n")
with picamera.PiCamera() as camera:

    camera.resolution = (640, 480)
    # camera.start_preview()
    camera.start_recording("my_video.h264")
    GPIO.output(13, GPIO.HIGH)
    # camera.wait_recording(1)
    # camera.stop_preview()
    # camera.stop_recording()
    prev_gpio = 0
    a = GPIO.input(25)
    while not a and not prev_gpio:
        # print(a)
        a = GPIO.input(25)
        # time.sleep(1)
        pass
    print(a)
    camera.stop_recording()
    while not internet_on():
        pass

    drive = seutp_auth()

    thread = blink_camera()

    file1 = drive.CreateFile({"title": "my_video.h264"})

    file1.SetContentFile("my_video.h264")

    file1.Upload()
    global stop_thread
    stop_thread = True
    thread.join()
    GPIO.output(13, GPIO.LOW)
    print("vid uploaded\n")

# Smart Dashcam and Backup Camera

### By Nima Shoghi Ghalehshahi and Ridge Ross

## Project Idea

Using two Raspberry Pi chips, two Pi camera modules, and an LCD, we have created a system that has two primary functions:

1. One of the Raspberry Pi chips and the Pi camera modules are placed in the front of the vehicle and act a smart dashcam. The camera records footage during your trip. When you arrive home, the Raspberry Pi connects to your home WiFi network and uploads the recorded footage to your Google Drive.
2. The other Raspberry Pi and Pi camera are placed in the back of the car. The camera video stream of the Pi camera is served over a UDP server. The front Raspberry Pi connects to this server and displays this video stream on an LCD.

## Hardware Necessary

-   2x [Raspberry Pi 3B](https://www.amazon.com/Raspberry-Pi-MS-004-00000024-Model-Board/dp/B01LPLPBS8) (Raspberry Pi Zero should work as well)
-   2x [Raspberry Pi Camera Module V2](https://www.amazon.com/Raspberry-Pi-Camera-Module-Megapixel/dp/B01ER2SKFS)
-   1x [Raspberry Pi Touchscreen HDMI LCD](https://www.amazon.com/ELECROW-Display-1024X600-Function-Raspberry/dp/B01GDMDFZA) (any touchscreen HDMI display should work)

## Hardware Setup

1. Connect one Raspberry Pi Camera Module to each Raspberry Pi.
2. Connect the HDMI touch display to the Raspberry Pi that will be on the front.

## Software Setup

# Smart Dashcam and Backup Camera <!-- omit in toc -->

### By Nima Shoghi Ghalehshahi and Ridge Ross <!-- omit in toc -->

## Table of Contents

- [Table of Contents](#table-of-contents)
- [Project Idea](#project-idea)
- [Demonstration Videos](#demonstration-videos)
- [Hardware Necessary](#hardware-necessary)
- [Optional Hardware](#optional-hardware)
- [Hardware Setup](#hardware-setup)
- [Software Setup](#software-setup)
  - [For the Raspberry Pi's](#for-the-raspberry-pis)
  - [For the Bluetooth Mobile App](#for-the-bluetooth-mobile-app)
    - [Setting Up and Compiling](#setting-up-and-compiling)
    - [Using the Application](#using-the-application)
- [Photos and Screenshots](#photos-and-screenshots)
  - [The Front Raspberry Pi, LCD, and Pi Camera Module](#the-front-raspberry-pi-lcd-and-pi-camera-module)
  - [The Front Power Supply](#the-front-power-supply)
  - [The Back Raspberry Pi and Pi Camera Module](#the-back-raspberry-pi-and-pi-camera-module)
  - [The Mobile Application Used to Configure the Raspberry Pi's](#the-mobile-application-used-to-configure-the-raspberry-pis)

## Project Idea

Using two Raspberry Pi chips, two Pi camera modules, and an LCD, we have created a system that has two primary functions:

1. One of the Raspberry Pi chips and the Pi camera modules are placed in the front of the vehicle and act a smart dashcam. The camera records footage during your trip. When you arrive home, the Raspberry Pi connects to your home WiFi network and uploads the recorded footage to your Google Drive.
2. The other Raspberry Pi and Pi camera are placed in the back of the car. The camera video stream of the Pi camera is served over a UDP server. The front Raspberry Pi connects to this server and displays this video stream on an LCD.

## Demonstration Videos

Backup Camera and Display: https://www.youtube.com/watch?v=xK_BoOPaq-Q

Dashcam, authenticate via Bluetooth, and upload: https://www.youtube.com/watch?v=CpvrdHVSZEg&feature=youtu.be

## Hardware Necessary

-   2x [Raspberry Pi 3B](https://www.amazon.com/Raspberry-Pi-MS-004-00000024-Model-Board/dp/B01LPLPBS8) (Raspberry Pi Zero should work as well)
-   2x [Raspberry Pi Camera Module V2](https://www.amazon.com/Raspberry-Pi-Camera-Module-Megapixel/dp/B01ER2SKFS)
-   1x [Raspberry Pi Touchscreen HDMI LCD](https://www.amazon.com/ELECROW-Display-1024X600-Function-Raspberry/dp/B01GDMDFZA) (any touchscreen HDMI display should work)

## Optional Hardware

-   1x [USB WiFi adapter](https://www.amazon.com/Blueshadow-USB-WiFi-Adapter-Wireless/dp/B077XJB1Z8)
-   1x Pushbutton (from the ECE 4180 parts kit)
-   1x LED (from the ECE 4180 parts kit)

## Hardware Setup

1. Connect one Raspberry Pi Camera Module to each Raspberry Pi.
2. Connect the HDMI touch display to the Raspberry Pi that will be on the front.
3. If using a wireless connection, connect the usb wifi adapter to the Raspberry Pi that will be in the front.
4. After finishing software setup and ensuring it works, attach the front and back Pi's to your desired locations on your vehicle.

## Software Setup

### For the Raspberry Pi's

Terminology:
The Raspberry Pi acting as the digital display and dashcam will be referred to as 'Front Pi'.
The Raspberry Pi acting as the backup camera and sender will be referred to as 'Back Pi'.

1. Compile and install openCV on both front and back Pi's.

2. If you are using a wireless connection to connect the front and back pi's follow the following steps, if not skip to step 3.

    - Setup the Back PI as an access point: https://www.raspberrypi.org/documentation/configuration/wireless/access-point.md is a good guide on how to do so.

    - Setup the DHCPCD server on the back Pi to only allow for one other IP address, making the front Pi's IP address, for all intents of purposes, static.

    - On the front PI in /etc/network/interfaces add the following lines, ensure there are no preexisting lines conflicting these

        ```
        iface wlan0 inet manual
        wpa-roam /etc/wpa_supplicant/wpa_supplicant_wlan0.conf

        allow-hotplug wlan1
        iface wlan1 inet manual
        wpa-roam /etc/wpa_supplicant/wpa_supplicant_wlan1.conf
        ```

    - In /etc/wpa_supplicant/wpa_supplicant_wlan0.conf add the following lines, changing home_network_ssid and password to match your home network settings:

        ```
        ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
        update_config=1
        country=US

        network={
                ssid="home_network_ssid"
                psk="home_network_password"
                key_mgmt=WPA-PSK
        }
        ```


    - If you have multiple networks, add another `network={...}` for each one in the same format.

    - Add the following lines to /etc/wpa_supplicant/wpa_supplicant_wlan1.conf`, changing the Back_Pi... fields to match your settings when setting up the back Raspberry Pi:

        ```
        ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
        update_config=1
        country=US

        network={
                ssid="Back_Pi_Network_Name"
                psk="Back_Pi_Password"
                key_mgmt=WPA-PSK
        }
        ```

3. Compile the code in `Camera_Streaming_Code` on both the front and back Pi's using `cmake . & make`

4. Setup each Pi to autostart the following commands, this can be done in `nano ~/.config/lxsession/LXDE-pi/autostart` with the format `@command....` this file may be in a different location depending on your Raspbian version.

    - On the front Pi. Ensure the following autostarts:

        ```
        'python3 dashcam.py'
        'sudo python3 server.py'
        'path/to/Camera_Streaming_Code/server UDP_PORT' where UDP_PORT is the number of the port you wish to use.
        ```

    - On the back Pi. Ensure the following autostarts:

        ```
        'path/to/Camera_Streaming_Code/client IP_OF_FRONT PI UDP_PORT' where UDP_PORT is the number of the port you selected earlier and IP_OF_FRONT_PI is the only possible IP that the DHCPCD server will give out that you selected ealrier
        ```

5. If you wish to use a button to send the signal to upload the dashcam's footage to Google Drive, add a button in the specified port in dashcam.py, if not comment out all GPIO code. It is recommended you use a time.sleep() delay if you are not using a button to ensure the car is outside the range of the home network before it begins checking, in order to prevent instant uploads while still in your homes garage.

6. If you have not already install pybluez and pydrive, these should be available in the pip repositories (pip3 install [package-name]), pybluez must be installed as sudo. Follow the instructions [here](https://github.com/EnableTech/raspberry-bluetooth-demo/blob/master/README.md) and [here](https://www.raspberrypi.org/forums/viewtopic.php?f=63&t=133263) for setting up the RFCOMM Bluetooth serial server support.

7. Setup a Google developer account, create a project with Google Drive API permissions, and add the client_secrets.json to the same folder that contains the dashcam.py file. [Look here](https://www.iperiusbackup.net/en/how-to-enable-google-drive-api-and-get-client-credentials/) for more information on how to enable Google Drive API access.

8. Reboot both Pi's and the server should automatically connect, pressing the button or waiting for internet connection(depending on how it was configured) should cause the dashcam footage to be uploaded to Google Drive.

### For the Bluetooth Mobile App

#### Setting Up and Compiling

1. Install the latest versions of [Node.JS](https://nodejs.org/en/), [Yarn](https://yarnpkg.com/en/), and [Android Studio](https://developer.android.com/studio).
2. Set the environment variable `ANDROID_HOME` to the location of your Android SDK directory (e.g. `C:\Users\nimas\AppData\Local\Android\Sdk`)
3. Clone this repository and navigate to the src/mobile-app directory.
4. Execute the following command in your terminal: `yarn`
5. Enable developer mode and USB debugging on your phone. [Look here](https://www.phonearena.com/news/How-to-enable-USB-debugging-on-Android_id53909) for instructions on how to enable USB debugging.
6. Connect your phone to your computer through USB and allow USB debugging.
7. Run `npx react-native run-android` to compile and run the application on your phone.

#### Using the Application

1. Make sure you have set up the Raspberry Pi's correctly (as documented in the "For the Raspberry Pi's" section above).
2. Make the front Pi discoverable through Bluetooth by clicking the Bluetooth icon in the top right and pressing "Make Discoverable".
3. Connect your phone to the front Pi using Bluetooth and accept the pairing request confirmation message on the Pi. If you get a "protocol not available" message, then your phone is trying to use the Raspberry pi as an audio output device. This shouldn't be a problem for our use case, but you can install `pulseaudio-bluetooth` to get rid of the issue. See [this tutorial](http://youness.net/raspberry-pi/how-to-connect-bluetooth-headset-or-speaker-to-raspberry-pi-3) for more information.
4. Once your phone is paired with the front Pi, you can open the application.
5. Select your home WiFi network and type the WiFi password.
6. Select the name of the front Pi's Bluetooth device. This will be "raspberrypi" by default.
7. Press "Authenticate". This will take you to the Google OAuth page for the Google Drive application that you registered in the previous step. Go through the authentication process and give Google Drive access to the application.
8. The "success" message means that your WiFi network and Google Drive information has been successfully transferred over to the Pi.
9. Now, your dashcam videos will be uploaded to Google Drive when you press the upload button.

## Photos and Screenshots

### The Front Raspberry Pi, LCD, and Pi Camera Module

![The Front Raspberry Pi, LCD, and Pi Camera Module](https://i.imgur.com/tgkbRuP.jpg)

### The Front Power Supply

![The Front Power Supply](https://i.imgur.com/oYIRpll.jpg)

### The Back Raspberry Pi and Pi Camera Module

![The Back Raspberry Pi and Pi Camera Module](https://i.imgur.com/Em2usX1.jpg)

### The Mobile Application Used to Configure the Raspberry Pi's

![The Mobile Application Used to Configure the Raspberry Pi's](https://i.imgur.com/09eAPO4.png)

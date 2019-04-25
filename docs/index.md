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



###For the Raspberry Pi's:
Terminology:
  The Raspberry Pi acting as the digital display and dashcam will be referred to as 'Front Pi'.
  The Raspbbery Pi acting as the backup camera and sender will be referred to as 'Back Pi'.

1. Compile and install openCV on both front and back Pis.
2. If you are using a wireless connection to connect the front and back pi's follow the following steps, if not skip to step 3.
2a. Setup the Back pi as an access point: https://www.raspberrypi.org/documentation/configuration/wireless/access-point.md is a good guide on how to do so.
2b. Setup the dhcpcd server on the back Pi to only allow for one other ip, making the front Pi's ip, for all intents of purposes, static.
2c. On the front pi in /etc/network/interfaces add the following lines, ensure there are no prexisting lines conflicting these
iface wlan0 inet manual
    wpa-roam /etc/wpa_supplicant/wpa_supplicant_wlan0.conf

allow-hotplug wlan1
iface wlan1 inet manual
    wpa-roam /etc/wpa_supplicant/wpa_supplicant_wlan1.conf
2d. In /etc/wpa_supplicant/wpa_supplicant_wlan0.conf add the following lines, changing home_network_ssid and password to match your home network settings:

ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
update_config=1
country=US

network={
        ssid="home_network_ssid"
        psk="home_network_password"
        key_mgmt=WPA-PSK
}
2e.  if you have multiple networks, add another network={...} for each one in the same format.
2f. Add the following lines to /etc/wpa_supplicant/wpa_supplicant_wlan1.conf ,changing the Back_Pi... fields to match your settings when setting up the back raspberry pi:
ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
update_config=1
country=US

network={
        ssid="Back_Pi_Network_Name"
        psk="Back_Pi_Password"
        key_mgmt=WPA-PSK
}

3. Compile the code in Camera_Streaming_Code on both the front and back pi's using 'cmake . & make'

4. setup each pi to autostart the following commands, this can be done in nano ~/.config/lxsession/LXDE-pi/autostart with the format '@command....' this file may be in a different location depending on your raspbian version.
4a. On the front pi. Ensure the following autostarts 'python3 dashcam.py' 'python3 server.py' 'path/to/Camera_Streaming_Code/server UDP_PORT' where UDP_PORT is the number of the port you wish to use.
4b. On the back pi. Ensure the following autostarts 'path/to/Camera_Streaming_Code/client IP_OF_FRONT PI UDP_PORT' where UDP_PORT is the number of the port you selected earlier and IP_OF_FRONT_PI is the only possible ip that the dhcpcd server will give out that you selected ealrier
5.If you wish to use a button to send the signal to upload the dashcam's footage to google drive, add a button in the specified port in dashcam.py, if not comment out all GPIO code. It is recommended you use a time.sleep() delay if you are not using a button to ensure the car is outside the range of the home network before it begins checking, in order to prevent instant uploads while still in your homes garage.
6. if you have not already install pybluez and pydrive, these should be available in the pip repositories(pip3 install pkgname), pybluez must be installed as sudo
7. setup a google developer account, create a project with google api permissions, and add the client_secrets.json to the same folder that contains the dashcam.py file.
8. Reboot both pi's and the server should automatically connect, pressing the button or waiting for internet connection(depending on how it was configured) should cause the dashcam footage to be uploaded to google drive.

import json
from time import sleep

from pydrive.auth import GoogleAuth
from pydrive.drive import GoogleDrive

from bluetooth import *

client_secrets_file = "client_secrets.json"
credentials_file = "credentials.json"


def get_client_information():
    with open(client_secrets_file, "r") as f:
        data = json.load(f)

    return data["installed"]["client_id"], data["installed"]["client_secret"]


def upload_file():
    google_auth = GoogleAuth()
    google_auth.LoadClientConfigFile(client_config_file=client_secrets_file)
    google_auth.LoadCredentialsFile(credentials_file=credentials_file)

    drive = GoogleDrive(google_auth)
    file_list = drive.ListFile({"q": "'root' in parents"}).GetList()
    for file1 in file_list:
        print("title: {}, id: {}".format(file1["title"], file1["id"]))


def set_credentials(data):
    with open(credentials_file, "w") as f:
        json.dump(data, f)


def set_wifi(data):
    pass


def wait_for_file_handle():
    while True:
        try:
            f = open(credentials_file, "r")
            f.close()
        except:
            pass


def update_data(data):
    client_id, client_secret = get_client_information()
    data["client_id"] = client_id
    data["client_secret"] = client_secret

    data.update(
        {
            "token_uri": "https://oauth2.googleapis.com/token",
            "user_agent": None,
            "revoke_uri": "https://oauth2.googleapis.com/revoke",
            "id_token": None,
            "id_token_jwt": None,
            "scopes": ["https://www.googleapis.com/auth/drive"],
            "token_info_uri": "https://oauth2.googleapis.com/tokeninfo",
            "invalid": False,
            "_class": "OAuth2Credentials",
            "_module": "oauth2client.client",
        }
    )

    return data


def main():
    server_sock = BluetoothSocket(RFCOMM)
    server_sock.bind(("", PORT_ANY))
    server_sock.listen(1)

    port = server_sock.getsockname()[1]

    uuid = "94f39d29-7d6d-437d-973b-fba39e49d4ee"

    advertise_service(
        server_sock,
        "SampleServer",
        service_id=uuid,
        service_classes=[uuid, SERIAL_PORT_CLASS],
        profiles=[SERIAL_PORT_PROFILE],
        #                   protocols = [ OBEX_UUID ]
    )

    print("Waiting for connection on RFCOMM channel %d" % port)

    client_sock, client_info = server_sock.accept()
    print("Accepted connection from ", client_info)

    try:
        while True:
            data = client_sock.recv(8192)
            if len(data) == 0:
                break
            data = data.decode("ascii")
            data = json.loads(data)

            if not "kind" in data:
                continue

            if data["kind"] == "credentials":
                data = update_data(data)
                set_credentials(data)
                # upload_file()
            elif data["kind"] == "wifi":
                set_wifi(data)

            # if data.startswith("auth="):
            #     data = json.loads(data[len("auth=") :])
            #     new_data(data)
            # elif data.startswith("auth2="):
            #     x = data[len("auth2=") :]

    except IOError:
        pass

    print("disconnected")

    client_sock.close()
    server_sock.close()
    print("all done")


while True:
    try:
        main()
        sleep(0.25)
    except:
        pass

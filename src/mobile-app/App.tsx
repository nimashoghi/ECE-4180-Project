import React, {MutableRefObject, useEffect, useRef, useState} from "react"
import {
    Alert,
    Button,
    Picker,
    StyleSheet,
    Text,
    TextInput,
    View
} from "react-native"
import {authorize, AuthorizeResult} from "react-native-app-auth"
import BluetoothSerial from "react-native-bluetooth-serial-next"
import WifiManager from "react-native-wifi"

type Device = BluetoothSerial.AndroidBluetoothDevice

interface Credentials {
    access_token: string
    token_type: string
    refresh_token: string
    token_expiry: string
    scopes: string[]
}

interface CredentialsMessage extends Credentials {
    kind: "credentials"
}

interface Wifi {
    SSID: string
    BSSID: string
}

interface WifiMessage extends Wifi {
    kind: "wifi"
    password: string
}

type Message = CredentialsMessage | WifiMessage

function generateCredentialsJson({
    accessToken: access_token,
    accessTokenExpirationDate: token_expiry,
    refreshToken: refresh_token,
    scopes,
    tokenType: token_type
}: AuthorizeResult): Credentials {
    return {
        access_token,
        token_expiry,
        refresh_token,
        scopes,
        token_type
    }
}

function useBluetooth() {
    const [paired, setPaired] = useState<Device[]>([])

    useEffect(() => {
        ;(async () => {
            setPaired((await BluetoothSerial.list()) as Device[])
        })()
    }, [])
    return paired
}

async function sendBluetoothMessage(id: Device["id"], message: Message) {
    const device = BluetoothSerial.device(id)
    await device.connect()
    await device.write(JSON.stringify(message))
}

async function authenticate() {
    return generateCredentialsJson(
        await authorize({
            issuer: "https://accounts.google.com",
            clientId:
                "1050898704264-qgfhvck2n16h5cbv094qkb4ujdsn8vuq.apps.googleusercontent.com",
            redirectUrl:
                "com.googleusercontent.apps.1050898704264-qgfhvck2n16h5cbv094qkb4ujdsn8vuq:/oauth2redirect/google",
            scopes: [
                "https://www.googleapis.com/auth/drive",
                "profile",
                "email",
                "openid"
            ]
        })
    )
}

function useAuthentication() {
    const result = useRef<Credentials>()

    useEffect(() => {
        ;(async () => (result.current = await authenticate()))()
    }, [])
    return result
}

function makeCredentialsMessage(credentials: Credentials): CredentialsMessage {
    return {
        kind: "credentials",
        ...credentials
    }
}

async function sendCredentials(credentials: Credentials, {id}: Device) {
    const device = BluetoothSerial.device(id)
    await device.connect()
    await device.write(JSON.stringify(credentials))
}

function getDefaultDevice(devices: Device[]) {
    for (const device of devices) {
        if (device.name === "raspberrypi") {
            return device
        }
    }
    return undefined
}

async function isWifiEnabled() {
    return new Promise<boolean>(resolve =>
        WifiManager.isEnabled((value: boolean) => resolve(value))
    )
}

async function getWifiList() {
    const getWifiList: (
        success: (list: string) => void,
        error: (err: Error) => void
    ) => void = WifiManager.loadWifiList
    // const getWifiList = WifiManager.reScanAndLoadWifiList

    return new Promise<Wifi[]>((resolve, reject) =>
        getWifiList((value: string) => resolve(JSON.parse(value)), reject)
    )
}

function useAsyncEffect(
    effect: () => Promise<void>,
    dependencies?: readonly any[]
) {
    useEffect(() => {
        effect().catch(console.error)
    }, dependencies)
}

function* uniqueWifiAccesspoints(list: Wifi[]) {
    const set = new Set<Wifi["BSSID"]>()
    for (const wifi of list) {
        if (set.has(wifi.SSID)) {
            continue
        }
        set.add(wifi.BSSID)
        yield wifi
    }
}

function useWifi() {
    const [list, setList] = useState<string[]>([])

    useAsyncEffect(async () => {
        if (!(await isWifiEnabled())) {
            Alert.alert("Error", "Wifi is not enabled!")
            return
        }
        const newList = await getWifiList()
        console.log(newList)
        setList([...new Set(newList.map(({SSID}) => SSID))])
    }, [])

    return list
}

// function makeWifiMessage(list: Wifi[]): WifiMessage {}

export interface WifiListProps {}

export const WifiList: React.FC<WifiListProps> = () => {
    const wifiList = useWifi()
    const [wifi, setWifi] = useState<string>("")

    return (
        <View>
            <Text style={styles.bluetoothListLabelText}>
                Select your WiFi network
            </Text>
            <Picker
                selectedValue={wifi}
                onValueChange={value => setWifi(value)}>
                {wifiList.map(wifi => (
                    <Picker.Item key={wifi} label={wifi} value={wifi} />
                ))}
            </Picker>

            <Text style={styles.bluetoothListLabelText}>
                Enter your WiFi network password
            </Text>
            <TextInput placeholder="Password" secureTextEntry />
        </View>
    )
}

export interface BluetoothListProps {
    selectedDeviceRef: MutableRefObject<Device | undefined>
}

export const BluetoothList: React.FC<BluetoothListProps> = ({
    selectedDeviceRef
}) => {
    const devices = useBluetooth()
    const [device, setDevice] = useState<Device | undefined>()

    useEffect(() => {
        const device = getDefaultDevice(devices)
        setDevice(device)
        selectedDeviceRef.current = device
    }, [devices])

    return (
        <View style={styles.bluetoothListContainer}>
            <Text style={styles.bluetoothListLabelText}>
                Select your BlueTooth device
            </Text>
            <Picker
                selectedValue={device}
                onValueChange={value => {
                    setDevice(value)
                    selectedDeviceRef.current = value
                }}>
                {devices.map(device => (
                    <Picker.Item
                        key={device.id}
                        label={device.name}
                        value={device}
                    />
                ))}
            </Picker>
        </View>
    )
}

export interface HeaderProps {}

export const Header: React.FC<HeaderProps> = () => {
    return (
        <View style={styles.headerContainer}>
            <Text style={styles.headerText}>
                Smart Dashcam and Backup Camera
            </Text>
        </View>
    )
}

export interface AppProps {}

const App: React.FC<AppProps> = () => {
    const selectedDeviceRef = useRef<Device>()

    return (
        <View style={styles.mainView}>
            <Header />
            <View style={styles.contentContainer}>
                <WifiList />
                <BluetoothList selectedDeviceRef={selectedDeviceRef} />
                <Button
                    title="Authenticate"
                    color={styles.sendButton.backgroundColor}
                    onPress={async () => {
                        if (!selectedDeviceRef.current) {
                            throw ""
                        }
                        sendBluetoothMessage(
                            selectedDeviceRef.current.id,
                            makeCredentialsMessage(await authenticate())
                        )
                        Alert.alert(
                            "Success",
                            "Successfully sent your information to the Device"
                        )
                    }}
                />
            </View>
        </View>
    )
}

export default App

const styles = StyleSheet.create({
    mainView: {
        flex: 1,
        backgroundColor: "white"
    },
    headerContainer: {
        justifyContent: "center",
        alignItems: "center",
        height: 80,
        backgroundColor: "#2277aa"
    },
    contentContainer: {
        flex: 1,
        marginVertical: 5,
        marginHorizontal: 5
    },
    headerText: {
        color: "white",
        fontSize: 20,
        textAlign: "center"
    },
    sendButton: {
        backgroundColor: "#2277aa"
    },
    bluetoothListContainer: {
        flex: 1
    },
    bluetoothListLabelText: {
        color: "grey"
    }
})

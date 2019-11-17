/*
 hicbit package
*/
//% weight=10 icon="\uf211" color=#6A5ACD
namespace hicbit {

    export let NEW_LINE = "\r\n";

    export enum hicbit_Port {
        //% block="port 1"
        port1 = 0x01,
        //% block="port 2"
        port2 = 0x02,
        //% block="port 3"
        port3 = 0x03,
        //% block="Port 4"
        port4 = 0x04
    }

    export enum hicbit_Colors {
        //% block="Red"
        Red = 0x01,
        //% block="Green"
        Green = 0x02,
        //% block="Blue"
        Blue = 0x03,
        //% block="Black"
        Black = 0x04,
        //% block="White"
        White = 0x05,
        //% block="None"
        None = 0x06
    }

    export enum hicbit_lineFollower {
        //% blockId="S1_OUT_S2_OUT" block="Sensor1 and sensor2 are out black line"
        S1_OUT_S2_OUT = 0x00,
        //% blockId="S1_OUT_S2_IN" block="Sensor2 in black line but sensor1 not"
        S1_OUT_S2_IN = 0x01,
        //% blockId="S1_IN_S2_OUT" block="Sensor1 in black line but sensor2 not"
        S1_IN_S2_OUT = 0x02,
        //% blockId="S1_IN_S2_IN" block="Sensor1 and sensor2 are in black line "
        S1_IN_S2_IN = 0x03
    }

    export enum hicbit_Servos {
        //% block="servo 1"
        Servo1 = 0x01,
        //% block="servo 2"
        Servo2 = 0x02
    }

    export enum hicbit_fanPort {
        //% block="Port 1"
        port1,
        //% block="Port 2"
        port2
    }

    export enum hicbit_servorange {
        //% block="180"
        range1 = 180,
        //% block="270"
        range2 =270
    }
	
    export enum hicbit_CmdType {
        //% block="Invalid command"
        NO_COMMAND = 0,
        //% block="car run"
        CAR_RUN = 1,
	//% block="robot run"   
	ROBOT_RUN = 1,
        //% block="Servo"
        SERVO = 2,
        //% block="Ultrasonic distance"
        ULTRASONIC = 3,
        //% block="Temperature"
        TEMPERATURE = 4,
        //% block="Sound"
        SOUND = 5,
        //% block="Light"
        LIGHT = 6,
        //% block="Voltage"
        BAT = 7,
        //% block="Rgb light"
        RGB_LIGHT = 8,
        //% block="Honk horn"
        DIDI = 9,
        //% block="Read firmware version"
        VERSION = 10,
        //% block="Read angle"
        READ_ANGLE = 11,
        //% block="Light belt"        
        RGB_BELT = 12,
        //% block="WIFI mode"
        WIFI_MODE = 13,
        //% block="Get mac"
        GET_MAC = 14,
        //% block="Get hand cmd"
        GET_HAND_CMD = 15
     }

    export enum hicbit_CarRunCmdType {
        //% block="Stop"
        STOP = 0,
        //% block="Go ahead"
        GO_AHEAD,
        //% block="Back"
        GO_BACK,
        //% block="Turn left"
        TURN_LEFT,
        //% block="Turn right"
        TURN_RIGHT,
        //% block="Go ahead slowly"
        GO_AHEAD_SLOW,
        //% block="Turn left slowly"
        TURN_LEFT_SLOW,
        //% block="Turn right slowly"
        TURN_RIGHT_SLOW,
        //% block="Invalid command"
        COMMAND_ERRO
    }


    /**
     * hicbit initialization, please execute at boot time
    */
    //% weight=100 blockId=hicbit_Init block="Initialize hicbit"
    export function hicbit_Init() {
        // hicbit_initRGBLight();
        serial.redirect(
            SerialPin.P8,
            SerialPin.P12,
            BaudRate.BaudRate115200);

        basic.forever(() => {
            getHandleCmd();
        });
        basic.pause(2000);
    }


    let handleCmd: string = "";
    let currentVoltage: number = 0;
    let volume: number = 0;
    let lhRGBLight: hicbitRGBLight.LHhicbitRGBLight;
    let lhRGBLightBelt: hicbitRGBLight.LHhicbitRGBLight;

    let P14_ad = 0;


    let MESSAGE_MAC = 0xff;
    let MESSAGE_ANGLE = 0x100;

    let i2cPortValid: boolean = true;
    let connectStatus: boolean = false;

    let servo1Angle: number = 0xfff;
    let servo2Angle: number = 0xfff;

    let macStr: string = "";
    let actiongroup_finished = true;
    
    /**
    * Get the handle command.
    */
    function getHandleCmd() {
        let charStr: string = serial.readString();
        handleCmd = handleCmd.concat(charStr);
        let cnt: number = countChar(handleCmd, "$");
        if (cnt == 0)
            return;
        let index = findIndexof(handleCmd, "$", 0);
        if (index != -1) {
            let cmd: string = handleCmd.substr(0, index);
            if (cmd.charAt(0).compare("A") == 0) {
                if (cmd.length == 7) {
                    let arg1Int: number = strToNumber(cmd.substr(1, 2));
                    let arg2Int: number = strToNumber(cmd.substr(3, 2));
                    let arg3Int: number = strToNumber(cmd.substr(5, 2));

                    P14_ad = arg1Int;

                    if (arg3Int != -1) {
                        currentVoltage = arg3Int * 10353 / 400;
                        currentVoltage = Math.round(currentVoltage);
                    }

                    if (arg2Int != -1) {
                        volume = arg2Int;
                    }
                } else if (cmd.length == 5) {
                    actiongroup_finished = true;
                } else {

                }
            }
            if (cmd.charAt(0).compare("C") == 0 && cmd.length == 11) {
                if (lhRGBLightBelt != null) {
                    for (let i = 0; i < 10; i++) {
                        let color = converOneChar(cmd.charAt(i + 1));
                        if (color != -1)
                            lhRGBLightBelt.setBeltPixelColor(i, color);
                    }
                    lhRGBLightBelt.show();
                }
            }
            if (cmd.charAt(0).compare("M") == 0 && cmd.length == 18) {
                macStr = cmd.substr(1, 17);
                control.raiseEvent(MESSAGE_MAC, 1);
            }
            if (cmd.compare("WIFI_S_CONNECT") == 0) {
                connectStatus = true;
            }
            if (cmd.compare("WIFI_S_DISCONNECT") == 0) {
                connectStatus = false;
            }
            if (cmd.charAt(0).compare("S") == 0 && cmd.length == 5) {
                let arg1Int: number = strToNumber(cmd.substr(1, 1));
                let arg2Str = cmd.substr(2, 3);
                if (arg2Str.compare("XXX") == 0) {
                    return;
                }
                let arg2Int: number = 0;
                if (arg2Str.charAt(0).compare("F") != 0) {
                    arg2Int = strToNumber(arg2Str);
                }
                if (arg2Int > 1000)
                    arg2Int = 1000;
                if (arg1Int == 1) {
                    servo1Angle = mapRGB(arg2Int, 0, 1000, 0, 240);
                    servo1Angle -= 120;
                    control.raiseEvent(MESSAGE_ANGLE, 1);
                }
                else if (arg1Int == 2) {
                    servo2Angle = mapRGB(arg2Int, 0, 1000, 0, 240);
                    servo2Angle -= 120;
                    control.raiseEvent(MESSAGE_ANGLE, 2);
                }
            }
        }
        handleCmd = "";
    }

    function checkADPortValue(value: number): number {
        if (value == -1)
            return 2;
        if (value <= 0x2E)
            return 0;
        else if (value >= 0xAA)
            return 1;
        else
            return 2;//未识别电平状态
    }

    function findIndexof(src: string, strFind: string, startIndex: number): number {
        for (let i = startIndex; i < src.length; i++) {
            if (src.charAt(i).compare(strFind) == 0) {
                return i;
            }
        }
        return -1;
    }

    function countChar(src: string, strFind: string): number {
        let cnt: number = 0;
        for (let i = 0; i < src.length; i++) {
            if (src.charAt(i).compare(strFind) == 0) {
                cnt++;
            }
        }
        return cnt;
    }

    function strToNumber(str: string): number {
        let num: number = 0;
        for (let i = 0; i < str.length; i++) {
            let tmp: number = converOneChar(str.charAt(i));
            if (tmp == -1)
                return -1;
            if (i > 0)
                num *= 16;
            num += tmp;
        }
        return num;
    }

    function decStrToNumber(str: string): number {
        let num: number = 0;
        for (let i = 0; i < str.length; i++) {
            let tmp: number = converOneChar(str.charAt(i));
            if (tmp == -1)
                return -1;
            if (i > 0)
                num *= 10;
            num += tmp;
        }
        return num;
    }

    function converOneChar(str: string): number {
        if (str.compare("0") >= 0 && str.compare("9") <= 0) {
            return parseInt(str);
        }
        else if (str.compare("A") >= 0 && str.compare("F") <= 0) {
            if (str.compare("A") == 0) {
                return 10;
            }
            else if (str.compare("B") == 0) {
                return 11;
            }
            else if (str.compare("C") == 0) {
                return 12;
            }
            else if (str.compare("D") == 0) {
                return 13;
            }
            else if (str.compare("E") == 0) {
                return 14;
            }
            else if (str.compare("F") == 0) {
                return 15;
            }
            return -1;
        }
        else
            return -1;
    }

    

    /**
    *	Set interface motor speed , range of -255~255, that can control turn.
    */
    //% weight=99 blockGap=50 blockId=hicbit_setMotorSpeed block="Set |port %port| motor|speed %speed|and|time(s) %time|"
    //% speed.min=-255 speed.max=255 
    //% time.min=0 time.max=20 
    export function hicbit_setMotorSpeed(port: hicbit_Port,speed: number,time:number) {
        let Turn: number = 0;//电机1：正 电机2：正
        let ports: number = 0;
        let time2: number = 0;
        let speed1: number = 0;
        let speed2: number = 0;
        let buf = pins.createBuffer(5);
        let buf2 = pins.createBuffer(5);

        if (speed > 255 || speed < -255) {
            return;
        } 

        if (port == 1 || port == 3)
            speed1 = speed;
        else if (port == 2 || port == 4)
            speed2 = speed;
        
        if (port == 1 || port == 2)
            ports = 0;      //第一组tb6612
        else if (port == 3 || port == 4)
            ports = 1;      //第二组tb6612
        
        if (speed1 < 0) {
            speed1 = speed1 * -1;
            if (speed2 > 0)
                Turn = 1;//电机1：反 电机2：正
            else {
                speed2 = speed2 * -1;
                Turn = 3;//电机1：反 电机2：反
            }
        }
        else if (speed2 < 0) { 
            speed2 = speed2 * -1;
            if (speed1 > 0)
                Turn = 2;//电机1：正 电机2：反
            else {
                speed1 = speed1 * -1;
                Turn = 3;//电机1：反 电机2：反
            }
        }
        
        buf[0] = 0x58;      //标志位
        buf[1] = Turn;
        buf[2] = speed1;
        buf[3] = speed2;
        buf[4] = ports;
        serial.writeBuffer(buf);
        serial.writeString(NEW_LINE);

        time2 = time * 1000;
        basic.pause(time2);
        
        buf2[0] = 0x58;      //标志位
        buf2[1] = Turn;
        buf2[2] = 0;
        buf2[3] = 0;
        buf2[4] = ports;
        serial.writeBuffer(buf2);
        serial.writeString(NEW_LINE);

        basic.pause(200);
    }

    /**
    *	Set the speed of the number 1 motor and number 2 motor, range of -255~255, that can control turn.
    */
    //% weight=98 blockGap=50 blockId=hicbit_setMotorSpeed1 block="Set motor1 speed|%speed1|and motor2|speed %speed2and|time(s) %time|"
    //% speed1.min=-255 speed1.max=255
    //% speed2.min=-255 speed2.max=255
    //% time.min=0 time.max=20 
    export function hicbit_setMotorSpeed1(speed1: number, speed2: number,time:number) {
        let Turn: number = 0;//电机1：正 电机2：正
        let time2: number = 0;

        if (speed1 > 255 || speed1 < -255 || speed2 > 255 || speed2 < -255) {
            return;
        } 
        if (speed1 < 0) {
            speed1 = speed1 * -1;
            if (speed2 > 0)
                Turn = 1;//电机1：反 电机2：正
            else {
                speed2 = speed2 * -1;
                Turn = 3;//电机1：反 电机2：反
            }
        }
        else if (speed2 < 0) { 
            speed2 = speed2 * -1;
            if (speed1 > 0)
                Turn = 2;//电机1：正 电机2：反
            else {
                speed1 = speed1 * -1;
                Turn = 3;//电机1：反 电机2：反
            }
        }
        let buf = pins.createBuffer(5);
        buf[0] = 0x58;
        buf[1] = Turn;
        buf[2] = speed1;
        buf[3] = speed2;
        buf[4] = 0;
        serial.writeBuffer(buf);
        serial.writeString(NEW_LINE);

        time2 = time * 1000;
        basic.pause(time2);
        
        let buf2 = pins.createBuffer(5);
        buf2[0] = 0x58;      //标志位
        buf2[1] = Turn;
        buf2[2] = 0;
        buf2[3] = 0;
        buf2[4] = 0;
        serial.writeBuffer(buf2);
        serial.writeString(NEW_LINE);

        basic.pause(200);
    }

    /**
    *	Set the speed of the number 3 motor and number 4 motor, range of -255~255, that can control turn.
    */
    //% weight=97 blockGap=50 blockId=hicbit_setMotorSpeed2 block="Set motor3 speed|%speed1|and motor4|speed %speed2and|time(s) %time|"
    //% speed1.min=-255 speed1.max=255
    //% speed2.min=-255 speed2.max=255
    //% time.min=0 time.max=20 
    export function hicbit_setMotorSpeed2(speed1: number, speed2: number,time:number) {
        let Turn: number = 0;//电机1：正 电机2：正
        let time2: number = 0;

        if (speed1 > 255 || speed1 < -255 || speed2 > 255 || speed2 < -255) {
            return;
        } 
        if (speed1 < 0) {
            speed1 = speed1 * -1;
            if (speed2 > 0)
                Turn = 1;//电机1：反 电机2：正
            else {
                speed2 = speed2 * -1;
                Turn = 3;//电机1：反 电机2：反
            }
        }
        else if (speed2 < 0) { 
            speed2 = speed2 * -1;
            if (speed1 > 0)
                Turn = 2;//电机1：正 电机2：反
            else {
                speed1 = speed1 * -1;
                Turn = 3;//电机1：反 电机2：反
            }
        }
        let buf = pins.createBuffer(5);
        buf[0] = 0x58;
        buf[1] = Turn;
        buf[2] = speed1;
        buf[3] = speed2;
        buf[4] = 1;
        serial.writeBuffer(buf);
        serial.writeString(NEW_LINE);

        time2 = time * 1000;
        basic.pause(time2);
        
        let buf2 = pins.createBuffer(5);
        buf2[0] = 0x58;      //标志位
        buf2[1] = Turn;
        buf2[2] = 0;
        buf2[3] = 0;
        buf2[4] = 1;
        serial.writeBuffer(buf2);
        serial.writeString(NEW_LINE);

        basic.pause(200);
    }

    

    const APDS9960_I2C_ADDR = 0x39;
    const APDS9960_ID_1 = 0xA8;
    const APDS9960_ID_2 = 0x9C;
    /* APDS-9960 register addresses */
    const APDS9960_ENABLE = 0x80;
    const APDS9960_ATIME = 0x81;
    const APDS9960_WTIME = 0x83;
    const APDS9960_AILTL = 0x84;
    const APDS9960_AILTH = 0x85;
    const APDS9960_AIHTL = 0x86;
    const APDS9960_AIHTH = 0x87;
    const APDS9960_PERS = 0x8C;
    const APDS9960_CONFIG1 = 0x8D;
    const APDS9960_PPULSE = 0x8E;
    const APDS9960_CONTROL = 0x8F;
    const APDS9960_CONFIG2 = 0x90;
    const APDS9960_ID = 0x92;
    const APDS9960_STATUS = 0x93;
    const APDS9960_CDATAL = 0x94;
    const APDS9960_CDATAH = 0x95;
    const APDS9960_RDATAL = 0x96;
    const APDS9960_RDATAH = 0x97;
    const APDS9960_GDATAL = 0x98;
    const APDS9960_GDATAH = 0x99;
    const APDS9960_BDATAL = 0x9A;
    const APDS9960_BDATAH = 0x9B;
    const APDS9960_POFFSET_UR = 0x9D;
    const APDS9960_POFFSET_DL = 0x9E;
    const APDS9960_CONFIG3 = 0x9F;
    const APDS9960_GCONF4 = 0xAB;
    const APDS9960_AICLEAR = 0xE7;


    /* LED Drive values */
    const LED_DRIVE_100MA = 0;

    /* ALS Gain (AGAIN) values */
    const AGAIN_4X = 1;

    /* Default values */
    const DEFAULT_ATIME = 219;    // 103ms
    const DEFAULT_WTIME = 246;    // 27ms
    const DEFAULT_PROX_PPULSE = 0x87;    // 16us, 8 pulses
    const DEFAULT_POFFSET_UR = 0;       // 0 offset
    const DEFAULT_POFFSET_DL = 0;       // 0 offset      
    const DEFAULT_CONFIG1 = 0x60;    // No 12x wait (WTIME) factor
    const DEFAULT_AILT = 0xFFFF;  // Force interrupt for calibration
    const DEFAULT_AIHT = 0;
    const DEFAULT_PERS = 0x11;    // 2 consecutive prox or ALS for int.
    const DEFAULT_CONFIG2 = 0x01;    // No saturation interrupts or LED boost  
    const DEFAULT_CONFIG3 = 0;       // Enable all photodiodes, no SAI
    const DEFAULT_LDRIVE = LED_DRIVE_100MA;
    const DEFAULT_AGAIN = AGAIN_4X;

    const OFF = 0;
    const POWER = 0;
    const AMBIENT_LIGHT = 1;
    const ALL = 7;

    const red_wb = 2130;
    const green_wb = 3500;
    const blue_wb = 4620;

    function i2cwrite(reg: number, value: number) {
        let buf = pins.createBuffer(2);
        buf[0] = reg;
        buf[1] = value;
        pins.i2cWriteBuffer(APDS9960_I2C_ADDR, buf);
    }

    function i2cread(reg: number): number {
        pins.i2cWriteNumber(APDS9960_I2C_ADDR, reg, NumberFormat.UInt8BE);
        let val = pins.i2cReadNumber(APDS9960_I2C_ADDR, NumberFormat.UInt8BE);
        return val;
    }


    function InitColor(): boolean {
        let id = i2cread(APDS9960_ID);
        //  serial.writeLine("id:")
        //  serial.writeNumber(id); 
        // if (!(id == APDS9960_ID_1 || id == APDS9960_ID_2)) {
        //     return false;
        // }
        //  serial.writeLine("set mode:")
        setMode(ALL, OFF);
        i2cwrite(APDS9960_ATIME, DEFAULT_ATIME);
        i2cwrite(APDS9960_WTIME, DEFAULT_WTIME);
        i2cwrite(APDS9960_PPULSE, DEFAULT_PROX_PPULSE);
        i2cwrite(APDS9960_POFFSET_UR, DEFAULT_POFFSET_UR);
        i2cwrite(APDS9960_POFFSET_DL, DEFAULT_POFFSET_DL);
        i2cwrite(APDS9960_CONFIG1, DEFAULT_CONFIG1);
        setLEDDrive(DEFAULT_LDRIVE);
        setAmbientLightGain(DEFAULT_AGAIN);
        setLightIntLowThreshold(DEFAULT_AILT);
        setLightIntHighThreshold(DEFAULT_AIHT);
        i2cwrite(APDS9960_PERS, DEFAULT_PERS);
        i2cwrite(APDS9960_CONFIG2, DEFAULT_CONFIG2);
        i2cwrite(APDS9960_CONFIG3, DEFAULT_CONFIG3);
        return true;
    }

    function setLEDDrive(drive: number) {
        let val = i2cread(APDS9960_CONTROL);
        /* Set bits in register to given value */
        drive &= 0b00000011;
        drive = drive << 6;
        val &= 0b00111111;
        val |= drive;
        i2cwrite(APDS9960_CONTROL, val);
    }

    function setLightIntLowThreshold(threshold: number) {
        let val_low = threshold & 0x00FF;
        let val_high = (threshold & 0xFF00) >> 8;
        i2cwrite(APDS9960_AILTL, val_low);
        i2cwrite(APDS9960_AILTH, val_high);
    }

    function setLightIntHighThreshold(threshold: number) {
        let val_low = threshold & 0x00FF;
        let val_high = (threshold & 0xFF00) >> 8;
        i2cwrite(APDS9960_AIHTL, val_low);
        i2cwrite(APDS9960_AIHTH, val_high);
    }


    function rgb2hue(r: number, g: number, b: number): number {
        let max = Math.max(r, Math.max(g, b))
        let min = Math.min(r, Math.min(g, b))
        let c = max - min;
        let hue = 0;
        let segment = 0;
        let shift = 0;
        if (c == 0)
            return 0;
        if ((r > g) && (r > b)) {
            segment = (60.0 * (g - b)) / c;
            if (segment < 0)
                hue = segment + 360;
        }
        else if ((g > b) && (g > r)) {
            segment = (60.0 * (b - r)) / c;
            hue = segment + 120;
        }
        else if ((b > g) && (b > r)) {
            segment = (60.0 * (r - g)) / c;
            hue = segment + 240;
        }
        return hue;
    }

    function setMode(mode: number, enable: number) {
        let reg_val = getMode();
        /* Change bit(s) in ENABLE register */
        enable = enable & 0x01;
        if (mode >= 0 && mode <= 6) {
            if (enable > 0) {
                reg_val |= (1 << mode);
            }
            else {
                //reg_val &= ~(1 << mode);
                reg_val &= (0xff - (1 << mode));
            }
        }
        else if (mode == ALL) {
            if (enable > 0) {
                reg_val = 0x7F;
            }
            else {
                reg_val = 0x00;
            }
        }
        i2cwrite(APDS9960_ENABLE, reg_val);
    }

    function getMode(): number {
        let enable_value = i2cread(APDS9960_ENABLE);
        return enable_value;
    }

    function enableLightSensor(interrupts: boolean) {
        setAmbientLightGain(DEFAULT_AGAIN);
        if (interrupts) {
            setAmbientLightIntEnable(1);
        }
        else {
            setAmbientLightIntEnable(0);
        }
        enablePower();
        setMode(AMBIENT_LIGHT, 1);
    }

    function setAmbientLightGain(drive: number) {
        let val = i2cread(APDS9960_CONTROL);
        /* Set bits in register to given value */
        drive &= 0b00000011;
        val &= 0b11111100;
        val |= drive;
        i2cwrite(APDS9960_CONTROL, val);
    }

    function getAmbientLightGain(): number {
        let val = i2cread(APDS9960_CONTROL);
        val &= 0b00000011;
        return val;
    }

    function enablePower() {
        setMode(POWER, 1);
    }

    function setAmbientLightIntEnable(enable: number) {
        let val = i2cread(APDS9960_ENABLE);
        /* Set bits in register to given value */
        enable &= 0b00000001;
        enable = enable << 4;
        val &= 0b11101111;
        val |= enable;
        i2cwrite(APDS9960_ENABLE, val);
    }

    function readAmbientLight(): number {
        let val = i2cread(APDS9960_CDATAL);
        let val_byte = i2cread(APDS9960_CDATAH);
        val = val + val_byte * 256;
        return val;
    }

    function mapRGB(x: number, in_min: number, in_max: number, out_min: number, out_max: number): number {
        return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
    }

}

/*
 Sensor package
*/
//% weight=9 icon="\uf210" color=#666666
namespace Sensor{
    
    export enum hicbit_Port {
        //% block="port A"
        port4 = 0x01,
        //% block="port B"
        port3 = 0x02,
        //% block="port C"
        port2 = 0x03,
        //% block="Port D"
        port1 = 0x04
    }

    export enum IRKEY {
        //% block="CH-"
        CH_MINUS=162,
        //% block="CH"
        CH=98,
        //% block="CH+"
        CH_ADD=226,
        //% block="PREV"
        PREV=34,
        //% block="NEXT"
        NEXT=2,
        //% block="PLAY/PAUSE"
        PLAY_PAUSE=194,
        //% block="+"
        ADD=168,
        //% block="-"
        MINUS=224,
        //% block="EQ"
        EQ=144,
        //% block="100+"
        _100=152,
        //% block="200+"
         _200 = 176,
        //% block="A"
        A=0x0C,
        //% block="B"
        B=0x8C,
        //% block="C"
        C = 0x4C,
        //% block="D"
        D = 0xCC,     
        //% block="E"
        E = 0xAC,   
        //% block="F"
        F = 0x5C,   
        //% block="UP"
        UP = 0X2C,
        //% block="DOWN"
        DOWN = 0X9C,  
        //% block="LEFT"
        LEFT = 0X6C,
        //% block="RIGHT"
        RIGHT = 0X1C, 
        //% block="SET"
        SET = 0XEC, 
        //% block="R0"
         R0 = 104,
        //% block="R1"
        R1=48,
        //% block="R2"
        R2=24,
        //% block="R3"
        R3=122,
        //% block="R4"
        R4=16,
        //% block="R5"
        R5=56,
        //% block="R6"
        R6=90,
        //% block="R7"
        R7=66,
        //% block="R8"     
        R8=74,
        //% block="R9"
        R9=82
    }

    export enum enRocker {
        //% blockId="Nostate" block="无"
        Nostate = 0,
        //% blockId="Up" block="上"
        Up,
        //% blockId="Down" block="下"
        Down,
        //% blockId="Left" block="左"
        Left,
        //% blockId="Right" block="右"
        Right,
    }

    export enum Dht11Result {
        //% block="Celsius"
        Celsius,
        //% block="Fahrenheit"
        Fahrenheit,
        //% block="humidity"
        humidity
    }


    export enum buzzer {
        //% block="ring"
        ring = 0x01,
        //% block="Not_ringing"
        Not_ringing = 0x02,
    }

    /**
        * Buzzer
        */
    //% weight=100 blockId=Buzzer block="Buzzer(P0):| %buzzer"
    export function Buzzer(buz: buzzer): void {
        switch (buz) {
            case Sensor.buzzer.ring:
                pins.digitalWritePin(DigitalPin.P0, 1);
                break;
            case Sensor.buzzer.Not_ringing:
                pins.digitalWritePin(DigitalPin.P0, 0);
                break;
        }
    }

    /**
     * Get the line follower sensor port ad value 巡线
     */
    //% weight=99 blockId=hicbit_lineSensorValue block="Get line follower sensor Value|port %port|value(0~255)"
    export function hicbit_lineSensorValue(port: hicbit_Port): number {
        let ADCPin: AnalogPin;
        switch (port) {
            case hicbit_Port.port1:
                ADCPin = AnalogPin.P1;
                break;
            case hicbit_Port.port2:
                ADCPin = AnalogPin.P2;
                break;
            case hicbit_Port.port3:
                ADCPin = AnalogPin.P3;
                break;
            case hicbit_Port.port4:
                ADCPin = AnalogPin.P4;
                break;
        }
        let adValue = pins.analogReadPin(ADCPin);
        adValue = adValue * 255 / 1023;
        return Math.round(adValue);
    }

    let distanceBak = 0;
    /**
     * Get the distance of ultrasonic detection to the obstacle 超声波
     */
    //% weight=98 blockId=hicbit_ultrasonic  block="Ultrasonic|port %port|distance(cm)"
    export function hicbit_ultrasonic(port: hicbit_Port): number {
        let echoPin: DigitalPin;
        let trigPin: DigitalPin;
        switch (port) {
            case hicbit_Port.port1:
                echoPin = DigitalPin.P15;
                trigPin = DigitalPin.P1;
                break;
            case hicbit_Port.port2:
                echoPin = DigitalPin.P13;
                trigPin = DigitalPin.P2;
                break;
            case hicbit_Port.port3:
                echoPin = DigitalPin.P14;
                trigPin = DigitalPin.P3;
                break;
            case hicbit_Port.port4:
                echoPin = DigitalPin.P10;
                trigPin = DigitalPin.P4;
                break;
        }
        pins.setPull(echoPin, PinPullMode.PullNone);
        pins.setPull(trigPin, PinPullMode.PullNone);

        pins.digitalWritePin(trigPin, 0);
        control.waitMicros(2);
        pins.digitalWritePin(trigPin, 1);
        control.waitMicros(10);
        pins.digitalWritePin(trigPin, 0);
        control.waitMicros(5);
        let d = pins.pulseIn(echoPin, PulseValue.High, 25000);
        let distance = d;
        // filter timeout spikes
        if (distance == 0 && distanceBak != 0) {
            distance = distanceBak;
        }
        distanceBak = d;
        return Math.round(distance * 10 / 6 / 58);
    }

    /**
    * Get the ad value of the knob moudule 旋钮
    */
    //% weight=97 blockId=hicbit_getKnobValue  block="Get knob|port %port|value(0~255)"
    export function hicbit_getKnobValue(port: hicbit_Port): number {
        let ADCPin: AnalogPin;
        switch (port) {
            case hicbit_Port.port1:
                ADCPin = AnalogPin.P1;
                break;
            case hicbit_Port.port2:
                ADCPin = AnalogPin.P2;
                break;
            case hicbit_Port.port3:
                ADCPin = AnalogPin.P3;
                break;
            case hicbit_Port.port4:
                ADCPin = AnalogPin.P4;
                break;
        }
        let adValue = pins.analogReadPin(ADCPin);
        adValue = adValue * 255 / 1023;
        return Math.round(adValue);
    }

    /**
    * Get the ad value of the photosensitive moudule 光敏AD
    */
    //% weight=96 blockId=hicbit_getphotosensitiveValue  block="Get Photosensitive|port %port|value(0~255)"
    export function hicbit_getphotosensitiveValue(port: hicbit_Port): number {
        let ADCPin: AnalogPin;
        switch (port) {
            case hicbit_Port.port1:
                ADCPin = AnalogPin.P1;
                break;
            case hicbit_Port.port2:
                ADCPin = AnalogPin.P2;
                break;
            case hicbit_Port.port3:
                ADCPin = AnalogPin.P3;
                break;
            case hicbit_Port.port4:
                ADCPin = AnalogPin.P4;
                break;
        }
        let adValue = pins.analogReadPin(ADCPin);
        adValue = adValue * 255 / 1023;
        return 255 - Math.round(adValue);
    }

    /**
    * Get the Photosensitive sensor status,1 detect bright,0 no detect bright 光敏
    */
    //% weight=95 blockId=hicbit_photosensitiveSensor blockGap=50 block="Photosensitive sensor|port %port|detect bright"
    export function hicbit_photosensitiveSensor(port: hicbit_Port): boolean {
        let status = 0;
        let flag: boolean = false;
        switch (port) {
            case hicbit_Port.port1:
                pins.setPull(DigitalPin.P15, PinPullMode.PullUp);
                status = pins.digitalReadPin(DigitalPin.P15);
                break;
            case hicbit_Port.port2:
                pins.setPull(DigitalPin.P13, PinPullMode.PullUp);
                status = pins.digitalReadPin(DigitalPin.P13);
                break;
            case hicbit_Port.port3:
                pins.setPull(DigitalPin.P14, PinPullMode.PullUp);
                status = pins.digitalReadPin(DigitalPin.P14);
                break;
            case hicbit_Port.port4:
                pins.setPull(DigitalPin.P10, PinPullMode.PullUp);
                status = pins.digitalReadPin(DigitalPin.P10);
                break;
        }
        if (status == 1)
            flag = false;
        else
            flag = true;
        return flag;
    }

    /**
    * Get the ad value of the avoid Sensor moudule 避障AD
    */
    //% weight=94 blockId=hicbit_getavoidSensorValue  block="Get avoid Sensor Value|port %port|value(0~255)"
    export function hicbit_getavoidSensorValue(port: hicbit_Port): number {
        let ADCPin: AnalogPin;
        switch (port) {
            case hicbit_Port.port1:
                ADCPin = AnalogPin.P1;
                break;
            case hicbit_Port.port2:
                ADCPin = AnalogPin.P2;
                break;
            case hicbit_Port.port3:
                ADCPin = AnalogPin.P3;
                break;
            case hicbit_Port.port4:
                ADCPin = AnalogPin.P4;
                break;
        }
        let adValue = pins.analogReadPin(ADCPin);
        adValue = adValue * 255 / 1023;
        return Math.round(adValue);
    }

    /**
    * Get the obstacle avoidance sensor status,1 detect obstacle,0 no detect obstacle 避障判断
    */
    //% weight=93 blockId=hicbit_avoidSensor block="Obstacle avoidance sensor|port %port|detect obstacle"
    export function hicbit_avoidSensor(port: hicbit_Port): boolean {
        let status = 0;
        let flag: boolean = false;
        switch (port) {
            case hicbit_Port.port1:
                pins.setPull(DigitalPin.P15, PinPullMode.PullUp);
                status = pins.digitalReadPin(DigitalPin.P15);
                break;
            case hicbit_Port.port2:
                pins.setPull(DigitalPin.P13, PinPullMode.PullUp);
                status = pins.digitalReadPin(DigitalPin.P13);
                break;
            case hicbit_Port.port3:
                pins.setPull(DigitalPin.P14, PinPullMode.PullUp);
                status = pins.digitalReadPin(DigitalPin.P14);
                break;
                // if (P14_ad > 0xA)
                //     status = 1
                // else
                //     status = 0;
                // break;
            case hicbit_Port.port4:
                pins.setPull(DigitalPin.P10, PinPullMode.PullUp);
                status = pins.digitalReadPin(DigitalPin.P10);
                break;
        }
        if (status == 1)
            flag = false;
        else
            flag = true;
        return flag;
    }

    /**
    * Get the ad value of the Sound sensor moudule 声音AD
    */
    //% weight=92 blockId=hicbit_getSoundsensorValue  block="Get Sound sensor Value|port %port|value(0~255)"
    export function hicbit_getSoundsensorValue(port: hicbit_Port): number {
        let ADCPin: AnalogPin;
        switch (port) {
            case hicbit_Port.port1:
                ADCPin = AnalogPin.P1;
                break;
            case hicbit_Port.port2:
                ADCPin = AnalogPin.P2;
                break;
            case hicbit_Port.port3:
                ADCPin = AnalogPin.P3;
                break;
            case hicbit_Port.port4:
                ADCPin = AnalogPin.P4;
                break;
        }
        let adValue = pins.analogReadPin(ADCPin);
        adValue = adValue * 255 / 1023;
        return Math.round(adValue);
    }

    /**
    * Set the Sound sensor status,1 detect the sound source,0 no detect the sound source 声音
    */
    //% weight=91 blockId=hicbit_SoundSensor block="Set the Sound sensor|port %port|detect the sound source"
    export function hicbit_SoundSensor(port: hicbit_Port): boolean {
        let status = 0;
        let flag: boolean = false;
        switch (port) {
            case hicbit_Port.port1:
                pins.setPull(DigitalPin.P15, PinPullMode.PullUp);
                status = pins.digitalReadPin(DigitalPin.P15);
                break;
            case hicbit_Port.port2:
                pins.setPull(DigitalPin.P13, PinPullMode.PullUp);
                status = pins.digitalReadPin(DigitalPin.P13);
                break;
            case hicbit_Port.port3:
                pins.setPull(DigitalPin.P14, PinPullMode.PullUp);
                status = pins.digitalReadPin(DigitalPin.P14);
                break;
            case hicbit_Port.port4:
                pins.setPull(DigitalPin.P10, PinPullMode.PullUp);
                status = pins.digitalReadPin(DigitalPin.P10);
                break;
        }
        if (status == 1)
            flag = false;
        else
            flag = true;
        return flag;
    }

    /**
    * Get the collision sensor status,1 trigger,0 no trigger 碰撞
    */
    //% weight=90 blockId=hicbit_collisionsensor block="collision sensor|port %port|is trigger"    
    export function hicbit_collisionsensor(port: hicbit_Port): boolean {
        let status = 0;
        let flag: boolean = false;
        switch (port) {
            case hicbit_Port.port1:
                pins.setPull(DigitalPin.P15, PinPullMode.PullUp);
                status = pins.digitalReadPin(DigitalPin.P15);
                break;
            case hicbit_Port.port2:
                pins.setPull(DigitalPin.P13, PinPullMode.PullUp);
                status = pins.digitalReadPin(DigitalPin.P13);
                break;
            case hicbit_Port.port3:
                pins.setPull(DigitalPin.P14, PinPullMode.PullUp);
                status = pins.digitalReadPin(DigitalPin.P14);
                break;
            case hicbit_Port.port4:
                pins.setPull(DigitalPin.P10, PinPullMode.PullUp);
                status = pins.digitalReadPin(DigitalPin.P10);
                break;
        }
        if (status == 1)
            flag = false;
        else
            flag = true;
        return flag;
    }


    let lhRGBLight: hicbitRGBLight.LHhicbitRGBLight;
    /**
	 * Initialize Light belt
	 */
    //% weight=85 blockId=hicbit_initRGBLight block="Initialize light belt at port %port"
    export function hicbit_initRGBLight(port: hicbit_Port) {
        switch (port) {
            case hicbit_Port.port1:
                if (!lhRGBLight) {
                    lhRGBLight = hicbitRGBLight.create(DigitalPin.P15, 3, hicbitRGBPixelMode.RGB);
                }
                break;
            case hicbit_Port.port2:
                if (!lhRGBLight) {
                    lhRGBLight = hicbitRGBLight.create(DigitalPin.P13, 3, hicbitRGBPixelMode.RGB);
                }
                break;
            case hicbit_Port.port3:
                if (!lhRGBLight) {
                    lhRGBLight = hicbitRGBLight.create(DigitalPin.P14, 3, hicbitRGBPixelMode.RGB);
                }
                break;
            case hicbit_Port.port4:
                if (!lhRGBLight) {
                    lhRGBLight = hicbitRGBLight.create(DigitalPin.P10, 3, hicbitRGBPixelMode.RGB);
                }
                break;
        }
        hicbit_clearLight();
    }

    /**
         * Set the brightness of the strip. This flag only applies to future operation.
         * @param brightness a measure of LED brightness in 0-255. eg: 255
    */
    //% blockId="hicbit_setBrightness" block="set light brightness %brightness"
    //% weight=84
    export function hicbit_setBrightness(brightness: number): void {
        lhRGBLight.setBrightness(brightness);
    }

    /**
     * Set the color of the colored lights, after finished the setting please perform  the display of colored lights.
     */
    //% weight=83 blockId=hicbit_setPixelRGB block="Set light belt|%lightoffset|color to %rgb"
    export function hicbit_setPixelRGB(lightoffset: hicbitLightsBelt, rgb: hicbitRGBColors) {
        lhRGBLight.setPixelColor(lightoffset, rgb);
    }

    /**
     * Display the colored lights, and set the color of the colored lights to match the use. After setting the color of the colored lights, the color of the lights must be displayed.
     */
    //% weight=82 blockId=hicbit_showLight block="Show light belt"
    export function hicbit_showLight() {
        lhRGBLight.show();
    }

    /**
     * Clear the color of the colored lights and turn off the lights.
     */
    //% weight=81 blockGap=50 blockId=hicbit_clearLight block="Clear light"
    export function hicbit_clearLight() {
        lhRGBLight.clear();
    }

    let MESSAGE_HEAD: number = 0xff;
   /**
     * Perform tasks when the infrared receives the remote control code.
     */
    //% weight=89 blockId=hicbit_onQdee_remote_ir_pressed block="on remote-control|%code|pressed"
    export function hicbit_onQdee_remote_ir_pressed(code: IRKEY,body: Action) {
        control.onEvent(MESSAGE_HEAD,code,body);
     }

    /**
     * Determine the direction of remote sensing.
     */
    //% weight=88 blockId=hicbit_Rocker block="Rocker value %value"
    export function hicbit_Rocker( value: enRocker): boolean {
        let x = pins.analogReadPin(AnalogPin.P4);
        let y = pins.analogReadPin(AnalogPin.P10);
        let now_state = enRocker.Nostate;

        if (x < 100) // 上
        {
            // now_state = enRocker.Up;
            now_state = enRocker.Left;
        }
        else if (x > 900) //下
        {
            // now_state = enRocker.Down;
            now_state = enRocker.Right;
        }
        else  // 左右
        {
            if (y < 100) //右
            {
                // now_state = enRocker.Right;
                now_state = enRocker.Up;
            }
            else if (y > 900) //左
            {
                // now_state = enRocker.Left;
                now_state = enRocker.Down;
            }
        }
        if (now_state == value)
            return true;
        else
            return false;
    }

    /**
     * get dht11 temperature and humidity Value
     **/
    //% weight=87 blockId="hicbit_getDHT11value" block="DHT11 set port %port|get %dhtResult"
    export function hicbit_getDHT11value(port: hicbit_Port,dhtResult: Dht11Result): number {
        let dht11pin: DigitalPin;
        switch (port) {
            case hicbit_Port.port1:
                dht11pin = DigitalPin.P1;
                break;
            case hicbit_Port.port2:
                dht11pin = DigitalPin.P2;
                break;
            case hicbit_Port.port3:
                dht11pin = DigitalPin.P3;
                break;
            case hicbit_Port.port4:
                dht11pin = DigitalPin.P4;
                break;
        
        }
        pins.digitalWritePin(dht11pin, 0);
        basic.pause(18);
        let i = pins.digitalReadPin(dht11pin);
        pins.setPull(dht11pin, PinPullMode.PullUp);
        switch (dhtResult) {
            case 0:
                let dhtvalue1 = 0;
                let dhtcounter1 = 0;
                while (pins.digitalReadPin(dht11pin) == 1);
                while (pins.digitalReadPin(dht11pin) == 0);
                while (pins.digitalReadPin(dht11pin) == 1);
                for (let i = 0; i <= 32 - 1; i++) {
                    while (pins.digitalReadPin(dht11pin) == 0)
                        dhtcounter1 = 0;
                    while (pins.digitalReadPin(dht11pin) == 1) {
                        dhtcounter1 += 1;
                    }
                    if (i > 15) {
                        if (dhtcounter1 > 2) {
                            dhtvalue1 = dhtvalue1 + (1 << (31 - i));
                        }
                    }
                }
                return ((dhtvalue1 & 0x0000ff00) >> 8);
                break;
            case 1:
                while (pins.digitalReadPin(dht11pin) == 1);
                while (pins.digitalReadPin(dht11pin) == 0);
                while (pins.digitalReadPin(dht11pin) == 1);
                let dhtvalue = 0;
                let dhtcounter = 0;
                for (let i = 0; i <= 32 - 1; i++) {
                    while (pins.digitalReadPin(dht11pin) == 0)
                        dhtcounter = 0;
                    while (pins.digitalReadPin(dht11pin) == 1) {
                        dhtcounter += 1;
                    }
                    if (i > 15) {
                        if (dhtcounter > 2) {
                            dhtvalue = dhtvalue + (1 << (31 - i));
                        }
                    }
                }
                return Math.round((((dhtvalue & 0x0000ff00) >> 8) * 9 / 5) + 32);
                break;
            case 2:
                while (pins.digitalReadPin(dht11pin) == 1);
                while (pins.digitalReadPin(dht11pin) == 0);
                while (pins.digitalReadPin(dht11pin) == 1);

                let value = 0;
                let counter = 0;

                for (let i = 0; i <= 8 - 1; i++) {
                    while (pins.digitalReadPin(dht11pin) == 0)
                        counter = 0;
                    while (pins.digitalReadPin(dht11pin) == 1) {
                        counter += 1;
                    }
                    if (counter > 3) {
                        value = value + (1 << (7 - i));
                    }
                }
                return value;
            default:
                return 0;
        }
        
    }

}


/*
 Display package
*/
//% weight=8 icon="\uf212" color=#CC3333
namespace Display{

    export let NEW_LINE = "\r\n";

    export enum Linenum {
        //% block="first_line"
        first_line = 0x01,
        //% block="second_line"
        second_line = 0x02,
        //% block="Third_line"
        Third_line = 0x03,
        //% block="Fourth_line"
        Fourth_line = 0x04,
        //% block="Fifth_line"
        Fifth_line = 0x05,
        //% block="Sixth_line"
        Sixth_line = 0x06,
        //% block="Seventh_line"
        Seventh_line = 0x07,
        //% block="Eighth_line"
        Eighth_line = 0x08
    }

    export enum unit {
        //% block="m"
        m = 0x01,
        //% block="cm"
        cm = 0x02,
        //% block="mm"
        mm = 0x03,
        //% block="C"
        C = 0x04,
        //% block="F"
        F = 0x05,
        //% block="%"
        bf = 0x06,
        //% block="null1"
        null1 = 0x07
    }

    /**
     * Display initialization, please execute at boot time
    */
    //% weight=100 blockId=Hicbit_Display_Init block="Initialize hicbit Display"
    export function Hicbit_Display_Init() {
        serial.redirect(
            SerialPin.P8,
            SerialPin.P12,
            BaudRate.BaudRate115200);
        basic.pause(1000);
    }


    /**
        * Display clear
        */
    //% weight=99 blockId=Clearscreen block="Clear screen"
    export function Clearscreen(): void {
        let buf = pins.createBuffer(1);
        buf[0] = 9;
        serial.writeBuffer(buf);
        serial.writeString(NEW_LINE);
        basic.pause(200);
    }

    /**
        * Display ultrasonic distance
        */
    //% weight=98 blockId=setDisplay block="Display %line |text: %text | value: %value| unit1: %unit1"
    export function setDisplay(line: Linenum, text: string, value: number = 0, unit1: unit): void {
        let num: number = 1;
        let text2: string = "   ";
        let buf = pins.createBuffer(1);
        switch (line) {
            case Linenum.first_line:
                num = 1;
                break;
            case Linenum.second_line:
                num = 2;
                break;
            case Linenum.Third_line:
                num = 3;
                break;
            case Linenum.Fourth_line:
                num = 4;
                break;
            case Linenum.Fifth_line:
                num = 5;
                break;
            case Linenum.Sixth_line:
                num = 6;
                break;
            case Linenum.Seventh_line:
                num = 7;
                break;
            case Linenum.Eighth_line:
                num = 8;
                break;
        }
        buf[0] = num;
        serial.writeBuffer(buf);
        if (!text) text = "";
        serial.writeString(text);
        serial.writeString(value.toString());
        switch (unit1) {
            case unit.m:
                text2 = "m";
                break;
            case unit.cm:
                text2 = "cm";
                break;
            case unit.mm:
                text2 = "mm";
                break;
            case unit.C:
                text2 = "C";
                break;
            case unit.F:
                text2 = "F";
                break;
            case unit.bf:
                text2 = "%";
                break;
            case unit.null1:
                text2 = " ";
                break;
            
        }
        serial.writeString(text2);
        serial.writeString(NEW_LINE);
        basic.pause(200);
    }

}

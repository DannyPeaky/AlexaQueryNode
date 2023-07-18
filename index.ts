import axios, { AxiosInstance } from "axios";
import { readFileSync } from "fs";
import { writeFile } from "fs/promises";
import { homedir } from "os";
import path from "path";

export interface Device {
  accountName: string;
  deviceType: string;
  serialNumber: string;
  deviceFamily: string;
}

export interface Notification {
  alarmLabel: string;
  alarmTime: number;
  createdDate: number;
  deferredAtTime: string;
  deviceName: string;
  deviceSerialNumber: string;
  id: string;
  lastOccurrenceTimeInMilli: number;
  lastTriggerTimeInUtc: string;
  lastUpdatedDate: number;
  loopCount: number;
  originalDate: string;
  originalDurationInMillis: number;
  originalTime: string;
  remainingTime: number;
  reminderLabel: string;
  snoozedToTime: string;
  status: string;
  timerLabel: string;
  triggerTime: number;
  type: string;
}

export interface Queue {
  infoText: {
    subText1: string;
    title: string;
  };
  mainArt: {
    url: string;
  };
  progress: {
    mediaLength: number;
    mediaProgress: number;
  };
  provider: {
    providerName: string;
  };
  state: string;
}

interface Cookie {
  [key: string]: string;
}

class AlexaQuery {
  BROWSER = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:1.0) bash-script/1.0";
  URL = "https://amazon.co.uk";
  COOKIE: Cookie = {};
  CSRF = "";
  client: AxiosInstance;
  cookiePath = "";

  constructor(cookiePath: string) {
    this.client = axios.create({ validateStatus: () => true });
    this.cookiePath = path.resolve(homedir(), cookiePath);
    try {
      const cookies = readFileSync(this.cookiePath, "utf-8");
      if (cookies) this.COOKIE = JSON.parse(cookies);
    } catch (e) {
      console.log("No cookies found");
    }
  }

  async setCookie(userId: string, cookies: any) {
    this.COOKIE[userId] = cookies
      .map((c: any) => {
        c.Value = (c.Value as string).replace(/^[" ]+/, "").replace(/[" ]$/, "");
        return `${c.Name}=${c.Value}`;
      })
      .join("; ");
  }

  async checkStatus(userId: string) {
    const response = await this.client.get("https://alexa.amazon.co.uk/api/bootstrap?version=0", {
      headers: { DNT: "1", "User-Agent": this.BROWSER, Cookie: this.COOKIE[userId] },
    });
    if (response.status === 200) {
      return true;
    }
    return false;
  }

  async login(userId: string, source_token: string) {
    const response = await this.client.post(
      "https://api.amazon.co.uk/ap/exchangetoken/cookies",
      {
        app_name: "Amazon Alexa",
        requested_token_type: "auth_cookies",
        domain: "www.amazon.co.uk",
        source_token_type: "refresh_token",
        source_token,
      },
      {
        headers: {
          "x-amzn-identity-auth-domain": "api.amazon.co.uk",
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    if (response.status === 200) {
      const cookies = response.data.response.tokens.cookies[".amazon.co.uk"];
      this.setCookie(userId, cookies);

      const csrfURLs = [
        "https://alexa.amazon.co.uk/api/language",
        "https://alexa.amazon.co.uk/templates/oobe/d-device-pick.handlebars",
        "https://alexa.amazon.co.uk/api/devices-v2/device?cached=false",
      ];

      let csrfcookieexists = false;
      for (const u of csrfURLs) {
        const response = await this.client.get(u, {
          headers: {
            DNT: "1",
            Referer: "https://alexa.amazon.co.uk/spa/index.html",
            Origin: "https://alexa.amazon.co.uk",
            Cookie: this.COOKIE[userId],
          },
        });

        if (response.headers["set-cookie"]?.join("; ").includes("csrf=")) {
          const csrf = response.headers["set-cookie"][0].split(" ")[0];
          this.COOKIE[userId] += `; ${csrf}`;
          this.CSRF = csrf.split("=")[1];
          csrfcookieexists = true;
          console.log("CSRF Cookie found");
          break;
        }
      }

      if (!csrfcookieexists) {
        console.log("CSRF Cookie not found");
        return false;
      }

      await writeFile(this.cookiePath, JSON.stringify(this.COOKIE));

      return true;
    }
    return false;
  }

  async getDevices(userId: string) {
    const response = await this.client.get("https://alexa.amazon.co.uk/api/devices-v2/device?cached=false", {
      headers: {
        DNT: "1",
        Referer: "https://alexa.amazon.co.uk/spa/index.html",
        Origin: "https://alexa.amazon.co.uk",
        Cookie: this.COOKIE[userId],
        csrf: this.CSRF,
      },
    });

    const deviceTypes = ["ECHO", "ROOK", "KNIGHT"];
    const filteredDevices = response.data.devices.filter((d: any) => deviceTypes.includes(d.deviceFamily));

    return filteredDevices
      .map((d: Device) => ({
        accountName: d.accountName,
        deviceType: d.deviceType,
        serialNumber: d.serialNumber,
        deviceFamily: d.deviceFamily,
      }))
      .sort((a: any, b: any) => a.accountName.localeCompare(b.accountName)) as Device[];
  }

  async getNotifications(userId: string) {
    const response = await this.client.get("https://alexa.amazon.co.uk/api/notifications", {
      headers: {
        DNT: "1",
        "User-Agent": this.BROWSER,
        Referer: "https://alexa.amazon.co.uk/spa/index.html",
        Origin: "https://alexa.amazon.co.uk",
        "Content-Type": "application/json; charset=UTF-8",
        Cookie: this.COOKIE[userId],
        csrf: this.CSRF,
      },
    });

    return response.data.notifications as Notification[];
  }

  async getQueue(userId: string, device: Device) {
    const URL = `https://alexa.amazon.co.uk/api/np/player?deviceSerialNumber=${device.serialNumber}&deviceType=${device.deviceType}`;
    const response = await this.client.get(URL, {
      headers: {
        DNT: "1",
        "User-Agent": this.BROWSER,
        Referer: "https://alexa.amazon.co.uk/spa/index.html",
        Origin: "https://alexa.amazon.co.uk",
        "Content-Type": "application/json; charset=UTF-8",
        Cookie: this.COOKIE[userId],
        csrf: this.CSRF,
      },
    });

    return response.data.playerInfo as Queue;
  }
}

export default AlexaQuery;

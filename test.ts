import AlexaQuery from "./index";

const alexa = new AlexaQuery(".smartclock/cookies.txt");

(async () => {
  if (!(await alexa.checkStatus())) {
    console.log("Not logged in");
    if (!(await alexa.login("example_api_token"))) {
      console.log("Failed to login");
      return;
    }
  } else {
    console.log("Already logged in");
  }

  const devices = await alexa.getDevices();
  console.log(devices);

  const notifications = await alexa.getNotifications();
  console.log(notifications);

  const queue = await alexa.getQueue(devices[0]);
  console.log(queue);
})();

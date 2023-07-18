import AlexaQuery from "./index";

const alexa = new AlexaQuery(".smartclock/cookies.json");

(async () => {
  if (!(await alexa.checkStatus("clbf7o1k20002ji087qiih1ah"))) {
    console.log("Not logged in");
    if (!(await alexa.login("clbf7o1k20002ji087qiih1ah", "example_api_token"))) {
      console.log("Failed to login");
      return;
    }
  } else {
    console.log("Already logged in");
  }

  const devices = await alexa.getDevices("clbf7o1k20002ji087qiih1ah");
  console.log(devices);

  const notifications = await alexa.getNotifications("clbf7o1k20002ji087qiih1ah");
  console.log(notifications);

  const queue = await alexa.getQueue("clbf7o1k20002ji087qiih1ah", devices[0]);
  console.log(queue);
})();
